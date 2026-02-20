import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ valid: false }, { status: 401 });

    const { data: session } = await sb
      .from('app_sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (!session) return NextResponse.json({ valid: false }, { status: 401 });
    if (new Date(session.expires_at) < new Date()) {
      await sb.from('app_sessions').delete().eq('token', token);
      return NextResponse.json({ valid: false, error: 'Сессия истекла' }, { status: 401 });
    }

    const { data: user } = await sb
      .from('app_users')
      .select('id, email, name, role, active')
      .eq('id', session.user_id)
      .single();

    if (!user || !user.active) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({ valid: true, user });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
