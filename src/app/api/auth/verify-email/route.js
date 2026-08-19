import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

// Global cache for tokens in mock execution mode
if (!global.verificationStore) {
  global.verificationStore = new Map();
}

export async function POST(req) {
  try {
    const { action, email, otp, verifyToken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Action 1: Send / Resend Email Verification Code
    if (action === 'send') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      global.verificationStore.set(emailLower, { otp, token, expiresAt });

      let userName = 'Player';
      if (!global.isMockDB) {
        const user = await prisma.user.findUnique({ where: { email: emailLower } });
        if (user) userName = user.name;
      }

      await sendVerificationEmail({
        email: emailLower,
        name: userName,
        token,
        otp
      });

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${emailLower}`,
        previewOtp: global.isMockDB ? otp : undefined
      });
    }

    // Action 2: Verify Code / Token
    if (action === 'verify') {
      const storeData = global.verificationStore.get(emailLower);

      if (!storeData) {
        return NextResponse.json({ error: 'No verification request found for this email. Please request a new code.' }, { status: 400 });
      }

      if (Date.now() > storeData.expiresAt) {
        global.verificationStore.delete(emailLower);
        return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
      }

      const isValidOtp = otp && storeData.otp === otp;
      const isValidToken = verifyToken && storeData.token === verifyToken;

      if (!isValidOtp && !isValidToken) {
        return NextResponse.json({ error: 'Invalid verification code or link' }, { status: 400 });
      }

      // Mark email as verified
      global.verificationStore.delete(emailLower);

      if (!global.isMockDB) {
        try {
          await prisma.user.update({
            where: { email: emailLower },
            data: { isActive: true }
          });
        } catch (e) {
          console.warn('DB verify status update warning:', e.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Email address verified successfully!'
      });
    }

    return NextResponse.json({ error: 'Invalid action. Expected "send" or "verify"' }, { status: 400 });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Server error processing verification' }, { status: 500 });
  }
}
