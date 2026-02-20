import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json();
    if (!email || !pin) return NextResponse.json({ success: false, error: 'Email и PIN обязательны' }, { status: 400 });

    const pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');

    const { data: user, error } = await sb
      .from('app_users')
      .select('id, email, name, role, pin_hash, active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 401 });
    if (!user.active) return NextResponse.json({ success: false, error: 'Аккаунт отключён' }, { status: 403 });

    const hashA = Buffer.from(pinHash.padEnd(64, '0'));
    const hashB = Buffer.from(user.pin_hash.padEnd(64, '0'));
    const match = crypto.timingSafeEqual(hashA, hashB);

    if (!match) return NextResponse.json({ success: false, error: 'Неверный PIN' }, { status: 401 });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

    await sb.from('app_sessions').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    await sb.from('app_users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
