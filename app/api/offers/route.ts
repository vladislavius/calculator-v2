import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await sb.from('offers').insert({
      boat_id:      body.boat_id,
      boat_name:    body.boat_name,
      search_date:  body.search_date,
      guests:       body.guests,
      time_slot:    body.time_slot,
      total_client: body.total_client,
      total_agent:  body.total_agent,
      lang:         body.lang || 'ru',
      snapshot:     body.snapshot,
      notes:        body.notes,
      created_by:   body.created_by,
    }).select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });

  const { data, error } = await sb.from('offers').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Проверяем срок действия
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Offer expired' }, { status: 410 });
  }

  return NextResponse.json(data);
}
