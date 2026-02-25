import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/admin-session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (validateSessionToken(token)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
