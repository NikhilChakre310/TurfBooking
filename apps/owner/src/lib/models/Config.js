import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'slot_settings',
  },
  openingTime: {
    type: String,
    default: '05:00',
  },
  closingTime: {
    type: String,
    default: '23:00',
  },
  slotDuration: {
    type: Number,
    default: 60, // minutes
  },
  pricing: {
    football: {
      weekday: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
      weekend: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
    },
    cricket: {
      weekday: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
      weekend: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
    },
    pickleball: {
      weekday: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
      weekend: {
        base: { type: Number, default: 800 },
        peak: { type: Number, default: 1000 },
      },
    },
  },
  peakHours: {
    type: [String], // e.g. ["18:00", "19:00", "20:00", "21:00", "22:00"]
    default: ['18:00', '19:00', '20:00', '21:00', '22:00'],
  },
  cancellationHours: {
    type: Number,
    default: 6,
  },
  refundPercentage: {
    type: Number,
    default: 100, // percentage of pricing refunded
  },
  blockedDates: {
    type: [String], // YYYY-MM-DD
    default: [],
  },
  maintenanceSlots: {
    type: [
      {
        date: String,
        slot: String,
        sport: String,
      },
    ],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
