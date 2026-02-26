import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';


// ─── Rate limiter ──────────────────────────────────────────────────────────────
// Sliding window: max 30 write requests per IP per 60 seconds
const RL_WINDOW_MS = 60_000;
const RL_MAX       = 30;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

// Prune stale entries every minute to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - RL_WINDOW_MS;
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, RL_WINDOW_MS);

// ─── CSRF check ────────────────────────────────────────────────────────────────
// Defense-in-depth on top of SameSite=lax cookie.
// Rejects requests whose Origin doesn't match the app's own origin.
function checkCsrf(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // server-side or same-origin requests that omit Origin

  const appUrl  = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const host    = req.headers.get('host') || '';
  const allowed = [appUrl, `https://${host}`, `http://${host}`].filter(Boolean);
  return allowed.some(a => origin === a);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
interface AuthUser { userId: number }

async function getAuthorizedUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get('os_token')?.value || req.headers.get('x-session-token');
  if (!token) return null;

  const { data: session } = await sb
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await getSupabaseAdmin().from('app_sessions').delete().eq('token', token);
    return null;
  }
  return { userId: session.user_id };
}

// ─── IP helper ─────────────────────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ─── Audit log ─────────────────────────────────────────────────────────────────
// Requires an audit_log table in Supabase:
//   CREATE TABLE audit_log (
//     id         bigserial PRIMARY KEY,
//     user_id    integer,
//     action     text NOT NULL,
//     table_name text NOT NULL,
//     match_json jsonb,
//     ip         text,
//     created_at timestamptz DEFAULT now()
//   );
async function writeAuditLog(opts: {
  userId: number;
  action: string;
  tableName: string;
  matchJson: Record<string, unknown> | null;
  ip: string;
}): Promise<void> {
  try {
    await getSupabaseAdmin().from('audit_log').insert({
      user_id:    opts.userId,
      action:     opts.action,
      table_name: opts.tableName,
      match_json: opts.matchJson ?? null,
      ip:         opts.ip,
    });
  } catch {
    // Audit failure must never break the main request
    console.error('[audit] Failed to write log:', opts.action, opts.tableName);
  }
}

// ─── Allowed tables ────────────────────────────────────────────────────────────
const ALLOWED_TABLES = [
  'partners', 'boats', 'routes', 'route_prices', 'boat_options',
  'options_catalog', 'import_history', 'catering_partners', 'catering_menu',
  'watersports_partners', 'watersports_catalog', 'decoration_partners',
  'decoration_catalog', 'boat_pricing_rules', 'partner_boats_pending',
  'availability', 'availability_imports', 'boat_availability',
];

// ─── Google Sheets auto-sync ───────────────────────────────────────────────────
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
    const nameIdx  = headers.indexOf('Real name');
    const photoIdx = headers.indexOf('Photo URL');
    const urlIdx   = headers.indexOf('Boat URLs');
    const chatIdx  = headers.indexOf('URL CHAT');
    const calIdx   = headers.indexOf('Calendars');
    if (nameIdx === -1) return;

    const boatNameUpper = boatName.toUpperCase().trim();
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length <= nameIdx) continue;
      const sheetName = cols[nameIdx]?.replace(/"/g, '').trim().toUpperCase();
      if (!sheetName) continue;
      if (sheetName === boatNameUpper || boatNameUpper.includes(sheetName) || sheetName.includes(boatNameUpper)) {
        const updates: any = {};
        if (photoIdx !== -1) { const v = cols[photoIdx]?.replace(/"/g, '').trim(); if (v?.startsWith('http')) updates.main_photo_url = v; }
        if (urlIdx   !== -1) { const v = cols[urlIdx]?.replace(/"/g, '').trim();   if (v?.startsWith('http')) updates.website_url = v; }
        if (chatIdx  !== -1) { const v = cols[chatIdx]?.replace(/"/g, '').trim();  if (v?.startsWith('http')) updates.chat_url = v; }
        if (calIdx   !== -1) { const v = cols[calIdx]?.replace(/"/g, '').trim();   if (v?.startsWith('http')) updates.calendar_url = v; }
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

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Rate limit
  if (!checkRateLimit(ip)) {
    console.warn(`[rate-limit] Blocked ${ip}`);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. CSRF check
  if (!checkCsrf(req)) {
    console.warn(`[csrf] Rejected origin="${req.headers.get('origin')}" ip=${ip}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Auth
  const authUser = await getAuthorizedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, table, data, match, select: selectFields } = await req.json();

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Table not allowed' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query: any;

    switch (action) {
      case 'insert': {
        query = supabaseAdmin.from(table).insert(data);
        if (selectFields) query = query.select(selectFields);
        break;
      }
      case 'update': {
        query = supabaseAdmin.from(table).update(data);
        if (match) for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
        if (selectFields) query = query.select(selectFields);
        break;
      }
      case 'delete': {
        query = supabaseAdmin.from(table).delete();
        if (match) for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
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

    // 4. Audit log — fire-and-forget, never blocks response
    writeAuditLog({
      userId:    authUser.userId,
      action,
      tableName: table,
      matchJson: match ?? null,
      ip,
    });

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
