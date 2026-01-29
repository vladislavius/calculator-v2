with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix column names
content = content.replace('max_guests_day', 'max_pax_day')
content = content.replace('max_guests_overnight', 'max_pax_overnight')

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Fixed boat column names!")
