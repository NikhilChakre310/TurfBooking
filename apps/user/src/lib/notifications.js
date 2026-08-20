import prisma from './prisma';
import { sendEmail } from './email';

export async function sendNotification({ recipient, type, subject, message, html }) {
  try {
    if (type === 'email' && recipient) {
      await sendEmail({
        to: recipient,
        subject: subject || 'MatchPoint Turf Notification',
        text: message,
        html: html
      });
    } else {
      console.log(`[NOTIFICATION SENT] [${type.toUpperCase()}] to ${recipient}:`);
      if (subject) console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log(`--------------------------------------------------`);
    }

    // Log to DB if active
    if (!global.isMockDB) {
      try {
        await prisma.notification.create({
          data: {
            recipient,
            channel: type,
            subject: subject || `${type.toUpperCase()} Notification`,
            message: message || html || '',
            status: 'sent'
          }
        });
      } catch (e) {
        console.warn('Notification log error:', e.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send/log notification:', error);
    return { success: false, error: error.message };
  }
}
