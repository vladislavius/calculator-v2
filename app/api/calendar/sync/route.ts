import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseIcal(icalText: string): Array<{title: string, dateFrom: string, dateTo: string}> {
  const events: Array<{title: string, dateFrom: string, dateTo: string}> = [];
  const lines = icalText.replace(/\r\n /g, '').replace(/\r\n/g, '\n').split('\n');
  let inEvent = false;
  let current: any = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current.dateFrom && current.dateTo) events.push(current);
      inEvent = false; continue;
    }
    if (!inEvent) continue;
    if (line.startsWith('SUMMARY:')) current.title = line.replace('SUMMARY:', '').trim();
    if (line.startsWith('DTSTART')) {
      const val = line.split(':').slice(1).join(':').trim();
      const d = val.substring(0, 8);
      current.dateFrom = `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`;
    }
    if (line.startsWith('DTEND')) {
      const val = line.split(':').slice(1).join(':').trim();
      const d = val.substring(0, 8);
      const dateStr = `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`;
      const dt = new Date(dateStr);
      dt.setDate(dt.getDate() - 1);
      current.dateTo = dt.toISOString().split('T')[0];
    }
  }
  return events;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-session-token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: session } = await sb.from('app_sessions').select('user_id').eq('token', token).single();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const boatId = body.boat_id;

    let query = sb.from('boat_calendars').select('*').eq('active', true).eq('calendar_type', 'ical');
    if (boatId) query = query.eq('boat_id', boatId);
    const { data: calendars } = await query;
    if (!calendars?.length) return NextResponse.json({ synced: 0, total: 0, message: 'Нет активных iCal календарей' });

    let totalSynced = 0;
    const errors: string[] = [];

    for (const cal of calendars) {
      if (!cal.ical_url) continue;
      try {
        const resp = await fetch(cal.ical_url, {
          headers: { 'User-Agent': 'OnlySea Calendar Sync/1.0' },
          signal: AbortSignal.timeout(10000)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const icalText = await resp.text();
        const events = parseIcal(icalText);

        await sb.from('boat_unavailable_dates').delete().eq('boat_id', cal.boat_id).eq('source', 'ical');
        if (events.length > 0) {
          await sb.from('boat_unavailable_dates').insert(
            events.map(e => ({ boat_id: cal.boat_id, date_from: e.dateFrom, date_to: e.dateTo, title: e.title || 'Занято', source: 'ical' }))
          );
        }
        await sb.from('boat_calendars').update({ last_synced: new Date().toISOString() }).eq('id', cal.id);
        totalSynced++;
      } catch (e: any) {
        errors.push(`boat_id ${cal.boat_id}: ${e.message}`);
      }
    }
    return NextResponse.json({ synced: totalSynced, errors, total: calendars.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get('boat_id');
  if (!boatId) return NextResponse.json({ error: 'boat_id required' }, { status: 400 });

  const dateFrom = searchParams.get('from') || new Date().toISOString().split('T')[0];
  const dateTo = searchParams.get('to') || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const { data } = await sb.from('boat_unavailable_dates')
    .select('date_from, date_to, title, source')
    .eq('boat_id', boatId)
    .lte('date_from', dateTo)
    .gte('date_to', dateFrom);

  return NextResponse.json({ unavailable: data || [] });
}
