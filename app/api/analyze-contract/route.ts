import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    console.log('Received text length:', text?.length);
    
    const systemPrompt = `Parse boat charter contract COMPLETELY. Return ONLY valid JSON.

EXTRACT EVERYTHING:

1. COMPANY: name, address, tax ID, license, ALL phone numbers with contact names and languages

2. BOAT SPECS: name, model, type, length (m/ft), beam, draft, year, cabins, beds (double/bunk), toilets, showers, max guests (day/overnight), crew count, engines, fuel capacity, water capacity, speed (cruise/max), range, generator, AC, sails info, dinghy info, departure pier, schedule

3. PRICING TABLE - CRITICAL! Detect the contract type and extract accordingly:

TYPE A - OVERNIGHT CHARTERS (multi-day):
- Rows: 2D/1N, 3D/2N, etc. → duration_nights: 1, 2, 3...
- Columns: guest ranges (1-4, 5-6, 7-8)
- charter_type: "overnight"

TYPE B - DAY CHARTERS (routes/destinations):
- Rows: Route names (Racha Yai, PP Island, Phang Nga Bay, etc.)
- Columns: seasons by months (Nov-Dec, Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct)
- Time slots: Full Day (9:00-17:00) or Half Day
- charter_type: "full_day" or "half_day"
- Extract: route_name, base_price (Agent price), extra_pax_price

For TYPE B contracts, pricing_rules should be:
- destination: route name (e.g., "Racha Yai + Coral + Promthep")
- charter_type: "full_day" or "half_day"
- season: map months to season codes (nov_dec, dec_feb, mar_apr, may_jun, jul_aug, sep_oct OR low/high/peak)
- base_price: Agent price
- extra_pax_price: Extra Guest price
- duration_nights: 0 for day trips

4. INCLUDED: all items with categories (crew/meals/drinks/equipment/amenities/fuel)

5. NOT INCLUDED: all items

6. OPTIONAL EXTRAS: with prices and units

JSON FORMAT:
{
  "partner_name": "Bohemian Marine Co.,LTD",
  "partner_address": "159 Chalorm Prakiat M.9 Soi 7 T.Chalong A.Muang Phuket 83130",
  "tax_id": "0835553010333",
  "license": "34/01070",
  "contacts": [
    {"name": "Namphueng", "phone": "080-169-0127", "languages": ["Thai"]},
    {"name": "Markus", "phone": "081-606-3143", "languages": ["English", "German"]}
  ],
  "boats": [{
    "name": "LAGOON 440 CALYPSO",
    "model": "Lagoon 440",
    "type": "sailing_catamaran",
    "length_m": 13.67,
    "beam_m": 7.70,
    "draft_m": 1.3,
    "cabins": 4,
    "beds_double": 4,
    "beds_bunk": 2,
    "toilets": 4,
    "showers": 5,
    "max_pax_overnight": 8,
    "engines": "2 x 54 HP",
    "fuel_capacity_l": 700,
    "water_capacity_l": 900,
    "speed_cruise_knots": 7,
    "speed_max_knots": 10,
    "cruising_range_nm": 500,
    "sails": "Rolling Genoa, Main Sail",
    "dinghy": "Yamaha 9.9 HP, Highfield 3.4m Hypalon",
    "departure_pier": "Chalong",
    "schedule": "Starting 10am back 17:00 last day"
  }],
  "pricing_rules": [
    // FOR DAY CHARTERS (routes with destinations):
    {"destination": "Racha Yai + Coral + Promthep", "charter_type": "full_day", "season": "nov_dec", "base_price": 35615, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "Racha Yai + Coral + Promthep", "charter_type": "full_day", "season": "dec_feb", "base_price": 39865, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "PP Island", "charter_type": "full_day", "season": "nov_dec", "base_price": 38165, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "Mai Ton + Coral", "charter_type": "half_day", "season": "nov_dec", "base_price": 30532, "extra_pax_price": 1020, "duration_nights": 0},
    // FOR OVERNIGHT CHARTERS (multi-day):
    {"destination": "2D/1N", "charter_type": "overnight", "season": "low", "base_price": 65500, "guests_from": 1, "guests_to": 4, "duration_nights": 1},
    {"destination": "3D/2N", "charter_type": "overnight", "season": "low", "base_price": 109500, "guests_from": 1, "guests_to": 4, "duration_nights": 2},
    {"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "peak", "base_price": 82500},
    {"duration_nights": 1, "guests_from": 5, "guests_to": 6, "season": "peak", "base_price": 88500},
    {"duration_nights": 1, "guests_from": 7, "guests_to": 8, "season": "peak", "base_price": 93900}
  ],
  "included": [
    {"name": "Private use of Yacht", "category": "service"},
    {"name": "Captain", "category": "crew"},
    {"name": "Chef", "category": "crew"},
    {"name": "Deck Hand", "category": "crew"},
    {"name": "Breakfast", "category": "meals"},
    {"name": "Lunch", "category": "meals"},
    {"name": "Dinner", "category": "meals"},
    {"name": "Fruits & Snacks", "category": "meals"},
    {"name": "Water", "category": "drinks"},
    {"name": "Coffee & Tea", "category": "drinks"},
    {"name": "Ice", "category": "drinks"},
    {"name": "Fishing Gear", "category": "equipment"},
    {"name": "Snorkeling equipment", "category": "equipment"},
    {"name": "Bluetooth Speakers", "category": "equipment"},
    {"name": "Fins", "category": "equipment"},
    {"name": "Towels", "category": "amenities"},
    {"name": "Linen", "category": "amenities"},
    {"name": "Fuel", "category": "operations"}
  ],
  "not_included": [
    {"name": "Transport from Hotel", "category": "transport"},
    {"name": "Alcohol", "category": "drinks"},
    {"name": "Soft Drinks", "category": "drinks"},
    {"name": "National Park fee", "category": "fees"},
    {"name": "VAT 7%", "category": "taxes"}
  ],
  "optional_extras": [
    {"name": "Kayak", "price": 500, "price_per": "day"},
    {"name": "SUP Board", "price": 700, "price_per": "day"},
    {"name": "Transport to Marina", "price": 0, "price_per": "trip"},
    {"name": "Diving", "price": 0, "price_per": "person"}
  ]
}

CRITICAL RULES:
- Extract ALL 81 pricing rules: 9 durations × 3 guest ranges × 3 seasons
- charter_type: "overnight" for ALL multi-day charters (2D/1N and longer)
- Remove commas from prices: 65,500 → 65500  
- duration_nights: 1=2D/1N, 2=3D/2N, 3=4D/3N, 4=5D/4N, 5=6D/5N, 6=7D/6N, 7=8D/7N, 8=9D/8N, 9=10D/9N
- season - TWO FORMATS supported:
      a) Standard seasons: "low" (May-Oct), "high" (Nov-Apr), "peak" (Dec21-Jan31)
      b) Monthly seasons: "nov_dec" (Nov 1 - Dec 19), "dec_feb" (Dec 20 - Feb), "mar_apr" (Mar - Apr), "may_jun" (May - Jun), "jul_aug" (Jul - Aug), "sep_oct" (Sep - Oct)
      Use monthly format if contract shows prices by month ranges
- Extract EVERY row and EVERY column from the pricing table`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text.substring(0, 15000) }
      ],
      temperature: 0.1,
      max_tokens: 16000,
    });
    
    let content = response.choices[0].message.content || '{}';
    console.log('AI response length:', content.length);
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const data = JSON.parse(content);
    console.log('Parsed - boats:', data.boats?.length, 'pricing_rules:', data.pricing_rules?.length, 'contacts:', data.contacts?.length);
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

