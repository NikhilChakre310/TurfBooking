import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@repo/database';
import { sendEmail } from '@/lib/email';

if (!global.resetTokenStore) {
  global.resetTokenStore = new Map();
}

export async function POST(req) {
  try {
    const { email, resetCode, resetToken, newPassword } = await req.json();

    if (!email || !newPassword || (!resetCode && !resetToken)) {
      return NextResponse.json(
        { error: 'Email, new password, and reset code/token are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const storeData = global.resetTokenStore.get(emailLower);

    if (!storeData) {
      return NextResponse.json({ error: 'No active reset request found. Please request a new password reset.' }, { status: 400 });
    }

    if (Date.now() > storeData.expiresAt) {
      global.resetTokenStore.delete(emailLower);
      return NextResponse.json({ error: 'Reset code/link has expired. Please request a new one.' }, { status: 400 });
    }

    const isValidCode = resetCode && storeData.resetCode === resetCode;
    const isValidToken = resetToken && storeData.token === resetToken;

    if (!isValidCode && !isValidToken) {
      return NextResponse.json({ error: 'Invalid reset security code or token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (global.isMockDB) {
      const userIdx = global.mockUsers.findIndex(u => u.email === emailLower);
      if (userIdx !== -1) {
        global.mockUsers[userIdx].password = hashedPassword;
      }
    } else {
      await prisma.user.update({
        where: { email: emailLower },
        data: { passwordHash: hashedPassword }
      });
    }

    // Invalidate reset code
    global.resetTokenStore.delete(emailLower);

    // Send confirmation email
    await sendEmail({
      to: emailLower,
      subject: 'Security Alert: Password Changed',
      text: `Hi,\n\nYour MatchPoint Turf account password was successfully updated.\nIf you did not perform this change, please contact support immediately.`
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Server error updating password' }, { status: 500 });
  }
}
