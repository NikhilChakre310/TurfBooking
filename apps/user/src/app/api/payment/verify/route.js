import { NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '@repo/database';
import { sendNotification } from '@/lib/notifications';

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isMock } = body;

    if (!bookingId || !razorpayOrderId) {
      return NextResponse.json(
        { error: 'Required fields missing: bookingId, razorpayOrderId' },
        { status: 400 }
      );
    }

    const bookingIdUpper = bookingId.toUpperCase();

    // 1. Mock DB Execution path
    if (global.isMockDB) {
      const booking = global.mockBookings.find(b => b.bookingId === bookingIdUpper);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Generate QR Code data url on-the-fly
      const qrData = JSON.stringify({
        bookingId: booking.bookingId,
        name: booking.name,
        sport: booking.sport,
        date: booking.date,
        slot: booking.timeSlot,
        amount: booking.finalAmount,
      });
      
      let qrCodeBase64 = '';
      try {
        qrCodeBase64 = await QRCode.toDataURL(qrData);
      } catch (err) {
        console.error('Failed to generate QR Code:', err.message);
      }

      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.razorpayPaymentId = razorpayPaymentId || `pay_mock_${crypto.randomBytes(6).toString('hex')}`;
      booking.razorpaySignature = razorpaySignature || 'mock_sig';
      booking.qrCode = qrCodeBase64;

      if (booking.userId) {
        const pointsAwarded = Math.floor(booking.finalAmount / 10);
        if (pointsAwarded > 0) {
          const userIdx = global.mockUsers.findIndex(u => u._id === booking.userId);
          if (userIdx !== -1) {
            global.mockUsers[userIdx].loyaltyPoints += pointsAwarded;
          }
        }
      }

      const bookingDetails = `${booking.sport.toUpperCase()} on ${booking.date} at ${booking.timeSlot}`;
      await sendNotification({
        recipient: booking.phone,
        type: 'sms',
        message: `Booking Confirmed! Slot for ${bookingDetails} is booked. ID: ${booking.bookingId}. Show QR at entry.`,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and booking confirmed (Mock Mode)',
        booking,
      });
    }

    // 2. PostgreSQL Prisma execution path
    const booking = await prisma.booking.findUnique({
      where: { bookingNumber: bookingIdUpper },
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Payment signature verification checks
    let isValid = false;
    if (isMock || razorpayOrderId.startsWith('order_mock_')) {
      isValid = true;
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: 'Razorpay secret key not configured' }, { status: 500 });
      }
      
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Resolve details for QR and notifications
    const slot = booking.bookingSlots[0];
    const slotStart = slot ? slot.timeSlot.startTime.substring(0, 5) : '';
    const bookingDateStr = slot ? slot.bookingDate.toISOString().split('T')[0] : '';
    const timeSlotStr = slot ? `${slot.timeSlot.startTime.substring(0, 5)}-${slot.timeSlot.endTime.substring(0, 5)}` : '';
    const sportName = slot ? slot.sport.name : 'football';

    const phoneLookup = booking.guestPhone || (booking.user ? booking.user.phone : '');
    const emailLookup = booking.guestEmail || (booking.user ? booking.user.email : '');
    const nameLookup = booking.guestName || (booking.user ? booking.user.name : '');
    const finalAmountVal = Number(booking.finalAmount);

    // Generate QR Code data url on-the-fly
    const qrData = JSON.stringify({
      bookingId: booking.bookingNumber,
      name: nameLookup,
      sport: sportName,
      date: bookingDateStr,
      slot: timeSlotStr,
      amount: finalAmountVal,
    });
    
    let qrCodeBase64 = '';
    try {
      qrCodeBase64 = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Failed to generate QR Code:', err.message);
    }

    const payId = razorpayPaymentId || `pay_mock_${crypto.randomBytes(6).toString('hex')}`;
    const sig = razorpaySignature || 'mock_sig';

    // Update in database transaction
    await prisma.$transaction(async (tx) => {
      // 2a. Update booking confirmation status & QR Code
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          qrCodeData: qrCodeBase64
        }
      });

      // 2b. Update Payment row status to completed
      const payment = booking.payments[0];
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            gatewayPaymentId: payId,
            gatewaySignature: sig
          }
        });
      }

      // 2c. Award loyalty points ledger transaction
      if (booking.userId) {
        const pointsAwarded = Math.floor(finalAmountVal / 10);
        if (pointsAwarded > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              pointsChange: pointsAwarded,
              transactionType: 'booking_accrual'
            }
          });
        }
      }
    });

    // Trigger confirmations
    const bookingDetails = `${sportName.toUpperCase()} on ${bookingDateStr} at ${timeSlotStr}`;
    
    // SMS Simulation
    await sendNotification({
      recipient: phoneLookup,
      type: 'sms',
      message: `Booking Confirmed! Your slot for ${bookingDetails} is booked. Booking ID: ${booking.bookingNumber}. Show QR at entry. The MatchPoint.`,
    });

    // Email Simulation
    await sendNotification({
      recipient: emailLookup,
      type: 'email',
      subject: `The MatchPoint - Booking Confirmation ${booking.bookingNumber}`,
      message: `Hi ${nameLookup},\n\nThank you for choosing The MatchPoint!\nYour booking for ${bookingDetails} has been successfully paid and confirmed.\n\nBooking ID: ${booking.bookingNumber}\nAmount Paid: ₹${finalAmountVal}\nTransaction ID: ${payId}\n\nYou can view your QR ticket in your dashboard.\n\nCheers,\nThe MatchPoint Team`,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking: {
        bookingId: booking.bookingNumber,
        status: 'confirmed',
        qrCode: qrCodeBase64
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Server error verifying payment' }, { status: 500 });
  }
}
