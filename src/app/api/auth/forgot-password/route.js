import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

// Memory store for reset tokens
if (!global.resetTokenStore) {
  global.resetTokenStore = new Map();
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    let user = null;

    if (global.isMockDB) {
      user = global.mockUsers.find(u => u.email === emailLower);
    } else {
      user = await prisma.user.findUnique({ where: { email: emailLower } });
    }

    if (!user) {
      if (global.isMockDB) {
        // In serverless mock mode, memory state resets between requests. 
        // We bypass the check here so the user can test the email flow.
        user = { name: 'Player', email: emailLower };
      } else {
        // Return ambiguous message for security to prevent user enumeration
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, a password reset link and security code have been sent.'
        });
      }
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    global.resetTokenStore.set(emailLower, { resetCode, token, expiresAt });

    await sendPasswordResetEmail({
      email: emailLower,
      name: user.name,
      token,
      resetCode
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset link and security code sent to your email address.',
      previewCode: global.isMockDB ? resetCode : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error processing password reset request' }, { status: 500 });
  }
}
