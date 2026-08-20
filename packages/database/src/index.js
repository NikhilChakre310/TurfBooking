if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Prisma Database client cannot be instantiated or imported in client-side UI code.');
}

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

if (global.isMockDB === undefined) {
  global.isMockDB = false;
}

if (global.isMockDB || !process.env.DATABASE_URL) {
  global.isMockDB = true;
  initializeMockData();
} else if (!global.prismaInstance) {
  try {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });

    pool.query('SELECT 1')
      .then(() => {
        console.log('Successfully connected to Supabase PostgreSQL via Prisma.');
      })
      .catch((err) => {
        console.warn(`[POSTGRES CONNECTION FAILED] ${err.message}`);
        console.warn('⚠️ Activating IN-MEMORY Mock Database Fallback. All records will be stored in-session only.');
        global.isMockDB = true;
        initializeMockData();
      });

    const adapter = new PrismaPg(pool);
    global.prismaInstance = new PrismaClient({ adapter });
  } catch (error) {
    console.warn(`[DATABASE INIT ERROR] ${error.message}`);
    global.isMockDB = true;
    initializeMockData();
  }
}


const prisma = global.prismaInstance;

function initializeMockData() {
  if (global.mockUsers === undefined) {
    global.mockUsers = [
      {
        _id: 'mock_user_admin_123',
        name: 'Arena Admin',
        email: 'admin@arena.com',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', // bcrypt dummy
        phone: '9999999999',
        role: 'admin',
        loyaltyPoints: 500,
        createdAt: new Date(),
      },
      {
        _id: 'mock_user_player_456',
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        phone: '9876543210',
        role: 'user',
        loyaltyPoints: 120,
        createdAt: new Date(),
      }
    ];

    global.mockBookings = [
      {
        _id: 'mock_booking_1',
        bookingId: 'AST-XYZ888',
        userId: 'mock_user_player_456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        sport: 'football',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '19:00-20:00',
        playersCount: 10,
        price: 1200,
        couponApplied: '',
        discountAmount: 0,
        finalAmount: 1200,
        status: 'confirmed',
        paymentStatus: 'paid',
        razorpayOrderId: 'order_mock_xyz123',
        razorpayPaymentId: 'pay_mock_xyz123',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        createdAt: new Date(),
      }
    ];

    global.mockConfig = {
      key: 'slot_settings',
      openingTime: '05:00',
      closingTime: '23:00',
      slotDuration: 60,
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
      peakHours: ['18:00', '19:00', '20:00', '21:00', '22:00'],
      cancellationHours: 6,
      refundPercentage: 100,
      blockedDates: [],
      maintenanceSlots: [],
    };

    global.mockCoupons = [
      {
        code: 'TURF10',
        discountType: 'percentage',
        discountValue: 10,
        minBookingAmount: 500,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'PLAYFREE',
        discountType: 'fixed',
        discountValue: 500,
        minBookingAmount: 1000,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      }
    ];
  }
}

export default prisma;
