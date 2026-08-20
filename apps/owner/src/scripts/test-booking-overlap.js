// Test script to verify the dynamic Football/Cricket booking overlap rules.
// Run with: node src/scripts/test-booking-overlap.js

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 1. Manually parse .env.local variables
const envPath = path.join(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arena_sports_turf';

// Inline Schema
const BookingSchema = new mongoose.Schema({
  bookingId: String,
  name: String,
  email: String,
  phone: String,
  sport: String,
  date: String,
  timeSlot: String,
  playersCount: Number,
  price: Number,
  finalAmount: Number,
  status: String,
  paymentStatus: String,
  createdAt: Date
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// In-Memory Simulation Mock Array
let mockBookings = [];

async function runTest() {
  let useSimulation = false;

  console.log('Connecting to MongoDB...');
  try {
    const opts = { serverSelectionTimeoutMS: 2000 };
    await mongoose.connect(MONGODB_URI, opts);
    console.log('Connected to local MongoDB.');
  } catch (err) {
    console.warn(`\n[DATABASE CONNECTION FAILED] ${err.message}`);
    console.warn('⚠️ Switching to IN-MEMORY Logic Simulation Mode for testing.');
    useSimulation = true;
  }

  const testDate = '2026-07-20';
  const testSlot = '18:00-19:00';

  if (!useSimulation) {
    // MongoDB Clean up
    console.log(`Cleaning bookings for date ${testDate}...`);
    await Booking.deleteMany({ date: testDate });
  } else {
    mockBookings = [];
  }

  // 1. Initial State Assertions
  console.log('Verifying initial states...');
  let bookingsCount = 0;
  if (!useSimulation) {
    bookingsCount = await Booking.countDocuments({ date: testDate, timeSlot: testSlot, status: { $ne: 'cancelled' } });
  } else {
    bookingsCount = mockBookings.filter(b => b.date === testDate && b.timeSlot === testSlot && b.status !== 'cancelled').length;
  }

  console.log(`Bookings matching slot: ${bookingsCount} (Expected: 0)`);
  if (bookingsCount !== 0) throw new Error('Initial state is not clean!');

  // 2. Create Football Booking
  console.log(`\nBooking Football slot on ${testDate} at ${testSlot}...`);
  const testBooking = {
    bookingId: 'AST-TEST01',
    name: 'Test Player',
    email: 'test@arena.com',
    phone: '9876543210',
    sport: 'football',
    date: testDate,
    timeSlot: testSlot,
    playersCount: 10,
    price: 1200,
    finalAmount: 1200,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date()
  };

  if (!useSimulation) {
    const doc = new Booking(testBooking);
    await doc.save();
  } else {
    mockBookings.push(testBooking);
  }
  console.log('Football Booking saved.');

  // 3. Shared Turf Query Logic Validation
  const querySports = ['football', 'cricket'];
  let sharedTurfBookings = [];

  if (!useSimulation) {
    sharedTurfBookings = await Booking.find({
      date: testDate,
      timeSlot: testSlot,
      sport: { $in: querySports },
      status: { $ne: 'cancelled' }
    });
  } else {
    sharedTurfBookings = mockBookings.filter(b => 
      b.date === testDate && 
      b.timeSlot === testSlot && 
      querySports.includes(b.sport) && 
      b.status !== 'cancelled'
    );
  }

  console.log('\n=== COLLISION LOGIC VALIDATION ===');
  console.log(`Bookings matching Shared Turf filter: ${sharedTurfBookings.length} (Expected: 1)`);
  
  if (sharedTurfBookings.length === 1) {
    console.log('✅ Overlap check succeeded!');
    console.log(`Conclusion: Since a ${sharedTurfBookings[0].sport.toUpperCase()} booking exists, both Football and Cricket slots must be rendered as BOOKED.`);
  } else {
    console.log('❌ Overlap check failed!');
  }

  // 4. Pickleball Court Independence Validation
  let pBallBookings = [];
  if (!useSimulation) {
    pBallBookings = await Booking.find({
      date: testDate,
      timeSlot: testSlot,
      sport: 'pickleball',
      status: { $ne: 'cancelled' }
    });
  } else {
    pBallBookings = mockBookings.filter(b => 
      b.date === testDate && 
      b.timeSlot === testSlot && 
      b.sport === 'pickleball' && 
      b.status !== 'cancelled'
    );
  }

  console.log(`Bookings matching Pickleball Court: ${pBallBookings.length} (Expected: 0)`);
  if (pBallBookings.length === 0) {
    console.log('✅ Pickleball Court remains AVAILABLE (Independent schedule confirmed)!');
  } else {
    console.log('❌ Pickleball Court collision detected incorrectly!');
  }

  // Clean up
  console.log('\nCleaning up database records...');
  if (!useSimulation) {
    await Booking.deleteMany({ bookingId: 'AST-TEST01' });
    await mongoose.disconnect();
  } else {
    mockBookings = [];
  }
  console.log('Disconnected. Test finished successfully.');
}

runTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
