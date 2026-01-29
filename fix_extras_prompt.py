with open('app/api/analyze-contract/route.ts', 'r') as f:
    content = f.read()

# Find and update the system prompt to better parse extras
old_extras = '"optional_extras": [{"name": "item", "price": 500, "price_per": "day"}]'
new_extras = '''"optional_extras": [
    {"name": "Kayak", "price": 500, "price_per": "day"},
    {"name": "SUP", "price": 700, "price_per": "day"},
    {"name": "Transport to Marina", "price": 0, "price_per": "trip"},
    {"name": "Diving", "price": 0, "price_per": "trip"}
  ],
  "included": [
    {"name": "Private use of yacht", "category": "amenities"},
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
    {"name": "Running Cost fuel", "category": "fuel"},
    {"name": "Bluetooth Speakers", "category": "amenities"},
    {"name": "Fins", "category": "equipment"},
    {"name": "Towels and Linen", "category": "amenities"}
  ],
  "not_included": [
    {"name": "Transport from Hotel", "category": "transfer"},
    {"name": "Alcohol", "category": "drinks"},
    {"name": "Soft Drinks", "category": "drinks"},
    {"name": "National Park fee", "category": "fees"},
    {"name": "VAT 7%", "category": "fees"}
  ]'''

if old_extras in content:
    content = content.replace(old_extras, new_extras)
    print("Updated extras examples in prompt!")
else:
    print("Pattern not found, adding detailed instructions...")
    # Add more specific parsing instructions
    old_instruction = 'Extract EVERY price from the pricing table'
    new_instruction = '''Extract EVERY price from the pricing table.
CRITICAL for EXTRAS: Look for sections like "Optional extras", "Not inclusive", "That\\'s inclusive".
- Parse items with prices like "Kayak = 500 THB per day" → {"name": "Kayak", "price": 500, "price_per": "day"}
- Parse items like "SUP = 700 THB per day" → {"name": "SUP", "price": 700, "price_per": "day"}
- Items without price → price: 0
- "per day" → "day", "per hour" → "hour", "per trip" → "trip"'''
    if old_instruction in content:
        content = content.replace(old_instruction, new_instruction)
        print("Added detailed extras parsing instructions!")

with open('app/api/analyze-contract/route.ts', 'w') as f:
    f.write(content)
