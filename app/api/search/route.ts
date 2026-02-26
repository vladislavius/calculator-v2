import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Allowed enum values ────────────────────────────────────────────────────
const TIME_SLOTS = ['full_day', 'half_day', 'sunset', 'overnight'] as const;
const BOAT_TYPES = ['', 'catamaran', 'speedboat', 'yacht'] as const;
const SEASONS    = ['', 'auto', 'all_seasons', 'high', 'low', 'peak'] as const;

type TimeSlot = typeof TIME_SLOTS[number];
type BoatType = typeof BOAT_TYPES[number];
type Season   = typeof SEASONS[number];

// ─── Validation helpers ─────────────────────────────────────────────────────
function isISODate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

function parsePositiveInt(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

function parsePositiveNumber(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

function isEnum<T extends string>(v: unknown, allowed: readonly T[]): v is T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

// ─── Validation errors ──────────────────────────────────────────────────────
interface ValidationError { field: string; message: string }

function validate(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isISODate(body.p_date)) {
    errors.push({ field: 'p_date', message: 'Must be a valid date in YYYY-MM-DD format' });
  }

  const guests = parsePositiveInt(body.p_guests, 1, 200);
  if (guests === null) {
    errors.push({ field: 'p_guests', message: 'Must be an integer between 1 and 200' });
  }

  if (!isEnum(body.p_time_slot, TIME_SLOTS)) {
    errors.push({ field: 'p_time_slot', message: `Must be one of: ${TIME_SLOTS.join(', ')}` });
  }

  if (body.p_boat_type !== undefined && !isEnum(body.p_boat_type, BOAT_TYPES)) {
    errors.push({ field: 'p_boat_type', message: `Must be one of: ${BOAT_TYPES.join(', ')}` });
  }

  if (body.p_destination !== undefined) {
    if (typeof body.p_destination !== 'string' || body.p_destination.length > 200) {
      errors.push({ field: 'p_destination', message: 'Must be a string with max 200 characters' });
    }
  }

  if (body.p_max_budget !== undefined) {
    if (parsePositiveNumber(body.p_max_budget, 0, 100_000_000) === null) {
      errors.push({ field: 'p_max_budget', message: 'Must be a number between 0 and 100,000,000' });
    }
  }

  if (body.p_season !== undefined && !isEnum(body.p_season, SEASONS)) {
    errors.push({ field: 'p_season', message: `Must be one of: ${SEASONS.join(', ')}` });
  }

  return errors;
}

// ─── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errors = validate(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // Build clean, typed params — no raw user strings reach the DB driver
  const params = {
    p_date:        body.p_date as string,
    p_guests:      Number(body.p_guests),
    p_time_slot:   body.p_time_slot as TimeSlot,
    p_boat_type:   (body.p_boat_type ?? '') as BoatType,
    p_destination: typeof body.p_destination === 'string' ? body.p_destination.trim() : '',
    p_max_budget:  body.p_max_budget !== undefined ? Number(body.p_max_budget) : 999_999,
    p_season:      (body.p_season === 'auto' || !body.p_season ? '' : body.p_season) as Season,
  };

  const { data, error } = await getSb().rpc('search_available_boats', params);

  if (error) {
    console.error('search_available_boats error:', error.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
