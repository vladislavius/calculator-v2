with open('app/api/analyze-contract/route.ts', 'r') as f:
    content = f.read()

# Find the system prompt and update it
old_section = '''3. PRICING TABLE - CRITICAL! Extract EVERY cell:
- Rows: 2D/1N, 3D/2N, 4D/3N, 5D/4N, 6D/5N, 7D/6N, 8D/7N, 9D/8N, 10D/9N (duration_nights: 1,2,3,4,5,6,7,8,9)
- Columns: guests 1-4, 5-6, 7-8 (guests_from/to)
- Sections: Low (May-Oct), High (Nov-Apr), Peak (Dec21-Jan31)
- Total ~81 pricing rules (9 durations × 3 guest ranges × 3 seasons)'''

new_section = '''3. PRICING TABLE - CRITICAL! Detect the contract type and extract accordingly:

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
- duration_nights: 0 for day trips'''

if old_section in content:
    content = content.replace(old_section, new_section)
    print("Updated prompt for route-based contracts!")
else:
    print("Section not found, searching...")
    if "PRICING TABLE" in content:
        print("Found PRICING TABLE section")

with open('app/api/analyze-contract/route.ts', 'w') as f:
    f.write(content)
