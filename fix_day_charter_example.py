with open('app/api/analyze-contract/route.ts', 'r') as f:
    content = f.read()

# Find the pricing_rules example and add day charter examples
old_example = '''  "pricing_rules": [
    {"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "low", "base_price": 65500, "charter_type": "overnight"},
    {"duration_nights": 1, "guests_from": 5, "guests_to": 6, "season": "low", "base_price": 73900},
    {"duration_nights": 1, "guests_from": 7, "guests_to": 8, "season": "low", "base_price": 82500},
    {"duration_nights": 2, "guests_from": 1, "guests_to": 4, "season": "low", "base_price": 109500},
    {"duration_nights": 2, "guests_from": 5, "guests_to": 6, "season": "low", "base_price": 123500},
    {"duration_nights": 2, "guests_from": 7, "guests_to": 8, "season": "low", "base_price": 137500},
    {"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "high", "base_price": 73900},
    {"duration_nights": 1, "guests_from": 5, "guests_to": 6, "season": "high", "base_price": 82500},
    {"duration_nights": 1, "guests_from": 7, "guests_to": 8, "season": "high", "base_price": 88500},'''

new_example = '''  "pricing_rules": [
    // FOR DAY CHARTERS (routes with destinations):
    {"destination": "Racha Yai + Coral + Promthep", "charter_type": "full_day", "season": "nov_dec", "base_price": 35615, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "Racha Yai + Coral + Promthep", "charter_type": "full_day", "season": "dec_feb", "base_price": 39865, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "PP Island", "charter_type": "full_day", "season": "nov_dec", "base_price": 38165, "extra_pax_price": 1275, "duration_nights": 0},
    {"destination": "Mai Ton + Coral", "charter_type": "half_day", "season": "nov_dec", "base_price": 30532, "extra_pax_price": 1020, "duration_nights": 0},
    // FOR OVERNIGHT CHARTERS (multi-day):
    {"destination": "2D/1N", "charter_type": "overnight", "season": "low", "base_price": 65500, "guests_from": 1, "guests_to": 4, "duration_nights": 1},
    {"destination": "3D/2N", "charter_type": "overnight", "season": "low", "base_price": 109500, "guests_from": 1, "guests_to": 4, "duration_nights": 2},'''

if old_example in content:
    content = content.replace(old_example, new_example)
    print("Added day charter examples!")
else:
    print("Pattern not found, trying simpler approach...")
    # Try to find just the first pricing rule
    old_simple = '{"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "low", "base_price": 65500, "charter_type": "overnight"}'
    new_simple = '{"destination": "Racha Yai + Coral", "charter_type": "full_day", "season": "high", "base_price": 35615, "extra_pax_price": 1275, "duration_nights": 0}'
    if old_simple in content:
        # Add day charter example before overnight
        content = content.replace(
            '"pricing_rules": [',
            '"pricing_rules": [\n    // DAY CHARTER example:\n    ' + new_simple + ',\n    // OVERNIGHT example:'
        )
        print("Added day charter example (simple)!")
    else:
        print("Could not find pattern")

with open('app/api/analyze-contract/route.ts', 'w') as f:
    f.write(content)
