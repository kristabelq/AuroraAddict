import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/upgrade-to-business
 *
 * DISABLED: Account type conversion is not allowed.
 * Users must choose their account type during initial onboarding.
 */
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Account type conversion is not allowed. Please create a new account if you need a different account type.' },
    { status: 403 }
  );
}
