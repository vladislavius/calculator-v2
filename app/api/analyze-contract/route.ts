import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MAX_CONTRACT_LENGTH = 50000;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    const { text } = await request.json();

    // For long contracts: use Gemini 2.0 Flash (1M token context, no truncation)
    // For normal contracts: use DeepSeek (cheaper, faster)
    const isLongContract = text.length > MAX_CONTRACT_LENGTH;
    const useGemini = !!process.env.GEMINI_API_KEY;

    const openai = useGemini
      ? new OpenAI({
          apiKey: process.env.GEMINI_API_KEY,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        })
      : new OpenAI({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: 'https://api.deepseek.com/v1',
        });

    const modelName = useGemini ? 'gemini-3-flash-preview' : 'deepseek-chat';

    // Gemini handles full text (1M context); DeepSeek truncates at MAX_CONTRACT_LENGTH
    const wasTruncated = !useGemini && isLongContract;
    const processedText = useGemini ? text : text.substring(0, MAX_CONTRACT_LENGTH);

    if (useGemini) {
      console.log(`Long contract (${text.length} chars) → Gemini 2.0 Flash (full text, no truncation)`);
    } else if (wasTruncated) {
      console.log(`Long contract (${text.length} chars) → DeepSeek truncated to ${MAX_CONTRACT_LENGTH} (GEMINI_API_KEY not set)`);
    }

    const systemPrompt = `You are an elite Data Extraction AI specialized in luxury yacht charter contracts.
Your objective is to extract highly unstructured text into a STRICT, predictable JSON format.

CRITICAL RULES:
1. ONLY output valid JSON. No markdown wrappers.
2. NEVER invent data. Use null or empty arrays if missing.
3. Chain of Thought: Always start the JSON with a "_reasoning_process" field.
4. Normalize Prices: Remove commas (25,000 -> 25000). All prices are NUMBERS.

═══════════════════════════════════════════
STEP 0 — DETECT INPUT TYPE
═══════════════════════════════════════════
Before extracting, identify the input format:

CHAT/MESSENGER (WhatsApp, Telegram, Line, etc.) — signals:
- Timestamps like "14:32", "12/03/2025", "Yesterday", "[photo]", "[sticker]"
- Short fragmented lines, emojis, "ok", "sure", "подожди", "ок", "555"
- Same topic discussed across many separate messages
→ Apply CHAT PREPROCESSING rules below before extraction

STRUCTURED DOCUMENT (PDF, DOCX, email, price list) — signals:
- Tables, bullet lists, numbered sections
- Headers like "PRICE LIST", "TERMS & CONDITIONS", "CHARTER AGREEMENT"
- Consistent column-based or indented formatting
→ Skip preprocessing, proceed directly to STEP 2

═══════════════════════════════════════════
STEP 1 — CHAT PREPROCESSING (if chat detected)
═══════════════════════════════════════════
Before extracting business data, mentally reconstruct the conversation:

1. FILTER OUT noise lines:
   - Greetings, acknowledgements ("ok", "sure", "👍", "ок", "подожди", "555", "np")
   - Media placeholders ("[photo]", "[sticker]", "[voice message]", "[document]")
   - Completely off-topic lines (weather, personal chat, unrelated questions)

2. RECONSTRUCT scattered context:
   - Link price mentions to their boat/route even if separated by many messages
   - Example: "how much for Phi Phi?" ... [30 messages] ... "28,000 for that" → price 28000 for Phi Phi
   - Use surrounding context to resolve "that", "it", "this boat", "same price" references

3. HANDLE corrections — always use the LAST stated value:
   - "price is 25,000" ... "sorry, correction — 28,000" → use 28000
   - "8 pax max" ... "actually 10" → use 10
   - "no alcohol included" ... "ok we can include beer" → beer IS included

4. HANDLE mixed languages (EN/RU/TH mixed in same chat) — extract regardless of language:
   - "лодка 40 фут" → length_ft: 40
   - "ราคา 25000" → price: 25000
   - "включено питание" → include meals in "included"

5. MARK uncertainty: if you cannot confidently link a piece of data to a boat/route,
   add "[UNCLEAR]" at the end of that field's value instead of guessing.

═══════════════════════════════════════════
STEP 2 — DETECT CONTRACT TYPE
═══════════════════════════════════════════
- TYPE A: Day charters with routes/destinations (Coral, Racha, Phi Phi, Similan, Full Day, Half Day, etc.) — multiple routes, per-boat pricing
  → SEASONAL EXPANSION RULE: For every unique (season × charter_type/destination) combination that has a DISTINCT price, create a SEPARATE route entry in "routes". NEVER collapse different seasons into one entry. NEVER put seasonal pricing only into "pricing_rules" — it MUST also appear as separate route entries.
  → When no specific destination is named, use the charter type as destination: "Full Day", "Half Day", "Similan", etc.
  → MANDATORY COUNT CHECK: Before finalizing, compute N_seasons × N_charter_types = expected_routes. Verify routes[] has exactly that many entries. State this count in _reasoning_process.
  → CONCRETE EXAMPLE — contract with Peak/High/Low × Full Day/Half Day/Similan (VAT+20% commission included):
    routes: [
      { "destination": "Full Day",  "duration_hours": 8, "season": "peak", "client_price": 115000, "base_price": 95833, "agent_price": 95833 },
      { "destination": "Half Day",  "duration_hours": 4, "season": "peak", "client_price": 85000,  "base_price": 70833, "agent_price": 70833 },
      { "destination": "Similan",   "duration_hours": 8, "season": "peak", "client_price": 148000, "base_price": 123333, "agent_price": 123333 },
      { "destination": "Full Day",  "duration_hours": 8, "season": "high", "client_price": 105000, "base_price": 87500,  "agent_price": 87500 },
      { "destination": "Half Day",  "duration_hours": 4, "season": "high", "client_price": 75000,  "base_price": 62500,  "agent_price": 62500 },
      { "destination": "Similan",   "duration_hours": 8, "season": "high", "client_price": 138000, "base_price": 115000, "agent_price": 115000 },
      { "destination": "Full Day",  "duration_hours": 8, "season": "low",  "client_price": 88000,  "base_price": 73333,  "agent_price": 73333 },
      { "destination": "Half Day",  "duration_hours": 4, "season": "low",  "client_price": 68000,  "base_price": 56667,  "agent_price": 56667 }
    ]  — 8 routes total (3 seasons x 3 types, minus Similan which has no Low season price)
  → Half Day duration_hours: use explicitly stated hours, or default to 4 if not stated.
- TYPE B: Overnight/multi-day charters (2D/1N, 3D/2N, etc.)
- TYPE C: Multiple boats with same routes (like Tiger Marine, Badaro)
- TYPE D: Boat names listed at top, then SHARED pricing section below
- TYPE E: Per-person pricing with guest ranges (e.g. "50 pax: 3,500 THB/person") — common for large vessels, party boats
- TYPE F: Single vessel with relocation/departure fees (different prices per departure point)

═══════════════════════════════════════════
STEP 3 — PRICING & COMMISSION RULES
═══════════════════════════════════════════
- GROSS/Selling price = client_price (what end customer pays)
- NET/Agent rate = base_price AND agent_price (what agent pays operator)
- COMMISSION = the difference
- NEVER put a gross price into base_price. If only one price given with "commission XX% included" → calculate NET for base_price, put original in client_price
- TYPE E (Per person): Create separate rules in "pricing_rules" for each passenger range

COMMISSION MATH — mandatory calculation steps:
1. "Price X THB — VAT and 20% commission included" → the listed price X is the GROSS (client_price). base_price = agent_price = round(X / 1.2).
   Example: 115,000 THB commission included → client_price: 115000, base_price: 95833, agent_price: 95833
2. "Net price X THB, 20% commission on top" → base_price = agent_price = X, client_price = round(X * 1.2)
3. NEVER set base_price = client_price when any commission is mentioned.

FIELD CONSTRAINTS — prevent hallucinations:
- extra_pax_price on boat level: set ONLY if the contract explicitly states an extra-passenger surcharge rate. If NOT mentioned, set to 0.
- Route guests_to: MUST NOT exceed the boat's max_pax_day unless the route explicitly states a different capacity.
- Route guests_from: use 1 unless contract states minimum passengers.
- Do NOT invent duration_hours — use only what is stated (Full Day = stated hours or 8; Half Day = stated hours or 4).

PRICE CONFLICT RESOLUTION:
- Same price mentioned multiple times → use the LAST occurrence
- Conflicting dates → prefer more specific/narrower date range
- Multiple currencies mentioned → keep THB as primary, note others in "notes"
- Price seems too low/high for charter → extract as-is, do NOT adjust, add to notes if suspicious

═══════════════════════════════════════════
STEP 4 — EXTRACT JSON
═══════════════════════════════════════════

{
  "_reasoning_process": "String: (1) input type (chat/document), (2) contract type (A/B/C/D/E/F), (3) boats found, (4) for TYPE A — list all seasons found × charter types found = expected route count, verify routes[] matches this count, (5) commission math applied, (6) any ambiguities or [UNCLEAR] items.",
  "partner": {
    "name": "exact company name",
    "address": "if provided",
    "tax_id": "if provided",
    "license": "if provided",
    "phones": [{"number": "xxx", "contact_name": "if provided", "languages": ["if provided"]}],
    "emails": ["if provided"],
    "validity": "contract period, e.g. 05/02/2026 - 31/10/2026",
    "bank_details": {"bank_name": "string", "account_number": "string", "account_name": "string", "swift": "string", "branch": "string"}
  },
  "boats": [
    {
      "name": "exact boat name",
      "model": "model if mentioned",
      "year_built": number or null,
      "type": "catamaran/yacht/speedboat/sailing/party_boat/cruise - from context",
      "length_ft": number or null,
      "length_m": number or null,
      "beam_m": number or null,
      "cabins": number or null,
      "toilets": number or null,
      "showers": number or null,
      "max_pax_day": number,
      "max_pax_overnight": number or null,
      "base_pax": number,
      "extra_pax_price": number,
      "crew_count": number or null,
      "crew_details": "e.g. Captain, 2 crew, chef",
      "departure_pier": "default departure point",
      "vessel_specs": "any vessel specifications text",
      "deck_plan": "deck layout description if provided",
      "routes": [
        {
          "destination": "destination name or 'Private Charter' for single-destination vessels",
          "duration_hours": number,
          "duration_nights": number or 0,
          "base_price": number (this is NET),
          "agent_price": number (same as NET),
          "client_price": number (this is GROSS),
          "fuel_surcharge": number or 0,
          "season": "all/low/high/peak",
          "price_type": "per_person" or "total",
          "guests_from": number,
          "guests_to": number,
          "extra_hour_price": number,
          "notes": "string"
        }
      ]
    }
  ],
  "relocation_fees": [
    {
      "name": "Relocation from [LOCATION_NAME]",
      "price": number,
      "price_per": "trip",
      "note": "any conditions"
    }
  ],
  "pricing_rules": [
    {
      "boat_name": "which boat",
      "charter_type": "full_day/half_day/morning/afternoon/overnight/private",
      "price_type": "per_person" or "total",
      "season": "all/low/high/peak",
      "season_dates": "if specified",
      "guests_from": number,
      "guests_to": number,
      "base_price": number (NET),
      "agent_price": number (NET),
      "client_price": number (GROSS),
      "commission_amount": number,
      "commission_percent": number,
      "extra_pax_price": number,
      "extra_hour_price": number,
      "duration_hours": number,
      "time_slot": "HH:MM-HH:MM if specified"
    }
  ],
  "included": [
    {"name": "exact item name", "category": "crew/meals/drinks/equipment/amenities/transport/insurance/entertainment", "details": "string"}
  ],
  "not_included": [
    {"name": "exact item name", "note": "price or conditions"}
  ],
  "optional_extras": [
    {"name": "exact item name", "price": number, "price_per": "day/hour/person/trip", "note": "additional info"}
  ],
  "contract_terms": {
    "payment_terms": "full payment terms",
    "cancellation_policy": "full cancellation text",
    "commission_info": "commission rules",
    "insurance_info": "if mentioned",
    "rules_responsibilities": "guest rules, etc."
  },
  "notes": ["string array of important conditions"],
  "children_policy": "string if mentioned",
  "commission_info": "string if mentioned"
}

TRANSLATION REQUIREMENT:
- ALL text fields (names of included items, excluded items, extras, notes, details, vessel_specs, deck_plan, crew_details) must be translated to Russian
- Keep proper nouns (boat names, company names, location names, pier names) in original language
- Examples: "Fresh Fruit" -> "Свежие фрукты", "Professional crew" -> "Профессиональная команда", "Fuel" -> "Топливо"
- "Relocation from KOH YAO YAI" -> "Релокация из KOH YAO YAI" (location stays in English)
- Price types: "per_person" / "total" / "trip" — keep as-is (these are code values)

IMPORTANT: Output ONLY valid JSON. No markdown, no explanations, no code fences.`;

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Parse this charter contract. Extract ONLY what is explicitly written. Output valid JSON only:\n\n' + processedText }
      ],
      temperature: 0.03,
      max_tokens: 16384,
    });

    let content = response.choices[0].message.content || '{}';
    console.log('Raw AI response length:', content.length);
    console.log('Raw AI response first 500:', content.substring(0, 500));
    console.log('Raw AI response last 500:', content.substring(content.length - 500));

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Check if response was likely truncated (ends without proper closing)
    const trimmed = content.trim();
    const lastChar = trimmed[trimmed.length - 1];
    const possiblyTruncated = lastChar !== '}' && lastChar !== ']';

    // If truncated, request continuation
    if (possiblyTruncated) {
      console.log('Response appears truncated, requesting continuation...');
      try {
        const contResponse = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: 'You previously started outputting JSON but it was cut off. Continue EXACTLY from where you stopped. Output ONLY the remaining JSON to complete the structure. No explanations.' },
            { role: 'user', content: 'Continue this JSON (pick up exactly where it ends):\n\n' + content.substring(content.length - 2000) }
          ],
          temperature: 0.01,
          max_tokens: 4096,
        });
        const continuation = (contResponse.choices[0].message.content || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (continuation.length > 10) {
          content = content + continuation;
          console.log('Continuation added, total length:', content.length);
        }
      } catch (contErr: any) {
        console.error('Continuation request failed:', contErr.message);
      }
    }

    // Robust JSON fixer
    const fixJson = (str: string): any => {
      try { return JSON.parse(str); } catch (e: any) { console.log('Direct parse failed:', e.message); }

      let fixed = str;

      // Remove trailing commas
      fixed = fixed.replace(/,\s*([}\]])/g, '$1');
      try { return JSON.parse(fixed); } catch { }

      // Fix single quotes to double quotes in keys
      fixed = fixed.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
      try { return JSON.parse(fixed); } catch { }

      // Fix unescaped newlines inside strings
      fixed = fixed.replace(/(?<=": ")(.*?)(?="[,}\]])/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      try { return JSON.parse(fixed); } catch { }

      // Truncate to last complete structure
      const lastBrace = fixed.lastIndexOf('}');
      const lastBracket = fixed.lastIndexOf(']');
      const cutAt = Math.max(lastBrace, lastBracket);
      if (cutAt > 0) {
        let truncated = fixed.substring(0, cutAt + 1);
        const ob = (truncated.match(/{/g) || []).length;
        const cb = (truncated.match(/}/g) || []).length;
        const osb = (truncated.match(/\[/g) || []).length;
        const csb = (truncated.match(/\]/g) || []).length;
        truncated += '}'.repeat(Math.max(0, ob - cb));
        truncated += ']'.repeat(Math.max(0, osb - csb));
        try { return JSON.parse(truncated); } catch { }

        const lastComma = truncated.lastIndexOf(',');
        if (lastComma > 0) {
          let chopped = truncated.substring(0, lastComma);
          const ob2 = (chopped.match(/{/g) || []).length;
          const cb2 = (chopped.match(/}/g) || []).length;
          chopped += '}'.repeat(Math.max(0, ob2 - cb2));
          try { return JSON.parse(chopped); } catch { }
        }
      }

      // Extract first JSON object
      const match = str.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { }
        let ext = match[0].replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(ext); } catch { }
      }

      console.log('All JSON fix attempts failed. Content sample:', str.substring(0, 1000));
      throw new Error('Failed to parse AI response as JSON - sample: ' + str.substring(0, 300));
    };

    const data = fixJson(content);

    // Validate AI response
    const warnings: string[] = [];

    if (wasTruncated) {
      warnings.push('Contract truncated: ' + text.length.toLocaleString() + ' -> ' + MAX_CONTRACT_LENGTH.toLocaleString() + ' chars. Data at end may be lost. Set GEMINI_API_KEY to parse full text.');
    }

    if (useGemini) {
      warnings.push('Long contract parsed via Gemini 2.0 Flash (full ' + text.length.toLocaleString() + ' chars, no truncation).');
    }

    if (possiblyTruncated) {
      warnings.push('AI response was truncated and auto-continued. Some data may be incomplete.');
    }

    if (!data.partner && !data.boats?.length) {
      return NextResponse.json({
        success: false,
        error: 'AI could not parse contract data. Try a different format.'
      }, { status: 422 });
    }

    if (!data.boats || data.boats.length === 0) {
      warnings.push('No boats found in contract');
    } else {
      const boatsWithoutRoutes = data.boats.filter((b: any) => !b.routes || b.routes.length === 0);
      if (boatsWithoutRoutes.length > 0) {
        warnings.push('Boats without routes: ' + boatsWithoutRoutes.map((b: any) => b.name).join(', '));
      }
      const boatsWithoutPrices = data.boats.filter((b: any) =>
        b.routes?.length > 0 && b.routes.every((r: any) => !r.base_price || r.base_price === 0)
      );
      if (boatsWithoutPrices.length > 0) {
        warnings.push('Boats without prices: ' + boatsWithoutPrices.map((b: any) => b.name).join(', '));
      }
    }

    if (!data.partner?.name) {
      warnings.push('Partner name not recognized');
    }

    // Validate pricing: check if gross/net were correctly assigned
    if (data.pricing_rules?.length > 0) {
      const hasMismatch = data.pricing_rules.some((p: any) =>
        p.client_price && p.base_price && p.client_price < p.base_price
      );
      if (hasMismatch) {
        warnings.push('WARNING: Some client prices are lower than agent prices - gross/net may be swapped');
      }
    }

    if (data.relocation_fees?.length > 0) {
      warnings.push('Relocation fees found: ' + data.relocation_fees.length + ' departure points');
    }

    return NextResponse.json({
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
      truncated: wasTruncated || undefined
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
