import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, error: 'Wrong PIN' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
