import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get('os_token')?.value || req.headers.get('x-session-token');
  if (!token) return null;
  const { data: session } = await sb.from('app_sessions').select('user_id, expires_at').eq('token', token).single();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await sb.from('app_users').select('id, role, active').eq('id', session.user_id).single();
  return user?.active ? user : null;
}

// GET — список пользователей (только admin)
export async function GET(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data } = await sb.from('app_users').select('id, email, name, role, active, created_at, last_login').order('created_at');
  return NextResponse.json(data || []);
}

// POST — создать пользователя (только admin)
export async function POST(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, name, role, pin } = await req.json();
  if (!email || !name || !role || !pin) return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });

  const pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
  const { data, error } = await sb.from('app_users').insert({ email: email.toLowerCase().trim(), name, role, pin_hash: pinHash }).select('id, email, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH — обновить пользователя (только admin)
export async function PATCH(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, pin, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

  const update: any = { ...fields };
  if (pin) update.pin_hash = crypto.createHash('sha256').update(String(pin)).digest('hex');

  const { data, error } = await sb.from('app_users').update(update).eq('id', id).select('id, email, name, role, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE — удалить пользователя (только admin, нельзя себя)
export async function DELETE(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
  if (id === me.id) return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 400 });

  await sb.from('app_users').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
