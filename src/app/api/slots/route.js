import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function getDefaultConfig() {
  if (global.isMockDB) {
    return global.mockConfig;
  }

  try {
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

    const dbSettings = await prisma.setting.findMany({
      where: { branchId: branch.id }
    });

    const dbPricingRules = await prisma.pricingRule.findMany();

    const dbTimeSlots = await prisma.timeSlot.findMany({
      where: { isActive: true }
    });

    const dbBlockedDates = await prisma.blockedDate.findMany({
      where: { branchId: branch.id }
    });

    const dbMaintenanceSlots = await prisma.maintenanceSlot.findMany({
      include: { timeSlot: true }
    });

    // Map list to config singleton schema
    const config = {
      openingTime: dbSettings.find(s => s.key === 'opening_time')?.value || '05:00',
      closingTime: dbSettings.find(s => s.key === 'closing_time')?.value || '23:00',
      slotDuration: Number(dbSettings.find(s => s.key === 'slot_duration')?.value || 60),
      cancellationHours: Number(dbSettings.find(s => s.key === 'cancellation_hours_limit')?.value || 6),
      refundPercentage: Number(dbSettings.find(s => s.key === 'default_refund_percentage')?.value || 100),
      pricing: {
        football: {
          weekday: { base: 800, peak: 1000 },
          weekend: { base: 800, peak: 1000 },
        },
        cricket: {
          weekday: { base: 800, peak: 1000 },
          weekend: { base: 800, peak: 1000 },
        },
        pickleball: {
          weekday: { base: 800, peak: 1000 },
          weekend: { base: 800, peak: 1000 },
        },
      },
      peakHours: dbTimeSlots.filter(t => t.isPeak).map(t => t.startTime.substring(0, 5)),
      blockedDates: dbBlockedDates.map(bd => bd.blockedDate.toISOString().split('T')[0]),
      maintenanceSlots: dbMaintenanceSlots.map(ms => ({
        date: ms.maintenanceDate.toISOString().split('T')[0],
        slot: `${ms.timeSlot.startTime.substring(0, 5)}-${ms.timeSlot.endTime.substring(0, 5)}`,
        sport: 'football' // defaults
      }))
    };

    // Override base prices with values from pricing rules table
    if (dbPricingRules.length > 0) {
      dbPricingRules.forEach(rule => {
        const sportName = rule.sportId === 's1000000-0000-0000-0000-000000000000' ? 'football' :
                          rule.sportId === 's2000000-0000-0000-0000-000000000000' ? 'cricket' : 'pickleball';
        const dayType = rule.dayType;
        const pricingCategory = rule.pricingCategory;
        if (config.pricing[sportName] && config.pricing[sportName][dayType]) {
          config.pricing[sportName][dayType][pricingCategory] = Number(rule.price);
        }
      });
    }

    if (config.peakHours.length === 0) {
      config.peakHours = ['18:00', '19:00', '20:00', '21:00', '22:00'];
    }

    return config;
  } catch (err) {
    console.warn('Prisma config query failed, falling back to mock config:', err.message);
    return global.mockConfig;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport'); // football, cricket, pickleball
    const date = searchParams.get('date');   // YYYY-MM-DD

    if (!sport || !date) {
      return NextResponse.json(
        { error: 'sport and date query parameters are required' },
        { status: 400 }
      );
    }

    const config = await getDefaultConfig();

    // Check if the entire date is blocked
    const isHoliday = config.blockedDates.includes(date);

    // Calculate slots list
    const startMin = timeToMinutes(config.openingTime);
    const endMin = timeToMinutes(config.closingTime);
    const duration = config.slotDuration;

    // Fetch existing bookings for this date
    // Note: If sport is football or cricket, we fetch bookings for both because of shared turf!
    const querySports = (sport === 'football' || sport === 'cricket') 
      ? ['football', 'cricket'] 
      : ['pickleball'];

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    let bookings = [];

    if (global.isMockDB) {
      bookings = global.mockBookings.filter(b => 
        b.date === date && 
        querySports.includes(b.sport) && 
        (b.status === 'confirmed' || (b.status === 'pending' && b.createdAt >= fifteenMinutesAgo))
      );
    } else {
      try {
        const dbBookingSlots = await prisma.bookingSlot.findMany({
          where: {
            bookingDate: new Date(date),
            sport: { name: { in: querySports } },
            booking: {
              OR: [
                { status: 'confirmed' },
                { status: 'pending', createdAt: { gte: fifteenMinutesAgo } }
              ]
            }
          },
          include: {
            booking: true,
            sport: true,
            timeSlot: true
          }
        });

        bookings = dbBookingSlots.map(slot => ({
          timeSlot: `${slot.timeSlot.startTime.substring(0, 5)}-${slot.timeSlot.endTime.substring(0, 5)}`,
          sport: slot.sport.name,
          bookingId: slot.booking.bookingNumber
        }));
      } catch (err) {
        console.warn('Prisma slots query failed, falling back to mock database:', err.message);
        bookings = global.mockBookings.filter(b => 
          b.date === date && 
          querySports.includes(b.sport) && 
          (b.status === 'confirmed' || (b.status === 'pending' && b.createdAt >= fifteenMinutesAgo))
        );
      }
    }

    const slots = [];
    const now = new Date();
    
    // Timezone-safe local date calculation for Asia/Kolkata (IST)
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA outputs YYYY-MM-DD
    const currentDateStr = formatter.format(now);

    // Determine weekend
    const queryDate = new Date(date);
    const isWeekend = queryDate.getDay() === 0 || queryDate.getDay() === 6; // 0 = Sun, 6 = Sat

    for (let m = startMin; m + duration <= endMin; m += duration) {
      const slotStart = minutesToTime(m);
      const slotEnd = minutesToTime(m + duration);
      const slotString = `${slotStart}-${slotEnd}`;

      // Check if slot has already passed
      let status = 'available';
      if (date < currentDateStr) {
        status = 'past';
      } else if (date === currentDateStr) {
        const slotTime = new Date(`${date}T${slotStart.padStart(2, '0')}:00.000+05:30`);
        if (now > slotTime) {
          status = 'past';
        }
      }

      // Check if the date is a holiday/blocked
      if (status !== 'past' && isHoliday) {
        status = 'blocked';
      }

      // Check maintenance slots
      const isUnderMaintenance = config.maintenanceSlots.some(
        (mSlot) => mSlot.date === date && mSlot.slot === slotString && (mSlot.sport === sport || (querySports.includes(mSlot.sport) && sport !== 'pickleball'))
      );
      if (status !== 'past' && isUnderMaintenance) {
        status = 'blocked';
      }

      // Check if booked
      const activeBooking = bookings.find((b) => b.timeSlot === slotString);
      if (status === 'available' && activeBooking) {
        status = 'booked';
      }

      // Price calculation
      const isPeak = config.peakHours.includes(slotStart);
      const sportPricing = config.pricing[sport];
      const rateType = isWeekend ? 'weekend' : 'weekday';
      const pricingCategory = isPeak ? 'peak' : 'base';
      const price = sportPricing[rateType][pricingCategory];

      slots.push({
        time: slotString,
        start: slotStart,
        end: slotEnd,
        status,
        price,
        isPeak,
        bookedDetails: activeBooking ? {
          sport: activeBooking.sport,
          bookingId: activeBooking.bookingId,
        } : null,
      });
    }

    return NextResponse.json({
      date,
      sport,
      isHoliday,
      slots,
    });
  } catch (error) {
    console.error('Fetch slots error:', error);
    return NextResponse.json({ error: 'Server error retrieving slots' }, { status: 500 });
  }
}

// Utility functions
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMin) {
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
