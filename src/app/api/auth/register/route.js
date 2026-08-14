import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'All fields (name, email, password, phone) are required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // 1. Mock DB Execution path
    if (global.isMockDB) {
      const existingUser = global.mockUsers.find(u => u.email === emailLower);
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let role = 'user';
      if (emailLower === 'admin@arena.com' || global.mockUsers.length === 0) {
        role = 'admin';
      }

      const newUser = {
        _id: `user_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email: emailLower,
        password: hashedPassword,
        phone,
        role,
        loyaltyPoints: 100,
      };

      global.mockUsers.push(newUser);

      const token = signToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      });

      return NextResponse.json({
        message: 'Registration successful (Mock Mode)',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          loyaltyPoints: newUser.loyaltyPoints,
        },
      }, { status: 201 });
    }

    // 2. PostgreSQL Prisma execution path
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role (super_admin for first user or admin@arena.com)
    let roleName = 'customer';
    if (emailLower === 'admin@arena.com') {
      roleName = 'super_admin';
    } else {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        roleName = 'super_admin';
      }
    }

    // Get or create target role in DB
    let targetRole = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!targetRole) {
      targetRole = await prisma.role.create({
        data: { name: roleName }
      });
    }

    // Create user and map to roles
    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        passwordHash: hashedPassword,
        phone,
        isActive: true,
        userRoles: {
          create: {
            roleId: targetRole.id
          }
        },
        loyaltyTransactions: {
          create: {
            pointsChange: 100,
            transactionType: 'signup_bonus'
          }
        }
      }
    });

    // Resolve returning role (super_admin = admin, customer = user)
    const mappedRole = roleName === 'super_admin' ? 'admin' : 'user';

    // Create JWT
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: mappedRole,
    });

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: mappedRole,
        loyaltyPoints: 100, // 100 welcome points accrued via transaction
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Server registration error' }, { status: 500 });
  }
}
