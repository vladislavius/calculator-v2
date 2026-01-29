with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix: Add duration_nights when creating route
old_insert = """.insert({
                name: route.destination,
                name_en: route.destination,
                duration_hours: route.duration_hours || 8
              })"""

new_insert = """.insert({
                name: route.destination,
                name_en: route.destination,
                duration_hours: route.duration_hours || 8,
                duration_nights: route.duration_nights || 0
              })"""

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    print("Fixed route insert - added duration_nights!")
else:
    print("Pattern not found, checking...")
    if "duration_hours: route.duration_hours" in content:
        print("Found duration_hours line")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
