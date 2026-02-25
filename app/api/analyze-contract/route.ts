import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MAX_CONTRACT_LENGTH = 50000;

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

    const wasTruncated = text.length > MAX_CONTRACT_LENGTH;
    const processedText = text.substring(0, MAX_CONTRACT_LENGTH);

    const systemPrompt = `You are an elite Data Extraction AI specialized in luxury yacht charter contracts. 
Your objective is to extract highly unstructured text into a STRICT, predictable JSON format.

CRITICAL RULES:
1. ONLY output valid JSON. No markdown wrappers.
2. NEVER invent data. Use null or empty arrays if missing.
3. Chain of Thought: Always start the JSON with a "_reasoning_process" field to briefly explain your logic for identifying boats, routes, and pricing.
4. Normalize Prices: Remove commas (25,000 -> 25000). All prices are NUMBERS.

DETECT CONTRACT TYPE & PRICING RULES:
- TYPE A: Day charters with routes/destinations (Coral, Racha, Phi Phi, etc.) — multiple routes, per-boat pricing
- TYPE B: Overnight/multi-day charters (2D/1N, 3D/2N, etc.)
- TYPE C: Multiple boats with same routes (like Tiger Marine, Badaro)
- TYPE D: Boat names listed at top, then SHARED pricing section below
- TYPE E: Per-person pricing with guest ranges (e.g. "50 pax: 3,500 THB/person") — common for large vessels, party boats
- TYPE F: Single vessel with relocation/departure fees (different prices per departure point)

IMPORTANT PRICING & COMMISSION MAPPING:
- GROSS/Selling price = client_price (what end customer pays).
- NET/Agent rate = base_price AND agent_price (what agent pays operator).
- COMMISSION = the difference. 
- NEVER put a gross price into base_price. If only one price is given and it says "commission XX% included", calculate the NET price for base_price and put the original in client_price.
- TYPE E (Per person): Create separate rules in "pricing_rules" for each passenger range.

EXPECTED JSON SCHEMA:
{
  "_reasoning_process": "String: Briefly explain how many boats you found, how you handled commissions, and your pricing extraction logic.",
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
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Parse this charter contract. Extract ONLY what is explicitly written. Output valid JSON only:\n\n' + processedText }
      ],
      temperature: 0.03,
      max_tokens: 8192,
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
          model: 'deepseek-chat',
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
      warnings.push('Contract truncated: ' + text.length.toLocaleString() + ' -> ' + MAX_CONTRACT_LENGTH.toLocaleString() + ' chars. Data at end may be lost.');
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
