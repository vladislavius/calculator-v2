# Fix 1: Update API prompt
with open('app/api/analyze-contract/route.ts', 'r') as f:
    content = f.read()

# Add charter_type to first pricing rule example
old_rule = '{"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "low", "base_price": 65500}'
new_rule = '{"duration_nights": 1, "guests_from": 1, "guests_to": 4, "season": "low", "base_price": 65500, "charter_type": "overnight"}'
content = content.replace(old_rule, new_rule)

# Update critical rules
old_critical = '''CRITICAL RULES:
- Extract ALL 81 pricing rules (or as many as in the table)
- Remove commas from prices: 65,500 → 65500
- duration_nights: 1=2D/1N, 2=3D/2N, 3=4D/3N...
- season: low=May-Oct, high=Nov-Apr, peak=Dec21-Jan31'''

new_critical = '''CRITICAL RULES:
- Extract ALL 81 pricing rules: 9 durations × 3 guest ranges × 3 seasons
- charter_type: "overnight" for ALL multi-day charters (2D/1N and longer)
- Remove commas from prices: 65,500 → 65500  
- duration_nights: 1=2D/1N, 2=3D/2N, 3=4D/3N, 4=5D/4N, 5=6D/5N, 6=7D/6N, 7=8D/7N, 8=9D/8N, 9=10D/9N
- season: low=May-Oct, high=Nov-Apr, peak=Dec21-Jan31
- Extract EVERY row and EVERY column from the pricing table'''

content = content.replace(old_critical, new_critical)

with open('app/api/analyze-contract/route.ts', 'w') as f:
    f.write(content)
print("Fixed API prompt!")

# Fix 2: Update UI mapping for default charter_type
with open('app/import/page.tsx', 'r') as f:
    ui_content = f.read()

# Set overnight as default when duration_nights > 0
old_mapping = "charter_type: r.charter_type || 'full_day'"
new_mapping = "charter_type: r.charter_type || ((r.duration_nights || 0) > 0 ? 'overnight' : 'full_day')"

if old_mapping in ui_content:
    ui_content = ui_content.replace(old_mapping, new_mapping)
    print("Fixed UI default charter_type!")
else:
    # Search for charter_type mapping
    import re
    match = re.search(r"charter_type:\s*r\.charter_type[^,\n]*", ui_content)
    if match:
        print(f"Found: {match.group()}")
        ui_content = ui_content.replace(match.group(), new_mapping)
        print("Fixed with regex!")
    else:
        print("charter_type mapping not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(ui_content)

print("Done!")
