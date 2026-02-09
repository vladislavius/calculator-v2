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

    const systemPrompt = `You are a strict boat charter contract parser. 

CRITICAL RULES:
1. Extract ONLY information explicitly written in the contract
2. DO NOT invent, assume, or add ANY data not present
3. If information is missing, use null or empty array
4. Copy text EXACTLY as written for names and descriptions

DETECT CONTRACT TYPE:
- TYPE A: Day charters with routes/destinations (Coral, Racha, Phi Phi, etc.)
- TYPE B: Overnight/multi-day charters (2D/1N, 3D/2N, etc.)
- TYPE C: Multiple boats with same routes (like Tiger Marine, Badaro)

EXTRACT STRUCTURE:

1. PARTNER (company info):
{
  "name": "exact company name from contract",
  "address": "if provided",
  "tax_id": "if provided",
  "license": "if provided", 
  "phones": [{"number": "xxx", "contact_name": "if provided", "languages": ["if provided"]}],
  "emails": ["if provided"],
  "validity": "contract validity period in format YYYY-MM-DD - YYYY-MM-DD if mentioned, e.g. 2025-01-01 - 2025-12-31. If no dates found, return empty string"
}

2. BOATS - for EACH boat mentioned, INCLUDING ITS ROUTES:
{
  "name": "exact boat name",
  "model": "model if mentioned",
  "year_built": "year the boat was built if mentioned, e.g. 2020. Return number or null",
  "type": "catamaran/yacht/speedboat/sailing - from context",
  "length_ft": number or null,
  "cabins": number or null,
  "toilets": number or null,
  "showers": number or null,
  "max_pax_day": number - from "up to X people/pax",
  "max_pax_overnight": number or null - for overnight charters (e.g. "OVER NIGHT 2 Pax" = 2),
  "base_pax": number - passengers INCLUDED in base price (e.g. "PRICE BASED ON 12 PASSENGERS" = 12),
  "extra_pax_price": number - price per ADDITIONAL person above base_pax (e.g. "Additional 2,500 THB/Person" = 2500),
  "crew_count": number or null,
  "departure_pier": "if mentioned",
  "routes": [
    {
      "destination": "ONLY the destination/islands names (e.g. 'KHAI, NAKA NOI' not 'HALF DAY KHAI, NAKA NOI')",
      "duration_hours": number of hours (4 for half-day, 8 for full-day, 24 for overnight, etc),
      "duration_nights": number of nights (0 for day trips, 1 for overnight, 2 for 3D/2N, etc),
      "base_price": exact price from contract,
      "agent_price": same as base_price,
      "fuel_surcharge": extra fuel cost if mentioned,
      "season": "all" if one price, or "low"/"high"/"peak"
    }
  ]

IMPORTANT for route names:
- Extract ONLY destination names: "KHAI, NAKA NOI" or "PHI PHI ISLANDS"
- Do NOT include duration in name: NOT "HALF DAY KHAI" or "FULL DAY PHI PHI"
- Duration goes in duration_hours/duration_nights fields
}

CRITICAL: Each boat has its OWN routes array! 
- If contract lists routes under a specific boat -> put routes in that boat
- If contract has shared routes for all boats -> copy routes to each boat with appropriate prices
- Price for route is specific to that boat!

3. ROUTES/PROGRAMS - THIS IS CRITICAL! Extract EVERY route from PROGRAM section:

Look for sections like "PROGRAM", "ROUTES", "ITINERARY", "DESTINATIONS"
Each numbered item (1., 2., 3.) is a SEPARATE route!

Example from contract:
"Half-day Morning Round: 09:00-13:00
1. Coral + Snorkeling + fishing + Laem Panwa
2. Koh Kai + Snorkeling + fishing + Laem Panwa"

Should produce 2 routes:
[
  {"name": "Coral + Snorkeling + fishing + Laem Panwa", "charter_type": "morning", "time_slot": "09:00-13:00"},
  {"name": "Koh Kai + Snorkeling + fishing + Laem Panwa", "charter_type": "morning", "time_slot": "09:00-13:00"}
]

Route structure:
{
  "name": "EXACT route text - copy word for word including '+' signs",
  "charter_type": "morning" (09:00-13:00) / "afternoon" (14:00-18:00) / "full_day" (8+ hours),
  "duration_hours": 4 for half-day, 8 for full-day,
  "time_slot": "09:00-13:00" or "14:00-18:00" - exact times if mentioned,
  "fuel_surcharge": number if route has extra cost (e.g. "+2000 THB"),
  "destinations": ["Coral", "Koh Kai"] - split by '+' for reference
}

IMPORTANT: 
- Morning routes and Afternoon routes with SAME destinations are DIFFERENT routes
- "Coral + Snorkeling + Laem Panwa" morning ≠ "Coral + Snorkeling + Sunset Laem Panwa" afternoon
- Copy the FULL route name exactly as written

4. PRICING RULES - extract EVERY price combination:

IMPORTANT: Create separate pricing rules for:
- Each time slot (morning, afternoon, full_day)
- Each season (low, high, peak, special holidays)
- Each guest range if different prices

CRITICAL FOR SEASONS:
- ALWAYS create both "low" and "high" season entries with base prices
- If contract mentions holidays (Chinese New Year, Labor Day, etc.) - create ADDITIONAL entries for those
- "high" season should have the HIGHER prices (used during peak months)
- "low" season should have the LOWER prices (used during off-peak months)
- Holiday seasons (chinese_new_year, labor_day, etc.) typically have SAME prices as "high"

For day charters:
{
  "boat_name": "which boat this price is for",
  "charter_type": "morning/afternoon/full_day/half_day/sunset",
  "season": "low" or "high" or "peak" or "chinese_new_year" or "labor_day" etc,
  "season_dates": "exact dates if specified, e.g. 28/9/25-07/10/25",
  "season_months": "which months, e.g. Mar-Jun, Sep-Nov for low season",
  "guests_from": 1,
  "guests_to": 6,
  "base_price": exact number from contract,
  "extra_pax_price": number if mentioned (e.g. "Extra 600/Pax" = 600),
  "duration_hours": 4 for morning/afternoon, 8 for full_day,
  "time_slot": "09:00-13:00" or "14:00-18:00" etc if specified
}

For overnight charters:
{
  "boat_name": "boat name",
  "charter_type": "overnight",
  "duration_nights": 1 for 2D/1N, 2 for 3D/2N, etc,
  "season": "low/high/peak",
  "guests_from": 1,
  "guests_to": 4,
  "base_price": exact number
}

5. INCLUDED - ONLY items explicitly listed under "Included/Inclusive/Price includes":
{
  "name": "exact item name as written",
  "category": "crew/meals/drinks/equipment/amenities/transport/insurance"
}

6. NOT INCLUDED - ONLY items explicitly listed:
{
  "name": "exact item name",
  "note": "additional info like price if mentioned"
}

7. OPTIONAL EXTRAS - items with separate prices:
{
  "name": "exact item name",
  "price": number,
  "price_per": "day/hour/person/trip/piece/can/bottle",
  "note": "any additional info"
}

8. SPECIAL NOTES - important conditions:
- Season definitions (which months = low/high/peak)
- Free items per season
- Children pricing rules
- Fuel surcharge rules
- Commission info

RETURN JSON:
{
  "partner": {...},
  "boats": [
    {
      "name": "...",
      "routes": [...]  // Routes are INSIDE each boat now!
    }
  ],
  "pricing_rules": [...],
  "included": [...],
  "not_included": [...],
  "optional_extras": [...],
  "notes": [...],
  "children_policy": "if mentioned",
  "commission_info": "if mentioned"
}

IMPORTANT EXAMPLES:

For "Welcome Drink / Champagne/ Soft Drink" -> extract as 3 separate items:
- {"name": "Welcome Drink", "category": "drinks"}
- {"name": "Champagne", "category": "drinks"}  
- {"name": "Soft Drink", "category": "drinks"}

For "Captain & Crews" -> extract as:
- {"name": "Captain & Crews", "category": "crew"}

For pricing like "Morning: 1-6 Pax = 8,000 bath" extract:
- {"charter_type": "morning", "guests_from": 1, "guests_to": 6, "base_price": 8000}

DO NOT ADD items like "Life Jackets", "Insurance", "Captain" unless EXPLICITLY listed!`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this charter contract. Extract ONLY what is explicitly written:\n\n${text.substring(0, 25000)}` }
      ],
      temperature: 0.05,
      max_tokens: 8000,
    });

    let content = response.choices[0].message.content || '{}';
    console.log('Raw AI response length:', content.length);
    console.log('Raw AI response first 500:', content.substring(0, 500));
    console.log('Raw AI response last 500:', content.substring(content.length - 500));
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Robust JSON fixer for AI responses
    const fixJson = (str: string): any => {
      // Try direct parse
      try { return JSON.parse(str); } catch (e: any) { console.log('Direct parse failed:', e.message); }

      let fixed = str;
      
      // Remove trailing commas
      fixed = fixed.replace(/,\s*([}\]])/g, '$1');
      try { return JSON.parse(fixed); } catch {}
      
      // Fix single quotes to double quotes in keys
      fixed = fixed.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
      try { return JSON.parse(fixed); } catch {}
      
      // Fix unescaped newlines inside strings
      fixed = fixed.replace(/(?<=": ")(.*?)(?="[,}\]])/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      try { return JSON.parse(fixed); } catch {}
      
      // Truncate to last complete object/array
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
        try { return JSON.parse(truncated); } catch {}
        
        // Try removing last incomplete property
        const lastComma = truncated.lastIndexOf(',');
        if (lastComma > 0) {
          let chopped = truncated.substring(0, lastComma);
          const ob2 = (chopped.match(/{/g) || []).length;
          const cb2 = (chopped.match(/}/g) || []).length;
          chopped += '}'.repeat(Math.max(0, ob2 - cb2));
          try { return JSON.parse(chopped); } catch {}
        }
      }
      
      // Extract first JSON object
      const match = str.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
        let ext = match[0].replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(ext); } catch {}
      }
      
      console.log('All JSON fix attempts failed. Content sample:', str.substring(0, 1000));
      throw new Error('Failed to parse AI response as JSON');
    };

    const data = fixJson(content)

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
