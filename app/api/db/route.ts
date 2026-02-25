import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin session token against the database
async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Accept token from httpOnly cookie (primary) or header (legacy fallback)
  const token = req.cookies.get('os_token')?.value || req.headers.get('x-session-token');
  if (!token) return false;

  const { data: session } = await sb
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return false;
  if (new Date(session.expires_at) < new Date()) {
    await sb.from('app_sessions').delete().eq('token', token);
    return false;
  }
  return true;
}

// Tables that admin can write to
const ALLOWED_TABLES = [
  'partners', 'boats', 'routes', 'route_prices', 'boat_options',
  'options_catalog', 'import_history', 'catering_partners', 'catering_menu',
  'watersports_partners', 'watersports_catalog', 'decoration_partners',
  'decoration_catalog', 'boat_pricing_rules', 'partner_boats_pending',
  'availability', 'availability_imports', 'boat_availability'
];


// Auto-sync photo from Google Sheets when boat is inserted
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

async function autoSyncBoatFromSheet(boatName: string, boatId: number, supabaseAdmin: any) {
  try {
    const SHEETS_URL = "https://docs.google.com/spreadsheets/d/184iVugfmLU0sy3e9B9IEf5P4zHkJdFPiDEKC00xeR5g/export?format=csv";
    const res = await fetch(SHEETS_URL);
    const csv = await res.text();
    const lines = csv.split('\n');
    const headers = parseCSVLine(lines[0]);
    const nameIdx = headers.indexOf('Real name');
    const photoIdx = headers.indexOf('Photo URL');
    const urlIdx = headers.indexOf('Boat URLs');
    const chatIdx = headers.indexOf('URL CHAT');
    const calIdx = headers.indexOf('Calendars');
    if (nameIdx === -1) return;

    const boatNameUpper = boatName.toUpperCase().trim();
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length <= nameIdx) continue;
      const sheetName = cols[nameIdx]?.replace(/"/g, '').trim().toUpperCase();
      if (!sheetName) continue;
      if (sheetName === boatNameUpper || boatNameUpper.includes(sheetName) || sheetName.includes(boatNameUpper)) {
        const updates: any = {};
        if (photoIdx !== -1) {
          const photoUrl = cols[photoIdx]?.replace(/"/g, '').trim();
          if (photoUrl && photoUrl.startsWith('http')) updates.main_photo_url = photoUrl;
        }
        if (urlIdx !== -1) {
          const websiteUrl = cols[urlIdx]?.replace(/"/g, '').trim();
          if (websiteUrl && websiteUrl.startsWith('http')) updates.website_url = websiteUrl;
        }
        if (chatIdx !== -1) {
          const chatUrl = cols[chatIdx]?.replace(/"/g, '').trim();
          if (chatUrl && chatUrl.startsWith('http')) updates.chat_url = chatUrl;
        }
        if (calIdx !== -1) {
          const calUrl = cols[calIdx]?.replace(/"/g, '').trim();
          if (calUrl && calUrl.startsWith('http')) updates.calendar_url = calUrl;
        }
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin.from('boats').update(updates).eq('id', boatId);
          console.log(`Auto-synced boat: ${boatName} (id=${boatId}) fields: ${Object.keys(updates).join(', ')}`);
        }
        return;
      }
    }
  } catch (e) {
    console.error('Boat auto-sync error:', e);
  }
}

export async function POST(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, table, data, match, select: selectFields } = await req.json();

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Table not allowed' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query;

    switch (action) {
      case 'insert': {
        query = supabaseAdmin.from(table).insert(data);
        if (selectFields) query = query.select(selectFields);
        break;
      }
      case 'update': {
        query = supabaseAdmin.from(table).update(data);
        if (match) {
          for (const [key, value] of Object.entries(match)) {
            query = query.eq(key, value);
          }
        }
        if (selectFields) query = query.select(selectFields);
        break;
      }
      case 'delete': {
        query = supabaseAdmin.from(table).delete();
        if (match) {
          for (const [key, value] of Object.entries(match)) {
            query = query.eq(key, value);
          }
        }
        break;
      }
      case 'upsert': {
        query = supabaseAdmin.from(table).upsert(data);
        if (selectFields) query = query.select(selectFields);
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await query;

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    // Auto-sync photo when new boat is inserted
    if (action === 'insert' && table === 'boats' && result.data) {
      const inserted = Array.isArray(result.data) ? result.data : [result.data];
      for (const boat of inserted) {
        if ((boat as any)?.id && (boat as any)?.name) {
          autoSyncBoatFromSheet((boat as any).name, (boat as any).id, supabaseAdmin);
        }
      }
    }

    return NextResponse.json({ data: result.data, count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// This file is already complete - see patch below
