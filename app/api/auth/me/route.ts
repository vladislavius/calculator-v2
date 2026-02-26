import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function validateToken(token: string) {
  const sb = getSupabaseAdmin();
  const { data: session } = await sb
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await sb.from('app_sessions').delete().eq('token', token);
    return null;
  }

  const { data: user } = await sb
    .from('app_users')
    .select('id, email, name, role, active')
    .eq('id', session.user_id)
    .single();

  if (!user || !user.active) return null;
  return user;
}

// GET — token from httpOnly cookie (primary) or x-session-token header (fallback)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('os_token')?.value || req.headers.get('x-session-token');
    if (!token) return NextResponse.json({ valid: false }, { status: 401 });

    const user = await validateToken(token);
    if (!user) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({ valid: true, user });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

// POST — token from httpOnly cookie (primary), header, or body (legacy)
export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('os_token')?.value;
    const headerToken = req.headers.get('x-session-token');
    let token = cookieToken || headerToken;

    if (!token) {
      const body = await req.json().catch(() => ({}));
      token = body.token;
    }

    if (!token) return NextResponse.json({ valid: false }, { status: 401 });

    const user = await validateToken(token);
    if (!user) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({ valid: true, user });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
