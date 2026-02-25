import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/hold$/i, '')
    .replace(/block$/i, '')
    .replace(/nye$/i, '')
    .trim();
}


// Known typos and aliases
const ALIASES: Record<string, string> = {
  'bonvoyave': 'bonvoyage',
  'bovoyage': 'bonvoyage',
  'bluaaqua': 'blueaqua',
  'bluket': 'blueket',
  'bluwing': 'bluewing',
};

function resolveAlias(normalized: string): string {
  return ALIASES[normalized] || normalized;
}
function extractBoatName(summary: string): string {
  const match = summary.match(/^(.+?)\s*\(/);
  return match ? match[1].trim() : summary.trim();
}

function mapTimeSlot(categories: string): string {
  const cat = categories.toLowerCase().replace(/\s+/g, ' ').trim();
  if (cat.includes('full day')) return 'full_day';
  if (cat.includes('half') && cat.includes('morning')) return 'half_day_morning';
  if (cat.includes('half') && cat.includes('afternoon')) return 'half_day_afternoon';
  if (cat.includes('sunset')) return 'sunset';
  return 'full_day';
}

interface TeamupEvent {
  summary: string;
  boatName: string;
  client: string;
  dateFrom: string;
  dateTo: string;
  timeSlot: string;
  isHold: boolean;
}

function parseTeamupIcal(icalText: string): TeamupEvent[] {
  const events: TeamupEvent[] = [];
  const lines = icalText.replace(/\r\n /g, '').replace(/\r\n/g, '\n').split('\n');
  let inEvent = false;
  let current: any = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current.summary && current.dateFrom) {
        const boatName = extractBoatName(current.summary);
        const clientMatch = current.summary.match(/\((.+)\)/);
        const isHold = /hold|block/i.test(boatName) || /hold|block/i.test(current.summary);
        events.push({
          summary: current.summary,
          boatName,
          client: current.who || (clientMatch ? clientMatch[1] : ''),
          dateFrom: current.dateFrom,
          dateTo: current.dateTo || current.dateFrom,
          timeSlot: mapTimeSlot(current.categories || 'Full Day'),
          isHold,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    if (line.startsWith('SUMMARY:')) current.summary = line.replace('SUMMARY:', '').trim();
    if (line.startsWith('CATEGORIES:')) current.categories = line.replace('CATEGORIES:', '').trim();
    if (line.startsWith('X-TEAMUP-WHO:')) current.who = line.replace('X-TEAMUP-WHO:', '').trim();
    if (line.startsWith('DTSTART')) {
      const val = line.split(':').slice(1).join(':').trim();
      const d = val.substring(0, 8);
      current.dateFrom = d.substring(0,4) + '-' + d.substring(4,6) + '-' + d.substring(6,8);
    }
    if (line.startsWith('DTEND')) {
      const val = line.split(':').slice(1).join(':').trim();
      const d = val.substring(0, 8);
      const dateStr = d.substring(0,4) + '-' + d.substring(4,6) + '-' + d.substring(6,8);
      const dt = new Date(dateStr);
      dt.setDate(dt.getDate() - 1);
      current.dateTo = dt.toISOString().split('T')[0];
    }
  }
  return events;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('os_token')?.value || req.headers.get('x-session-token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const isCron = token === 'cron-internal' && (req.headers.get('authorization') === 'Bearer ' + (process.env.CRON_SECRET || ''));
    if (!isCron) {
      const { data: session } = await sb.from('app_sessions').select('user_id').eq('token', token).single();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partner_id, teamup_url } = await req.json();
    if (!partner_id || !teamup_url) {
      return NextResponse.json({ error: 'partner_id and teamup_url required' }, { status: 400 });
    }

    const { data: boats } = await sb.from('boats').select('id, name').eq('partner_id', partner_id);
    if (!boats?.length) {
      return NextResponse.json({ error: 'No boats found for this partner' }, { status: 404 });
    }

    const boatMap = new Map<string, number>();
    for (const boat of boats) {
      boatMap.set(normalize(boat.name), boat.id);
    }

    const resp = await fetch(teamup_url, {
      headers: { 'User-Agent': 'OnlySea Calendar Sync/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) throw new Error('Teamup HTTP ' + resp.status);
    const icalText = await resp.text();

    const events = parseTeamupIcal(icalText);

    let matched = 0;
    let unmatched = 0;
    const unmatchedNames = new Set<string>();
    const boatEvents: Record<number, Array<{ date_from: string; date_to: string; title: string; source: string }>> = {};

    for (const evt of events) {
      const norm = resolveAlias(normalize(evt.boatName));
      let boatId: number | undefined;

      for (const [key, id] of boatMap) {
        if (norm === key || norm.startsWith(key) || key.startsWith(norm)) {
          boatId = id;
          break;
        }
      }

      if (!boatId) {
        for (const [key, id] of boatMap) {
          if (norm.includes(key) || key.includes(norm)) {
            boatId = id;
            break;
          }
        }
      }

      if (boatId) {
        if (!boatEvents[boatId]) boatEvents[boatId] = [];
        const slotLabel = evt.timeSlot === 'full_day' ? 'Full Day' :
          evt.timeSlot === 'half_day_morning' ? 'Morning' :
          evt.timeSlot === 'half_day_afternoon' ? 'Afternoon' : 'Sunset';
        boatEvents[boatId].push({
          date_from: evt.dateFrom,
          date_to: evt.dateTo,
          title: slotLabel + ': ' + (evt.client || evt.boatName) + (evt.isHold ? ' [HOLD]' : ''),
          source: 'teamup',
        });
        matched++;
      } else {
        unmatched++;
        unmatchedNames.add(evt.boatName);
      }
    }

    let boatsSynced = 0;
    for (const [boatId, evts] of Object.entries(boatEvents)) {
      await sb.from('boat_unavailable_dates').delete().eq('boat_id', Number(boatId)).eq('source', 'teamup');
      if (evts.length > 0) {
        for (let i = 0; i < evts.length; i += 500) {
          await sb.from('boat_unavailable_dates').insert(
            evts.slice(i, i + 500).map(e => ({ boat_id: Number(boatId), ...e }))
          );
        }
      }
      boatsSynced++;
    }

    for (const boat of boats) {
      const { data: existing } = await sb.from('boat_calendars').select('id').eq('boat_id', boat.id).maybeSingle();
      if (existing) {
        await sb.from('boat_calendars').update({
          calendar_type: 'teamup',
          ical_url: teamup_url,
          active: true,
          last_synced: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await sb.from('boat_calendars').insert({
          boat_id: boat.id,
          calendar_type: 'teamup',
          ical_url: teamup_url,
          active: true,
          last_synced: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_events: events.length,
      matched,
      unmatched,
      unmatched_names: [...unmatchedNames],
      boats_synced: boatsSynced,
      boats_in_db: boats.map(b => b.name),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
