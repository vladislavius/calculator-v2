import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SHEETS_URL = "https://docs.google.com/spreadsheets/d/184iVugfmLU0sy3e9B9IEf5P4zHkJdFPiDEKC00xeR5g/export?format=csv";

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


function normalizeName(name: string): string {
  return name.toUpperCase().trim()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/[^A-Z0-9\s-]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // Fetch all boats from DB
    const { data: boats, error: boatsErr } = await supabase.from('boats').select('id, name, main_photo_url, website_url, chat_url, calendar_url');
    if (boatsErr) return NextResponse.json({ error: boatsErr.message }, { status: 500 });

    // Fetch Google Sheet
    const res = await fetch(SHEETS_URL);
    const csv = await res.text();
    const lines = csv.split('\n');
    const headers = parseCSVLine(lines[0]);
    const nameIdx = headers.indexOf('Real name');
    const photoIdx = headers.indexOf('Photo URL');
    const urlIdx = headers.indexOf('Boat URLs');
    const chatIdx = headers.indexOf('URL CHAT');
    const calIdx = headers.indexOf('Calendars');

    if (nameIdx === -1) return NextResponse.json({ error: 'Column "Real name" not found in sheet' }, { status: 400 });

    // Build sheet map: name -> { photoUrl, websiteUrl }
    const sheetMap = new Map<string, { photoUrl: string; websiteUrl: string; chatUrl: string; calUrl: string }>();
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = normalizeName(cols[nameIdx] || '');
      if (!name) continue;
      const photoUrl = photoIdx !== -1 ? (cols[photoIdx]?.trim() || '') : '';
      const websiteUrl = urlIdx !== -1 ? (cols[urlIdx]?.trim() || '') : '';
      const chatUrl = chatIdx !== -1 ? (cols[chatIdx]?.trim() || '') : '';
      const calUrl = calIdx !== -1 ? (cols[calIdx]?.trim() || '') : '';
      sheetMap.set(name, { photoUrl, websiteUrl, chatUrl, calUrl });
    }

    let updatedPhoto = 0, updatedUrl = 0, skipped = 0;
    const details: any[] = [];

    for (const boat of (boats || [])) {
      const boatNameUpper = normalizeName(boat.name);
      let match = sheetMap.get(boatNameUpper);
      // Try without numbers/spaces
      if (!match) {
        const stripped = boatNameUpper.replace(/[0-9\s-]/g, '');
        for (const [sheetName, data] of sheetMap) {
          const sheetStripped = sheetName.replace(/[0-9\s-]/g, '');
          if (stripped === sheetStripped) { match = data; break; }
        }
      }

      // Fuzzy match if exact not found
      if (!match) {
        for (const [sheetName, data] of sheetMap) {
          if (boatNameUpper.includes(sheetName) || sheetName.includes(boatNameUpper)) {
            match = data;
            break;
          }
        }
      }

      if (!match) { skipped++; continue; }

      const updates: any = {};
      if (match.photoUrl.startsWith('http') && match.photoUrl !== boat.main_photo_url) {
        updates.main_photo_url = match.photoUrl;
        updatedPhoto++;
      }
      if (match.websiteUrl.startsWith('http') && match.websiteUrl !== boat.website_url) {
        updates.website_url = match.websiteUrl;
        updatedUrl++;
      }
      if (match.chatUrl.startsWith('http') && match.chatUrl !== boat.chat_url) {
        updates.chat_url = match.chatUrl;
      }
      if (match.calUrl.startsWith('http') && match.calUrl !== boat.calendar_url) {
        updates.calendar_url = match.calUrl;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('boats').update(updates).eq('id', boat.id);
        details.push({ name: boat.name, ...updates });
      }
    }

    return NextResponse.json({
      success: true,
      total: boats?.length || 0,
      updatedPhoto,
      updatedUrl,
      skipped,
      details
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
