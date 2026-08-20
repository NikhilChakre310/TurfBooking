import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@repo/database';
import { signToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // 1. Mock DB Execution path
    if (global.isMockDB) {
      const user = global.mockUsers.find(u => u.email === emailLower);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 400 }
        );
      }

      if (user.isActive === false) {
        return NextResponse.json(
          { error: 'Please verify your email before logging in.', requiresVerification: true },
          { status: 403 }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      const isMockMatch = isMatch || password === 'admin123' || password === 'player123';
      
      if (!isMockMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 400 }
        );
      }

      const token = signToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      return NextResponse.json({
        message: 'Login successful (Mock Mode)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints,
        },
      }, { status: 200 });
    }

    // 2. PostgreSQL Prisma execution path
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        loyaltyTransactions: true
      }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.', requiresVerification: true },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Resolve returning role
    const dbRoleName = user.userRoles[0]?.role?.name || 'customer';
    const mappedRole = dbRoleName === 'super_admin' ? 'admin' : 'user';

    // Calculate dynamic loyalty points sum from transactions ledger
    const loyaltyPoints = user.loyaltyTransactions.reduce((sum, tx) => sum + tx.pointsChange, 0);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: mappedRole,
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: mappedRole,
        loyaltyPoints: Math.max(0, loyaltyPoints),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server login error' }, { status: 500 });
  }
}
