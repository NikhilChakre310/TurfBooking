import mongoose from 'mongoose';

const NotificationLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'whatsapp'],
    required: true,
  },
  subject: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.NotificationLog || mongoose.model('NotificationLog', NotificationLogSchema);
