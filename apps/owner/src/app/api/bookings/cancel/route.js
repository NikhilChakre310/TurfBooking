import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@repo/database';
import { getAuthUser } from '@/lib/jwt';
import { getDefaultConfig } from '@/app/api/slots/route';
import { sendNotification } from '@/lib/notifications';

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, phone, preview = false } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const bookingIdUpper = bookingId.toUpperCase();

    // 1. Mock DB Execution path
    if (global.isMockDB) {
      const booking = global.mockBookings.find(b => b.bookingId === bookingIdUpper);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      if (booking.status === 'cancelled') {
        return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
      }

      // Check ownership if not admin
      const authUser = getAuthUser(req);
      if (!authUser) {
        if (!phone || booking.phone !== phone) {
          return NextResponse.json({ error: 'Mobile number mismatch for this booking ID' }, { status: 403 });
        }
      } else {
        if (authUser.role !== 'admin' && booking.userId?.toString() !== authUser.userId) {
          return NextResponse.json({ error: 'You are not authorized to cancel this booking' }, { status: 403 });
        }
      }

      const config = await getDefaultConfig();

      const slotStart = booking.timeSlot.split('-')[0];
      const bookingTime = new Date(`${booking.date}T${slotStart.padStart(2, '0')}:00.000+05:30`);
      const timeDiffMs = bookingTime.getTime() - Date.now();
      const diffHours = timeDiffMs / (1000 * 60 * 60);

      if (timeDiffMs < 0) {
        return NextResponse.json({ error: 'Cannot cancel a booking that has already started or passed' }, { status: 400 });
      }

      if (diffHours < config.cancellationHours) {
        return NextResponse.json(
          { error: `Cancellation is only allowed up to ${config.cancellationHours} hours before slot time.` },
          { status: 400 }
        );
      }

      const refundPercentage = config.refundPercentage;
      const refundAmount = Math.round((booking.finalAmount * refundPercentage) / 100);

      if (preview) {
        return NextResponse.json({
          success: true,
          preview: true,
          bookingId: booking.bookingId,
          finalAmount: booking.finalAmount,
          refundPercentage,
          refundAmount,
          cancellationHoursLimit: config.cancellationHours,
          hoursRemaining: Math.round(diffHours * 10) / 10,
        });
      }

      // Perform cancellation
      booking.status = 'cancelled';
      booking.paymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : 'pending';
      booking.refundAmount = refundAmount;

      // Deduct points
      if (booking.userId) {
        const pointsDeducted = Math.floor(booking.finalAmount / 10);
        if (pointsDeducted > 0) {
          const userIdx = global.mockUsers.findIndex(u => u._id === booking.userId);
          if (userIdx !== -1) {
            global.mockUsers[userIdx].loyaltyPoints = Math.max(0, global.mockUsers[userIdx].loyaltyPoints - pointsDeducted);
          }
        }
      }

      // Send simulated notifications
      const bookingDetails = `${booking.sport.toUpperCase()} on ${booking.date} at ${booking.timeSlot}`;
      await sendNotification({
        recipient: booking.phone,
        type: 'sms',
        message: `Booking Cancelled! Your booking ${booking.bookingId} is cancelled. Refund of ₹${refundAmount} initiated.`,
      });

      return NextResponse.json({
        success: true,
        preview: false,
        message: 'Booking successfully cancelled (Mock Mode)',
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

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }

    // Resolve details
    const slot = booking.bookingSlots[0];
    const slotStart = slot ? slot.timeSlot.startTime.substring(0, 5) : '00:00';
    const bookingDateStr = slot ? slot.bookingDate.toISOString().split('T')[0] : '';
    const timeSlotStr = slot ? `${slot.timeSlot.startTime.substring(0, 5)}-${slot.timeSlot.endTime.substring(0, 5)}` : '';
    const sportName = slot ? slot.sport.name : 'football';

    const phoneLookup = booking.guestPhone || (booking.user ? booking.user.phone : '');
    const emailLookup = booking.guestEmail || (booking.user ? booking.user.email : '');
    const nameLookup = booking.guestName || (booking.user ? booking.user.name : '');

    // Check ownership if not admin
    const authUser = getAuthUser(req);
    if (!authUser) {
      if (!phone || phoneLookup !== phone) {
        return NextResponse.json({ error: 'Mobile number mismatch for this booking ID' }, { status: 403 });
      }
    } else {
      if (authUser.role !== 'admin' && booking.userId !== authUser.userId) {
        return NextResponse.json({ error: 'You are not authorized to cancel this booking' }, { status: 403 });
      }
    }

    const config = await getDefaultConfig();

    // Timezone safe calculations
    const bookingTime = new Date(`${bookingDateStr}T${slotStart.padStart(2, '0')}:00.000+05:30`);
    const timeDiffMs = bookingTime.getTime() - Date.now();
    const diffHours = timeDiffMs / (1000 * 60 * 60);

    if (timeDiffMs < 0) {
      return NextResponse.json({ error: 'Cannot cancel a booking that has already started or passed' }, { status: 400 });
    }

    if (diffHours < config.cancellationHours) {
      return NextResponse.json(
        { error: `Cancellation is only allowed up to ${config.cancellationHours} hours before slot time.` },
        { status: 400 }
      );
    }

    const finalAmountVal = Number(booking.finalAmount);
    const refundPercentage = config.refundPercentage;
    const refundAmount = Math.round((finalAmountVal * refundPercentage) / 100);

    if (preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        bookingId: booking.bookingNumber,
        finalAmount: finalAmountVal,
        refundPercentage,
        refundAmount,
        cancellationHoursLimit: config.cancellationHours,
        hoursRemaining: Math.round(diffHours * 10) / 10,
      });
    }

    // Perform cancel updates in PostgreSQL Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'cancelled',
          refundAmount: refundAmount
        }
      });

      // 2. Update payment status to refunded
      const payment = booking.payments[0];
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundTransactionId: `ref_${crypto.randomBytes(6).toString('hex')}`
          }
        });
      }

      // 3. Deduct loyalty points
      if (booking.userId) {
        const pointsDeducted = Math.floor(finalAmountVal / 10);
        if (pointsDeducted > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              pointsChange: -pointsDeducted,
              transactionType: 'booking_refund'
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
      message: `Booking Cancelled! Your booking ${booking.bookingNumber} for ${bookingDetails} is cancelled. Refund of ₹${refundAmount} has been initiated.`,
    });

    // Email Simulation
    await sendNotification({
      recipient: emailLookup,
      type: 'email',
      subject: `The MatchPoint - Booking Cancellation ${booking.bookingNumber}`,
      message: `Hi ${nameLookup},\n\nYour booking ${booking.bookingNumber} for ${bookingDetails} has been successfully cancelled.\n\nRefund Initiated: ₹${refundAmount} (${refundPercentage}% refund rate)\nPayment Status: Refunded\n\nThe slot has been released back to directory availability.\n\nCheers,\nThe MatchPoint Team`,
    });

    return NextResponse.json({
      success: true,
      preview: false,
      message: 'Booking successfully cancelled and slot updated',
      booking: {
        bookingId: booking.bookingNumber,
        status: 'cancelled',
        refundAmount
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Server error processing cancellation' }, { status: 500 });
  }
}
