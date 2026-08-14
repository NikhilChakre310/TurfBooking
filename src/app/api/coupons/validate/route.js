import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const amount = Number(searchParams.get('amount') || 0);

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const codeUpper = code.toUpperCase();

    // 1. Mock DB Execution path
    if (global.isMockDB) {
      const coupon = global.mockCoupons.find(c => 
        c.code === codeUpper && 
        c.isActive && 
        c.expiryDate > new Date()
      );

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
      }

      if (amount < coupon.minBookingAmount) {
        return NextResponse.json(
          { error: `Minimum booking amount of ₹${coupon.minBookingAmount} is required for this coupon` },
          { status: 400 }
        );
      }

      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = Math.round((amount * coupon.discountValue) / 100);
      } else {
        discount = coupon.discountValue;
      }

      return NextResponse.json({
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        finalAmount: Math.max(0, amount - discount),
      });
    }

    // 2. PostgreSQL Prisma execution path
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: codeUpper,
        isActive: true,
        expiryDate: { gt: new Date() }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    // Convert decimal database type back to floats for JSON return
    const minAmount = Number(coupon.minBookingAmount);
    const discountVal = Number(coupon.discountValue);

    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum booking amount of ₹${minAmount} is required for this coupon` },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((amount * discountVal) / 100);
    } else {
      discount = discountVal;
    }

    // Ensure coupon doesn't exceed standard cap if configured
    if (coupon.maxDiscountAmount && coupon.discountType === 'percentage') {
      const maxCap = Number(coupon.maxDiscountAmount);
      if (discount > maxCap) {
        discount = maxCap;
      }
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: discountVal,
      discountAmount: discount,
      finalAmount: Math.max(0, amount - discount),
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Server error validating coupon' }, { status: 500 });
  }
}
