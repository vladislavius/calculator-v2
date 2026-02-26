import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function checkAuth(req: NextRequest) {
  const token = req.headers.get('x-session-token') || req.headers.get('x-api-token');
  if (!token) return false;
  const { data: session } = await getSupabaseAdmin().from('app_sessions').select('user_id').eq('token', token).single();
  if (session) return true;
  const apiToken = process.env.CALENDAR_API_TOKEN;
  return !!(apiToken && token === apiToken);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get('boat_id');
  if (!boatId) return NextResponse.json({ error: 'boat_id required' }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from('boat_unavailable_dates')
    .select('*').eq('boat_id', boatId).order('date_from');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { boat_id, date_from, date_to, title, source } = body;
  if (!boat_id || !date_from || !date_to)
    return NextResponse.json({ error: 'boat_id, date_from, date_to required' }, { status: 400 });
  if (date_from > date_to)
    return NextResponse.json({ error: 'date_from must be <= date_to' }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from('boat_unavailable_dates').insert({
    boat_id, date_from, date_to,
    title: title || 'Занято',
    source: source || 'manual'
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const sb = getSupabaseAdmin();

  if (body.boat_id && body.source === 'all_synced') {
    await sb.from('boat_unavailable_dates').delete().eq('boat_id', body.boat_id).in('source', ['ical', 'teamup', 'url_import']);
    return NextResponse.json({ ok: true, deleted: 'all_synced' });
  }

  if (body.id) {
    await sb.from('boat_unavailable_dates').delete().eq('id', body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'id or boat_id+source required' }, { status: 400 });
}
