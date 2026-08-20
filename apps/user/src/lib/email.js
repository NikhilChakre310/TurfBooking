import { Resend } from 'resend';
import prisma from './prisma';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const defaultFrom = process.env.RESEND_FROM_EMAIL || 'MatchPoint Turf <onboarding@resend.dev>';

/**
 * Core transactional email sender using Resend SDK
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!resend) {
      console.log(`[RESEND MOCK MODE] Email would be sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html}`);
      console.log(`--------------------------------------------------`);
      
      // Log to DB if DB active
      if (!global.isMockDB) {
        try {
          await prisma.notification.create({
            data: {
              recipient: Array.isArray(to) ? to.join(', ') : to,
              channel: 'email',
              subject,
              message: text || html,
              status: 'mock_sent'
            }
          });
        } catch (e) {
          console.warn('Failed to log notification to DB:', e.message);
        }
      }
      return { success: true, mock: true };
    }

    const response = await resend.emails.send({
      from: defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || `<p>${text}</p>`,
      text: text
    });

    console.log(`[RESEND LIVE EMAIL SENT] to ${to}: ID=${response.data?.id || JSON.stringify(response)}`);

    // Log to DB
    if (!global.isMockDB) {
      try {
        await prisma.notification.create({
          data: {
            recipient: Array.isArray(to) ? to.join(', ') : to,
            channel: 'email',
            subject,
            message: text || html,
            status: 'sent'
          }
        });
      } catch (e) {
        console.warn('Failed to log notification to DB:', e.message);
      }
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[RESEND EMAIL ERROR]:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Email Verification Token / Link
 */
export async function sendVerificationEmail({ email, name, token, otp }) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://turfbooking-pro.vercel.app'}/login?verifyToken=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222222; border-radius: 16px; padding: 40px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 24px; color: #ffffff; }
          .badge { display: inline-block; background: #111111; border: 1px solid #333333; color: #10b981; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
          h1 { font-size: 28px; font-weight: 800; margin: 0 0 12px; line-height: 1.2; }
          p { color: #888888; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .otp-box { background: #111111; border: 1px solid #333333; border-radius: 12px; padding: 20px; text-align: center; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-bottom: 28px; }
          .btn { display: block; width: 100%; background: #ffffff; color: #000000; text-align: center; padding: 14px 0; border-radius: 10px; font-weight: 800; font-size: 14px; text-decoration: none; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #555555; text-align: center; border-top: 1px solid #1c1c1c; padding-top: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">MATCHPOINT TURF</div>
          <div class="badge">EMAIL VERIFICATION</div>
          <h1>Verify your email address</h1>
          <p>Hi ${name || 'Player'},\nThank you for signing up with MatchPoint Turf. Please verify your email using the 6-digit OTP code below or click the verification button.</p>
          
          <div class="otp-box">${otp || '123456'}</div>
          
          <a href="${verifyUrl}" class="btn">Verify Email Account</a>
          
          <p style="font-size: 13px; color: #666666;">If you did not request this email, you can safely ignore it.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} MatchPoint Turf. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your MatchPoint Turf account',
    html,
    text: `Hi ${name},\nYour verification code is: ${otp}\nOr verify at: ${verifyUrl}`
  });
}

/**
 * Send Password Reset Email Token / Link
 */
export async function sendPasswordResetEmail({ email, name, token, resetCode }) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://turfbooking-pro.vercel.app'}/login?resetToken=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222222; border-radius: 16px; padding: 40px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 24px; color: #ffffff; }
          .badge { display: inline-block; background: #111111; border: 1px solid #333333; color: #ef4444; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
          h1 { font-size: 28px; font-weight: 800; margin: 0 0 12px; line-height: 1.2; }
          p { color: #888888; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .otp-box { background: #111111; border: 1px solid #333333; border-radius: 12px; padding: 20px; text-align: center; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-bottom: 28px; }
          .btn { display: block; width: 100%; background: #ffffff; color: #000000; text-align: center; padding: 14px 0; border-radius: 10px; font-weight: 800; font-size: 14px; text-decoration: none; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #555555; text-align: center; border-top: 1px solid #1c1c1c; padding-top: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">MATCHPOINT TURF</div>
          <div class="badge">SECURITY ASSISTANCE</div>
          <h1>Reset your password</h1>
          <p>Hi ${name || 'Player'},\nWe received a request to reset your MatchPoint Turf account password. Use the security code below or click the button to set a new password.</p>
          
          <div class="otp-box">${resetCode || '888999'}</div>
          
          <a href="${resetUrl}" class="btn">Reset My Password</a>
          
          <p style="font-size: 13px; color: #666666;">This link & code will expire in 1 hour. If you didn't request a password reset, please secure your account.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} MatchPoint Turf. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your MatchPoint Turf Password',
    html,
    text: `Hi ${name},\nYour password reset code is: ${resetCode}\nReset link: ${resetUrl}`
  });
}
