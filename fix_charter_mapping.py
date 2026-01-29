with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Find and fix the route mapping
old_mapping = '''routes: (aiData.routes || aiData.pricing_rules)?.map((r: any) => ({
          destination: r.destination || r.duration_label || (r.duration_nights + 1) + 'D/' + r.duration_nights + 'N',
          duration_nights: r.duration_nights || 0,
          guests_from: r.guests_from || 1,
          guests_to: r.guests_to || 10,
          season: r.season || 'high','''

new_mapping = '''routes: (aiData.routes || aiData.pricing_rules)?.map((r: any) => ({
          destination: r.destination || r.duration_label || ((r.duration_nights || 0) + 1) + 'D/' + (r.duration_nights || 0) + 'N',
          duration_nights: r.duration_nights || 0,
          guests_from: r.guests_from || 1,
          guests_to: r.guests_to || 10,
          season: r.season || 'high',
          charter_type: r.charter_type || ((r.duration_nights || 0) > 0 ? 'overnight' : 'full_day'),'''

if old_mapping in content:
    content = content.replace(old_mapping, new_mapping)
    print("Fixed charter_type mapping!")
else:
    print("Pattern not found, trying alternative...")
    # Try simpler replacement
    old_simple = "season: r.season || 'high',"
    new_simple = "season: r.season || 'high',\n          charter_type: r.charter_type || ((r.duration_nights || 0) > 0 ? 'overnight' : 'full_day'),"
    if old_simple in content:
        content = content.replace(old_simple, new_simple, 1)  # Replace only first occurrence
        print("Fixed with simple pattern!")
    else:
        print("Could not find pattern")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
