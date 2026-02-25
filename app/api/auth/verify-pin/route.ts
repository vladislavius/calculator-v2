import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSessionToken } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const correctPin = process.env.ADMIN_PIN;

    if (!correctPin) {
      console.error('ADMIN_PIN env variable not set');
      return NextResponse.json({ success: false, error: 'Server config error' }, { status: 500 });
    }

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: 'PIN required' }, { status: 400 });
    }

    // Constant-time comparison to prevent timing attacks
    const pinBuffer = Buffer.from(pin.padEnd(32, '\0'));
    const correctBuffer = Buffer.from(correctPin.padEnd(32, '\0'));
    const match = crypto.timingSafeEqual(pinBuffer, correctBuffer);

    if (match) {
      const token = createSessionToken();
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Wrong PIN' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
