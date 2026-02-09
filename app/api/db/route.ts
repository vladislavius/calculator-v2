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

    return NextResponse.json({ data: result.data, count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
