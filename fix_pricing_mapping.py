with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix the mapping from AI response - add pricing_rules to routes conversion
old_mapping = '''routes: aiData.routes?.map((r: any) => ({'''

new_mapping = '''routes: (aiData.routes || aiData.pricing_rules)?.map((r: any) => ({
          destination: r.destination || r.duration_label || (r.duration_nights + 1) + 'D/' + r.duration_nights + 'N',
          duration_nights: r.duration_nights || 0,
          guests_from: r.guests_from || 1,
          guests_to: r.guests_to || 10,
          season: r.season || 'high','''

# Actually let's do simpler fix - just map pricing_rules to routes format
old_mapping2 = '''routes: aiData.routes?.map((r: any) => ({
          destination: r.destination || '','''

new_mapping2 = '''routes: (aiData.pricing_rules || aiData.routes || []).map((r: any) => ({
          destination: r.destination || r.duration_label || ((r.duration_nights || 0) + 1) + 'D/' + (r.duration_nights || 0) + 'N','''

if old_mapping2 in content:
    content = content.replace(old_mapping2, new_mapping2)
    print("Fixed pricing_rules to routes mapping!")
elif old_mapping in content:
    content = content.replace(old_mapping, new_mapping)
    print("Fixed with alternative pattern!")
else:
    print("Pattern not found, checking content...")
    # Show what we have
    idx = content.find('routes: aiData')
    if idx > 0:
        print("Found at:", idx)
        print(content[idx:idx+200])

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
