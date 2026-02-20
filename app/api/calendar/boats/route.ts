import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAuth(req: NextRequest) {
  const token = req.headers.get('x-session-token');
  if (!token) return false;
  const { data } = await sb.from('app_sessions').select('user_id').eq('token', token).single();
  return !!data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get('boat_id');
  let query = sb.from('boat_calendars')
    .select('*, boats(id, name, partners(name))')
    .order('boat_id');
  if (boatId) query = query.eq('boat_id', boatId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { boat_id, calendar_type, ical_url, active } = body;
  if (!boat_id) return NextResponse.json({ error: 'boat_id required' }, { status: 400 });

  const { data: existing } = await sb.from('boat_calendars').select('id').eq('boat_id', boat_id).maybeSingle();
  if (existing) {
    const { data, error } = await sb.from('boat_calendars')
      .update({ calendar_type, ical_url, active: active ?? true })
      .eq('boat_id', boat_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await sb.from('boat_calendars')
      .insert({ boat_id, calendar_type, ical_url, active: active ?? true })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}

export async function DELETE(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  await sb.from('boat_calendars').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
