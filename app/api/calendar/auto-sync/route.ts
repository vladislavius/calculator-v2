import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== 'Bearer ' + cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  // 1. Sync regular iCal calendars
  try {
    const { data: icalCals } = await sb.from('boat_calendars').select('*').eq('active', true).eq('calendar_type', 'ical');
    if (icalCals?.length) {
      for (const cal of icalCals) {
        if (!cal.ical_url) continue;
        try {
          const resp = await fetch(cal.ical_url, { headers: { 'User-Agent': 'OnlySea Cron/1.0' }, signal: AbortSignal.timeout(10000) });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const text = await resp.text();
          const events: Array<{title: string, dateFrom: string, dateTo: string}> = [];
          const lines = text.replace(/\r\n /g, '').replace(/\r\n/g, '\n').split('\n');
          let inEvent = false, current: any = {};
          for (const line of lines) {
            if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue; }
            if (line === 'END:VEVENT') { if (current.dateFrom && current.dateTo) events.push(current); inEvent = false; continue; }
            if (!inEvent) continue;
            if (line.startsWith('SUMMARY:')) current.title = line.replace('SUMMARY:', '').trim();
            if (line.startsWith('DTSTART')) { const v = line.split(':').slice(1).join(':').trim().substring(0,8); current.dateFrom = v.substring(0,4)+'-'+v.substring(4,6)+'-'+v.substring(6,8); }
            if (line.startsWith('DTEND')) { const v = line.split(':').slice(1).join(':').trim().substring(0,8); const dt = new Date(v.substring(0,4)+'-'+v.substring(4,6)+'-'+v.substring(6,8)); dt.setDate(dt.getDate()-1); current.dateTo = dt.toISOString().split('T')[0]; }
          }
          await sb.from('boat_unavailable_dates').delete().eq('boat_id', cal.boat_id).eq('source', 'ical');
          if (events.length > 0) {
            await sb.from('boat_unavailable_dates').insert(events.map(e => ({ boat_id: cal.boat_id, date_from: e.dateFrom, date_to: e.dateTo, title: e.title || 'Busy', source: 'ical' })));
          }
          await sb.from('boat_calendars').update({ last_synced: new Date().toISOString() }).eq('id', cal.id);
          results.push({ type: 'ical', boat_id: cal.boat_id, events: events.length });
        } catch (e: any) {
          results.push({ type: 'ical', boat_id: cal.boat_id, error: e.message });
        }
      }
    }
  } catch (e: any) {
    results.push({ type: 'ical', error: e.message });
  }

  // 2. Sync Teamup calendars
  try {
    const { data: teamupCals } = await sb.from('boat_calendars')
      .select('boat_id, ical_url, boats(partner_id)')
      .eq('active', true).eq('calendar_type', 'teamup');
    if (teamupCals?.length) {
      const seen = new Map();
      for (const cal of teamupCals) {
        const pid = (cal.boats as any)?.partner_id;
        if (pid && cal.ical_url && !seen.has(cal.ical_url)) seen.set(cal.ical_url, pid);
      }
      for (const [url, partnerId] of seen) {
        try {
          const baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await fetch(baseUrl + '/api/calendar/sync-teamup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-token': 'cron-internal', 'authorization': 'Bearer ' + (cronSecret || '') },
            body: JSON.stringify({ partner_id: partnerId, teamup_url: url }),
          });
          const data = await res.json();
          results.push({ type: 'teamup', partner_id: partnerId, matched: data.matched, unmatched: data.unmatched });
        } catch (e: any) {
          results.push({ type: 'teamup', partner_id: partnerId, error: e.message });
        }
      }
    }
  } catch (e: any) {
    results.push({ type: 'teamup', error: e.message });
  }

  return NextResponse.json({ synced_at: new Date().toISOString(), results });
}
