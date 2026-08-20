import { NextResponse } from 'next/server';
import prisma from '@repo/database';
import { getAuthUser } from '@/lib/jwt';
import { getDefaultConfig } from '../slots/route';

export async function GET(req) {
  try {
    // Auth Check
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stats'; // stats, bookings, config

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // 1. STATS ROUTE
    if (type === 'stats') {
      const now = new Date();
      
      // Timezone-safe local date calculation for Asia/Kolkata (IST)
      const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
      const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA outputs YYYY-MM-DD
      const todayStr = formatter.format(now);
      
      // Timezone-safe start of month calculation
      const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const startOfMonth = new Date(todayIST.getFullYear(), todayIST.getMonth(), 1, 0, 0, 0);

      let todaysBookingsCount = 0;
      let monthlyRevenue = 0;
      let pendingRefunds = 0;
      let mostPopularSport = 'None';
      let occupancyRate = 0;

      const config = await getDefaultConfig();
      const startMin = timeToMinutes(config.openingTime);
      const endMin = timeToMinutes(config.closingTime);
      const duration = config.slotDuration;
      const slotsPerSport = Math.floor((endMin - startMin) / duration);
      const totalPossibleSlotsToday = slotsPerSport * 2; 

      if (global.isMockDB) {
        todaysBookingsCount = global.mockBookings.filter(b => 
          b.date === todayStr && 
          (b.status === 'confirmed' || (b.status === 'pending' && b.createdAt >= fifteenMinutesAgo))
        ).length;
        
        monthlyRevenue = global.mockBookings
          .filter(b => b.createdAt >= startOfMonth && b.paymentStatus === 'paid' && b.status === 'confirmed')
          .reduce((sum, b) => sum + b.finalAmount, 0);

        pendingRefunds = global.mockBookings
          .filter(b => b.createdAt >= startOfMonth && b.paymentStatus === 'refunded' && b.status === 'cancelled')
          .reduce((sum, b) => sum + b.refundAmount, 0);

        const counts = {};
        global.mockBookings.forEach(b => {
          if (b.status === 'confirmed' || (b.status === 'pending' && b.createdAt >= fifteenMinutesAgo)) {
            counts[b.sport] = (counts[b.sport] || 0) + 1;
          }
        });
        const sortedSports = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
        mostPopularSport = sortedSports[0] || 'None';

        const bookedCount = global.mockBookings.filter(b => b.date === todayStr && b.status === 'confirmed').length;
        occupancyRate = totalPossibleSlotsToday > 0 
          ? Math.round((bookedCount / totalPossibleSlotsToday) * 100) 
          : 0;
      } else {
        // Today's Booking Count
        todaysBookingsCount = await prisma.booking.count({
          where: {
            bookingSlots: {
              some: {
                bookingDate: new Date(todayStr)
              }
            },
            OR: [
              { status: 'confirmed' },
              { status: 'pending', createdAt: { gte: fifteenMinutesAgo } }
            ]
          }
        });

        // Monthly Revenue
        const monthlyPaidBookings = await prisma.booking.findMany({
          where: {
            createdAt: { gte: startOfMonth },
            status: 'confirmed',
            payments: {
              some: { status: 'completed' }
            }
          }
        });
        monthlyRevenue = monthlyPaidBookings.reduce((sum, b) => sum + Number(b.finalAmount), 0);

        // Pending/Paid Refunds
        const monthlyRefundedBookings = await prisma.booking.findMany({
          where: {
            createdAt: { gte: startOfMonth },
            status: 'cancelled',
            payments: {
              some: { status: 'refunded' }
            }
          }
        });
        pendingRefunds = monthlyRefundedBookings.reduce((sum, b) => sum + Number(b.refundAmount), 0);

        // Popular Sport
        const sportCounts = await prisma.bookingSlot.groupBy({
          by: ['sportId'],
          _count: {
            sportId: true
          },
          where: {
            booking: {
              OR: [
                { status: 'confirmed' },
                { status: 'pending', createdAt: { gte: fifteenMinutesAgo } }
              ]
            }
          },
          orderBy: {
            _count: {
              sportId: 'desc'
            }
          }
        });
        if (sportCounts.length > 0) {
          const popularSportDoc = await prisma.sport.findUnique({
            where: { id: sportCounts[0].sportId }
          });
          mostPopularSport = popularSportDoc?.name || 'None';
        }

        // Occupancy Rate
        const bookedCount = await prisma.bookingSlot.count({
          where: {
            bookingDate: new Date(todayStr),
            booking: { status: 'confirmed' }
          }
        });
        occupancyRate = totalPossibleSlotsToday > 0 
          ? Math.round((bookedCount / totalPossibleSlotsToday) * 100) 
          : 0;
      }

      return NextResponse.json({
        success: true,
        stats: {
          todaysBookings: todaysBookingsCount,
          monthlyRevenue,
          occupancyRate,
          mostPopularSport,
          pendingRefunds,
        },
      });
    }

    // 2. BOOKINGS LIST ROUTE
    if (type === 'bookings') {
      const q = searchParams.get('q') || '';
      const sport = searchParams.get('sport') || '';
      const status = searchParams.get('status') || '';

      let bookingsList = [];
      if (global.isMockDB) {
        bookingsList = global.mockBookings.filter(b => {
          if (sport && b.sport !== sport) return false;
          if (status && b.status !== status) return false;
          if (q) {
            const regex = new RegExp(q, 'i');
            return regex.test(b.bookingId) || regex.test(b.name) || regex.test(b.email) || regex.test(b.phone);
          }
          return true;
        });
        bookingsList.sort((x, y) => `${y.date} ${y.timeSlot}`.localeCompare(`${x.date} ${x.timeSlot}`));
      } else {
        const query = {};
        if (sport) {
          query.bookingSlots = {
            some: {
              sport: { name: sport }
            }
          };
        }
        if (status) {
          query.status = status;
        }
        if (q) {
          query.OR = [
            { bookingNumber: { contains: q, mode: 'insensitive' } },
            { guestName: { contains: q, mode: 'insensitive' } },
            { guestEmail: { contains: q, mode: 'insensitive' } },
            { guestPhone: { contains: q, mode: 'insensitive' } },
            { user: { name: { contains: q, mode: 'insensitive' } } }
          ];
        }

        const dbBookingsList = await prisma.booking.findMany({
          where: query,
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
          orderBy: {
            createdAt: 'desc'
          }
        });

        bookingsList = dbBookingsList.map(b => {
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
      }

      return NextResponse.json({ success: true, bookings: bookingsList });
    }

    if (type === 'config') {
      const config = await getDefaultConfig();
      return NextResponse.json({ success: true, config });
    }

    return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'Server error retrieving admin statistics' }, { status: 500 });
  }
}

// POST: Update Admin Configuration
export async function POST(req) {
  try {
    // Auth Check
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const body = await req.json();

    if (global.isMockDB) {
      const config = await getDefaultConfig();
      if (body.openingTime) config.openingTime = body.openingTime;
      if (body.closingTime) config.closingTime = body.closingTime;
      if (body.slotDuration) config.slotDuration = Number(body.slotDuration);
      if (body.pricing) config.pricing = body.pricing;
      if (body.peakHours) config.peakHours = body.peakHours;
      if (body.cancellationHours !== undefined) config.cancellationHours = Number(body.cancellationHours);
      if (body.refundPercentage !== undefined) config.refundPercentage = Number(body.refundPercentage);
      if (body.blockedDates) config.blockedDates = body.blockedDates;
      if (body.maintenanceSlots) config.maintenanceSlots = body.maintenanceSlots;

      global.mockConfig = config;
      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully (Mock Mode)',
        config,
      });
    }

    // 2. PostgreSQL Prisma Update Config
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Arena Sports Turf - HSR Layout',
          address: '123 Main Road, HSR Sector 3, Bangalore',
          phone: '+91 98765 43210',
          email: 'hsr@arenasports.com'
        }
      });
    }

    const upsertSetting = async (key, val) => {
      await prisma.setting.upsert({
        where: {
          branchId_key: {
            branchId: branch.id,
            key: key
          }
        },
        update: { value: String(val) },
        create: {
          branchId: branch.id,
          key: key,
          value: String(val),
          valueType: typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string'
        }
      });
    };

    if (body.openingTime) await upsertSetting('opening_time', body.openingTime);
    if (body.closingTime) await upsertSetting('closing_time', body.closingTime);
    if (body.slotDuration) await upsertSetting('slot_duration', Number(body.slotDuration));
    if (body.cancellationHours !== undefined) await upsertSetting('cancellation_hours_limit', Number(body.cancellationHours));
    if (body.refundPercentage !== undefined) await upsertSetting('default_refund_percentage', Number(body.refundPercentage));

    // Blocked dates
    if (body.blockedDates) {
      await prisma.blockedDate.deleteMany({
        where: { branchId: branch.id }
      });
      await prisma.blockedDate.createMany({
        data: body.blockedDates.map(dateStr => ({
          branchId: branch.id,
          blockedDate: new Date(dateStr),
          reason: 'Holiday'
        }))
      });
    }

    // Maintenance slots
    if (body.maintenanceSlots) {
      await prisma.maintenanceSlot.deleteMany({});
      for (const mSlot of body.maintenanceSlots) {
        const courtName = (mSlot.sport === 'football' || mSlot.sport === 'cricket') ? 'Main Multi-Turf A' : 'Pickleball Court Alpha';
        const courtDoc = await prisma.court.findFirst({ where: { name: courtName } });
        const slotStart = mSlot.slot.split('-')[0] + ":00";
        const slotDoc = await prisma.timeSlot.findFirst({
          where: {
            courtId: courtDoc.id,
            startTime: slotStart
          }
        });
        if (courtDoc && slotDoc) {
          await prisma.maintenanceSlot.create({
            data: {
              courtId: courtDoc.id,
              maintenanceDate: new Date(mSlot.date),
              timeSlotId: slotDoc.id,
              reason: 'Maintenance'
            }
          });
        }
      }
    }

    // Peak hours
    if (body.peakHours) {
      await prisma.timeSlot.updateMany({
        data: { isPeak: false }
      });
      for (const startHour of body.peakHours) {
        await prisma.timeSlot.updateMany({
          where: {
            startTime: startHour + ":00"
          },
          data: { isPeak: true }
        });
      }
    }

    // Pricing Rules
    if (body.pricing) {
      await prisma.pricingRule.deleteMany({});
      for (const sport of ['football', 'cricket', 'pickleball']) {
        const sportDoc = await prisma.sport.findUnique({ where: { name: sport } });
        const courtName = (sport === 'football' || sport === 'cricket') ? 'Main Multi-Turf A' : 'Pickleball Court Alpha';
        const courtDoc = await prisma.court.findFirst({ where: { name: courtName } });
        
        const rates = body.pricing[sport];
        if (rates && sportDoc && courtDoc) {
          for (const day of ['weekday', 'weekend']) {
            for (const category of ['base', 'peak']) {
              const priceVal = rates[day][category];
              await prisma.pricingRule.create({
                data: {
                  courtId: courtDoc.id,
                  sportId: sportDoc.id,
                  dayType: day,
                  pricingCategory: category,
                  price: priceVal
                }
              });
            }
          }
        }
      }
    }

    const updatedConfig = await getDefaultConfig();

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Server error updating configuration' }, { status: 500 });
  }
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
