import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateToken(token: string) {
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

// GET — токен из header x-session-token
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('x-session-token');
    if (!token) return NextResponse.json({ valid: false }, { status: 401 });

    const user = await validateToken(token);
    if (!user) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({ valid: true, user });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

// POST — токен из body или header
export async function POST(req: NextRequest) {
  try {
    const headerToken = req.headers.get('x-session-token');
    let token = headerToken;

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
