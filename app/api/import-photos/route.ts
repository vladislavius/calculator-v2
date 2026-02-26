import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { csvText } = await req.json()
    const lines = csvText.split('\n')
    const headers = lines[0].split(';').map((h: string) => h.replace(/"/g, '').trim())
    const titleIdx = headers.indexOf('Title')
    const photoIdx = headers.indexOf('Photo')
    const parentUidIdx = headers.indexOf('Parent UID')
    const results: any[] = []
    let updated = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      const cols = parseCSVLine(line)
      const parentUid = cols[parentUidIdx]?.replace(/"/g, '').trim()
      if (parentUid) continue
      const title = cols[titleIdx]?.replace(/"/g, '').trim()
      const photoField = cols[photoIdx]?.replace(/"/g, '').trim()
      if (!title || !photoField) { skipped++; continue }
      const firstPhoto = photoField.split(' ')[0].trim()
      if (!firstPhoto.startsWith('http')) { skipped++; continue }

      const { data: boats } = await supabase
        .from('boats')
        .select('id, name, main_photo_url')
        .ilike('name', `%${title}%`)
        .limit(1)

      if (!boats || boats.length === 0) {
        results.push({ title, status: 'not_found' })
        skipped++
        continue
      }

      const boat = boats[0]
      const { error } = await supabase
        .from('boats')
        .update({ main_photo_url: firstPhoto })
        .eq('id', boat.id)

      if (error) {
        results.push({ title, status: 'error', error: error.message })
      } else {
        results.push({ title, boatId: boat.id, boatName: boat.name, photo: firstPhoto, status: 'updated' })
        updated++
      }
    }

    return NextResponse.json({ success: true, updated, skipped, total: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ';' && !inQuotes) { result.push(current); current = '' }
    else { current += char }
  }
  result.push(current)
  return result
}
