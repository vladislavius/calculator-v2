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

    const { text } = await request.json();
    if (!text) return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });

    const systemPrompt = `You are a menu parser for yacht/boat charter companies.

Analyze the menu text and determine the TYPE:
1. "sets" - if the menu contains named sets (Set 1, Set 2, etc.) with dishes grouped together, usually one price per person
2. "a_la_carte" - if the menu lists individual dishes with individual prices (per piece, per kg, etc.)

RETURN JSON:
{
  "menu_type": "sets" or "a_la_carte",
  "menu_name": "name of the menu in English",
  "menu_name_ru": "name in Russian",
  "selection_rule": "pick_one" (choose 1 set) or "pick_many" (choose multiple) or "any" (no restriction),
  "price_per_person": number or null (for sets with a single price),
  "min_persons": number or null,
  "notes": "important conditions in English",
  "notes_ru": "important conditions in Russian",
  "items": [
    {
      "set_name": "Set 1" or null (for a_la_carte),
      "set_name_ru": "Set 1" or null,
      "name_en": "Dish name in English",
      "name_th": "Thai name or null",
      "name_ru": "Russian name",
      "category": "thai|western|seafood|bbq|kids|drinks|dessert|other",
      "price": number or null,
      "price_unit": "piece|kg|portion|person|set",
      "is_free": false
    }
  ]
}

RULES:
- For SETS: group dishes under their set_name. If one price for all sets (e.g. 400 THB per person), put it in price_per_person, leave individual prices null.
- For A_LA_CARTE: each dish has its own price and price_unit. set_name is null.
- If a dish says FREE or has no price and is clearly complimentary, set is_free: true, price: 0.
- Translate ALL dish names to Russian (name_ru).
- Keep Thai names in name_th if present.
- Extract minimum persons/sets if mentioned (e.g. minimum 5 set means min_persons: 5).
- Determine selection_rule: if customer picks ONE set from several options then pick_one. If they can mix then pick_many.
- Categories: thai (Thai food), western (Western/European), seafood, bbq (BBQ/Grill), kids (children), drinks, dessert, other.

Be thorough and extract ALL items.`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Parse this boat menu:\n\n' + text.substring(0, 15000) }
      ],
      temperature: 0.1,
      max_tokens: 6000,
    });

    let content = response.choices[0].message.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const data = JSON.parse(content);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Boat menu parse error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
