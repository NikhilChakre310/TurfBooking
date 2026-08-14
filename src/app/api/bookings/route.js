import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/jwt';
import { getDefaultConfig } from '../slots/route';

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('rzp_test_ArenaSportsTurf123')) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (err) {
  console.warn('Failed to initialize live Razorpay instance. Using mock mode.', err.message);
}

// POST: Create a new booking / Razorpay Order
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, sport, date, timeSlot, playersCount, couponCode } = body;

    if (!name || !email || !phone || !sport || !date || !timeSlot || !playersCount) {
      return NextResponse.json(
        { error: 'Required fields missing: name, email, phone, sport, date, timeSlot, playersCount' },
        { status: 400 }
      );
    }

    const config = await getDefaultConfig();

    // 1. Check if date is blocked/holiday
    if (config.blockedDates.includes(date)) {
      return NextResponse.json({ error: 'Selected date is a holiday or blocked.' }, { status: 400 });
    }

    // 2. Check if specific slot is booked or blocked
    const querySports = (sport === 'football' || sport === 'cricket')
      ? ['football', 'cricket']
      : ['pickleball'];

    const slotStart = timeSlot.split('-')[0];
    const slotStartWithSeconds = slotStart + ":00";
    const courtName = (sport === 'football' || sport === 'cricket') ? 'Main Multi-Turf A' : 'Pickleball Court Alpha';

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // 2a. Mock DB check
    if (global.isMockDB) {
      const existingBookings = global.mockBookings.filter(b => 
        b.date === date && 
        b.timeSlot === timeSlot && 
        querySports.includes(b.sport) && 
        (b.status === 'confirmed' || (b.status === 'pending' && b.createdAt >= fifteenMinutesAgo))
      );

      if (existingBookings.length > 0) {
        return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 400 });
      }

      // Check maintenance slots
      const isUnderMaintenance = config.maintenanceSlots.some(
        (mSlot) => mSlot.date === date && mSlot.slot === timeSlot && (mSlot.sport === sport || (querySports.includes(mSlot.sport) && sport !== 'pickleball'))
      );
      if (isUnderMaintenance) {
        return NextResponse.json({ error: 'This slot is undergoing maintenance.' }, { status: 400 });
      }
    } else {
      // 2b. PostgreSQL Check
      const dbBookingSlots = await prisma.bookingSlot.findMany({
        where: {
          bookingDate: new Date(date),
          court: { name: courtName },
          timeSlot: { startTime: slotStartWithSeconds },
          booking: {
            OR: [
              { status: 'confirmed' },
              { status: 'pending', createdAt: { gte: fifteenMinutesAgo } }
            ]
          }
        }
      });

      if (dbBookingSlots.length > 0) {
        return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 400 });
      }

      // Check maintenance slots
      const maintenance = await prisma.maintenanceSlot.findFirst({
        where: {
          maintenanceDate: new Date(date),
          court: { name: courtName },
          timeSlot: { startTime: slotStartWithSeconds }
        }
      });

      if (maintenance) {
        return NextResponse.json({ error: 'This slot is undergoing maintenance.' }, { status: 400 });
      }
    }

    // 3. Price Calculation
    const queryDate = new Date(date);
    const isWeekend = queryDate.getDay() === 0 || queryDate.getDay() === 6;
    const isPeak = config.peakHours.includes(slotStart);
    const sportPricing = config.pricing[sport];
    const rateType = isWeekend ? 'weekend' : 'weekday';
    const pricingCategory = isPeak ? 'peak' : 'base';
    const basePrice = sportPricing[rateType][pricingCategory];

    // 4. Coupon validation
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      if (global.isMockDB) {
        const coupon = global.mockCoupons.find(c => 
          c.code === couponCode.toUpperCase() && 
          c.isActive && 
          c.expiryDate > new Date()
        );
        if (coupon && basePrice >= coupon.minBookingAmount) {
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((basePrice * coupon.discountValue) / 100);
          } else {
            discountAmount = coupon.discountValue;
          }
        }
      } else {
        const coupon = await prisma.coupon.findFirst({
          where: {
            code: couponCode.toUpperCase(),
            isActive: true,
            expiryDate: { gt: new Date() }
          }
        });
        if (coupon && basePrice >= Number(coupon.minBookingAmount)) {
          couponId = coupon.id;
          const val = Number(coupon.discountValue);
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((basePrice * val) / 100);
          } else {
            discountAmount = val;
          }
          if (coupon.maxDiscountAmount && coupon.discountType === 'percentage') {
            const maxCap = Number(coupon.maxDiscountAmount);
            if (discountAmount > maxCap) {
              discountAmount = maxCap;
            }
          }
        }
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);

    // 5. Generate unique booking ID
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bookingId = `AST-${randomHex}`;

    // 6. Check Auth context to attach userId
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.userId : null;

    // 7. Razorpay Order Creation
    let razorpayOrderId = '';
    let isMockPayment = true;

    if (razorpay && finalAmount > 0) {
      try {
        const order = await razorpay.orders.create({
          amount: finalAmount * 100, // amount in paisa
          currency: 'INR',
          receipt: bookingId,
        });
        razorpayOrderId = order.id;
        isMockPayment = false;
      } catch (err) {
        console.warn('Razorpay order creation failed, falling back to mock payment ID', err.message);
        razorpayOrderId = `order_${crypto.randomBytes(6).toString('hex')}`;
      }
    } else {
      razorpayOrderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
    }

    // 8. Create booking entry in DB
    if (global.isMockDB) {
      const newBooking = {
        _id: `booking_${Math.random().toString(36).substr(2, 9)}`,
        bookingId,
        userId,
        name,
        email,
        phone,
        sport,
        date,
        timeSlot,
        playersCount,
        price: basePrice,
        couponApplied: couponCode || '',
        discountAmount,
        finalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        razorpayOrderId,
        createdAt: new Date(),
      };
      global.mockBookings.push(newBooking);
    } else {
      // Find relational DB dependencies
      const sportDoc = await prisma.sport.findUnique({ where: { name: sport } });
      const courtDoc = await prisma.court.findFirst({ where: { name: courtName } });
      const slotDoc = await prisma.timeSlot.findFirst({
        where: {
          courtId: courtDoc.id,
          startTime: slotStartWithSeconds
        }
      });

      // Write booking atomic transaction
      await prisma.$transaction(async (tx) => {
        // Double check availability one last time inside transaction lock
        const collision = await tx.bookingSlot.findFirst({
          where: {
            courtId: courtDoc.id,
            bookingDate: new Date(date),
            timeSlotId: slotDoc.id,
            booking: {
              OR: [
                { status: 'confirmed' },
                { status: 'pending', createdAt: { gte: fifteenMinutesAgo } }
              ]
            }
          }
        });

        if (collision) {
          throw new Error('Slot occupied');
        }

        const newBooking = await tx.booking.create({
          data: {
            bookingNumber: bookingId,
            userId: userId || null,
            guestName: userId ? null : name,
            guestEmail: userId ? null : email,
            guestPhone: userId ? null : phone,
            couponId: couponId,
            totalPrice: basePrice,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            status: 'pending',
            payments: {
              create: {
                paymentMethod: 'razorpay',
                gatewayOrderId: razorpayOrderId,
                amount: finalAmount,
                status: 'pending'
              }
            },
            bookingSlots: {
              create: {
                courtId: courtDoc.id,
                sportId: sportDoc.id,
                timeSlotId: slotDoc.id,
                bookingDate: new Date(date),
                priceCharged: finalAmount
              }
            }
          }
        });

        if (couponId) {
          await tx.couponRedemption.create({
            data: {
              couponId: couponId,
              userId: userId || null,
              bookingId: newBooking.id
            }
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      bookingId,
      razorpayOrderId,
      amount: finalAmount,
      isMockPayment,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_ArenaSportsTurf123',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    if (error.message === 'Slot occupied') {
      return NextResponse.json({ error: 'This time slot was just booked by another user. Please choose another.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error initiating booking' }, { status: 500 });
  }
}

// GET: Retrieve bookings for User Dashboard
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get('mobile');
    const bookingId = searchParams.get('bookingId');

    const authUser = getAuthUser(req);

    // 1. Mock DB Path
    if (global.isMockDB) {
      const bookings = global.mockBookings.filter(b => {
        if (authUser) {
          if (authUser.role === 'admin' && searchParams.get('all') === 'true') {
            return true;
          }
          return b.userId === authUser.userId;
        } else if (mobile && bookingId) {
          return b.phone === mobile && b.bookingId === bookingId.toUpperCase();
        } else if (bookingId) {
          return b.bookingId === bookingId.toUpperCase();
        }
        return false;
      });
      bookings.sort((x, y) => `${y.date} ${y.timeSlot}`.localeCompare(`${x.date} ${x.timeSlot}`));
      return NextResponse.json({ success: true, bookings });
    }

    // 2. PostgreSQL Prisma Path
    let dbBookings = [];
    if (authUser) {
      if (authUser.role === 'admin' && searchParams.get('all') === 'true') {
        dbBookings = await prisma.booking.findMany({
          include: {
            user: true,
            bookingSlots: {
              include: {
                court: true,
                sport: true,
                timeSlot: true
              }
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        dbBookings = await prisma.booking.findMany({
          where: { userId: authUser.userId },
          include: {
            user: true,
            bookingSlots: {
              include: {
                court: true,
                sport: true,
                timeSlot: true
              }
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (mobile && bookingId) {
      dbBookings = await prisma.booking.findMany({
        where: {
          bookingNumber: bookingId.toUpperCase(),
          OR: [
            { guestPhone: mobile },
            { user: { phone: mobile } }
          ]
        },
        include: {
          user: true,
          bookingSlots: {
            include: {
              court: true,
              sport: true,
              timeSlot: true
            }
          },
          payments: true
        }
      });
    } else if (bookingId) {
      dbBookings = await prisma.booking.findMany({
        where: { bookingNumber: bookingId.toUpperCase() },
        include: {
          user: true,
          bookingSlots: {
            include: {
              court: true,
              sport: true,
              timeSlot: true
            }
          },
          payments: true
        }
      });
    } else {
      return NextResponse.json({ error: 'Authentication required, or provide bookingId + mobile details' }, { status: 401 });
    }

    // Map Prisma objects back to frontend formats
    const bookings = dbBookings.map(b => {
      const slot = b.bookingSlots[0];
      const timeSlotStr = slot 
        ? `${slot.timeSlot.startTime.substring(0, 5)}-${slot.timeSlot.endTime.substring(0, 5)}`
        : '';
      const payment = b.payments[0];

      return {
        _id: b.id,
        bookingId: b.bookingNumber,
        userId: b.userId,
        name: b.guestName || (b.user ? b.user.name : ''),
        email: b.guestEmail || (b.user ? b.user.email : ''),
        phone: b.guestPhone || (b.user ? b.user.phone : ''),
        sport: slot ? slot.sport.name : 'football',
        date: slot ? slot.bookingDate.toISOString().split('T')[0] : '',
        timeSlot: timeSlotStr,
        playersCount: 0,
        price: Number(b.totalPrice),
        discountAmount: Number(b.discountAmount),
        finalAmount: Number(b.finalAmount),
        status: b.status,
        paymentStatus: payment ? (payment.status === 'completed' ? 'paid' : payment.status === 'refunded' ? 'refunded' : 'pending') : 'pending',
        razorpayOrderId: payment ? payment.gatewayOrderId : '',
        razorpayPaymentId: payment ? payment.gatewayPaymentId : '',
        createdAt: b.createdAt
      };
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Server error retrieving bookings' }, { status: 500 });
  }
}
