import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function parseIcal(text: string): Array<{title: string, dateFrom: string, dateTo: string}> {
  const events: Array<{title: string, dateFrom: string, dateTo: string}> = [];
  const lines = text.replace(/\r\n /g, '').replace(/\r\n/g, '\n').split('\n');
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
      const val = line.split(':').slice(1).join(':').trim().substring(0, 8);
      current.dateFrom = `${val.substring(0,4)}-${val.substring(4,6)}-${val.substring(6,8)}`;
    }
    if (line.startsWith('DTEND')) {
      const val = line.split(':').slice(1).join(':').trim().substring(0, 8);
      const dt = new Date(`${val.substring(0,4)}-${val.substring(4,6)}-${val.substring(6,8)}`);
      dt.setDate(dt.getDate() - 1);
      current.dateTo = dt.toISOString().split('T')[0];
    }
  }
  return events;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token') || req.headers.get('x-api-token');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabaseAdmin();
  const { data: session } = await sb.from('app_sessions').select('user_id').eq('token', token).single();
  const apiToken = process.env.CALENDAR_API_TOKEN;
  if (!session && !(apiToken && token === apiToken))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boat_id, url, replace } = await req.json();
  if (!boat_id || !url) return NextResponse.json({ error: 'boat_id and url required' }, { status: 400 });

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'OnlySea Calendar/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    let events: Array<{title: string, dateFrom: string, dateTo: string}> = [];
    if (text.includes('BEGIN:VCALENDAR')) {
      events = parseIcal(text);
    } else {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          events = json.map((e: any) => ({
            title: e.title || e.name || e.summary || 'Занято',
            dateFrom: e.date_from || e.start || e.dateFrom,
            dateTo: e.date_to || e.end || e.dateTo
          })).filter(e => e.dateFrom && e.dateTo);
        }
      } catch {
        return NextResponse.json({ error: 'Unsupported format. Use iCal (.ics) or JSON array' }, { status: 400 });
      }
    }

    if (events.length === 0) return NextResponse.json({ imported: 0, message: 'No events found' });

    if (replace) {
      await sb.from('boat_unavailable_dates').delete().eq('boat_id', boat_id).eq('source', 'url_import');
    }

    await sb.from('boat_unavailable_dates').insert(
      events.map(e => ({ boat_id, date_from: e.dateFrom, date_to: e.dateTo, title: e.title, source: 'url_import' }))
    );

    return NextResponse.json({ imported: events.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
