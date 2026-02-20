import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1'
    });

    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ success: false, error: 'No data to translate' }, { status: 400 });
    }

    // Collect all translatable strings
    const toTranslate: Record<string, string> = {};

    // Partner
    if (data.partner_name) toTranslate['partner_name'] = data.partner_name;
    if (data.partner_address) toTranslate['partner_address'] = data.partner_address;
    if (data.payment_terms) toTranslate['payment_terms'] = data.payment_terms;
    if (data.cancellation_policy) toTranslate['cancellation_policy'] = data.cancellation_policy;
    if (data.special_conditions) toTranslate['special_conditions'] = data.special_conditions;

    // Boats
    (data.boats || []).forEach((boat: any, bi: number) => {
      if (boat.notes) toTranslate['boat_' + bi + '_notes'] = boat.notes;
      (boat.routes || []).forEach((route: any, ri: number) => {
        if (route.destination) toTranslate['boat_' + bi + '_route_' + ri + '_dest'] = route.destination;
        if (route.notes) toTranslate['boat_' + bi + '_route_' + ri + '_notes'] = route.notes;
      });
      // Features
      if (boat.features) {
        (boat.features.included || []).forEach((f: any, fi: number) => {
          if (f.name) toTranslate['boat_' + bi + '_feat_inc_' + fi] = f.name;
        });
        (boat.features.paid || []).forEach((f: any, fi: number) => {
          if (f.name) toTranslate['boat_' + bi + '_feat_paid_' + fi] = f.name;
        });
      }
    });

    // Inclusions / Exclusions
    (data.general_inclusions || []).forEach((item: string, i: number) => {
      if (item) toTranslate['inclusion_' + i] = item;
    });
    (data.general_exclusions || []).forEach((item: string, i: number) => {
      if (item) toTranslate['exclusion_' + i] = item;
    });

    // Extras
    (data.extras || []).forEach((e: any, i: number) => {
      if (e.name) toTranslate['extra_' + i + '_name'] = e.name;
      if (e.notes) toTranslate['extra_' + i + '_notes'] = e.notes;
    });

    // Relocation fees
    (data.relocation_fees || []).forEach((rf: any, i: number) => {
      if (rf.departure_point) toTranslate['reloc_' + i] = rf.departure_point;
      if (rf.notes) toTranslate['reloc_' + i + '_notes'] = rf.notes;
    });

    // Contract terms
    if (data.contract_terms) {
      const ct = data.contract_terms;
      if (ct.payment_terms) toTranslate['ct_payment'] = ct.payment_terms;
      if (ct.cancellation_policy) toTranslate['ct_cancel'] = ct.cancellation_policy;
      if (ct.commission_info) toTranslate['ct_commission'] = ct.commission_info;
      if (ct.rules_responsibilities) toTranslate['ct_rules'] = ct.rules_responsibilities;
    }

    const keys = Object.keys(toTranslate);
    if (keys.length === 0) {
      return NextResponse.json({ success: true, translations: {} });
    }

    // Build compact text for translation
    const inputText = keys.map(k => k + '|||' + toTranslate[k]).join('\n---\n');

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional English-to-Russian translator for boat charter contracts. Translate each text segment to Russian. Keep proper nouns (company names, boat names, pier names, island names) in their original language but transliterate them in parentheses if helpful. Keep numbers, dates, and currencies as-is. Output ONLY a JSON object where keys match the input keys and values are Russian translations. No markdown, no explanations.'
        },
        {
          role: 'user',
          content: 'Translate these contract fields to Russian. Each line has format KEY|||TEXT. Return JSON {key: "russian translation"}:\n\n' + inputText
        }
      ],
      temperature: 0.1,
      max_tokens: 8192,
    });

    let content = response.choices[0].message.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let translations: Record<string, string> = {};
    try {
      translations = JSON.parse(content);
    } catch {
      // Try fixing common issues
      try {
        translations = JSON.parse(content.replace(/,\s*}/g, '}'));
      } catch {
        console.error('Translation parse failed:', content.substring(0, 500));
        return NextResponse.json({ success: true, translations: {} });
      }
    }

    return NextResponse.json({ success: true, translations });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
