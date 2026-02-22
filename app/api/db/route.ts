import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Verify admin session token
function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  return !!token && token.length === 64;
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
async function autoSyncBoatFromSheet(boatName: string, boatId: number, supabaseAdmin: any) {
  try {
    const SHEETS_URL = "https://docs.google.com/spreadsheets/d/184iVugfmLU0sy3e9B9IEf5P4zHkJdFPiDEKC00xeR5g/export?format=csv&gid=1788852346";
    const res = await fetch(SHEETS_URL);
    const csv = await res.text();
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
    const nameIdx = headers.indexOf('Real name');
    const photoIdx = headers.indexOf('Photo URL');
    const urlIdx = headers.indexOf('Boat URLs');
    if (nameIdx === -1) return;

    const boatNameUpper = boatName.toUpperCase().trim();
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
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
  if (!isAuthorized(req)) {
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
