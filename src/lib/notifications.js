import prisma from './prisma';

export async function sendNotification({ recipient, type, subject, message }) {
  try {
    // Log to DB if active
    if (!global.isMockDB) {
      await prisma.notification.create({
        data: {
          recipient,
          channel: type, // type translates to channels: 'email', 'sms', 'whatsapp'
          subject: subject || `${type.toUpperCase()} Notification`,
          message,
          status: 'sent'
        }
      });
    }

    console.log(`[NOTIFICATION SENT] [${type.toUpperCase()}] to ${recipient}:`);
    if (subject) console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------------------------------`);

    return { success: true };
  } catch (error) {
    console.error('Failed to send/log notification:', error);
    return { success: false, error: error.message };
  }
}
