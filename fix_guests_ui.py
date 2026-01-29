with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Replace single base_pax field with guests_from and guests_to
old_field = '''<div><label style={labelStyle}>Базовых гостей</label><input type="number" value={route.base_pax || ''} onChange={(e) => updateRoute(ri, 'base_pax', Number(e.target.value))} style={inputStyle} /></div>'''

new_fields = '''<div><label style={labelStyle}>Гостей от</label><input type="number" value={route.guests_from || ''} onChange={(e) => updateRoute(ri, 'guests_from', Number(e.target.value))} style={{...inputStyle, width: '70px'}} /></div>
                        <div><label style={labelStyle}>Гостей до</label><input type="number" value={route.guests_to || ''} onChange={(e) => updateRoute(ri, 'guests_to', Number(e.target.value))} style={{...inputStyle, width: '70px'}} /></div>'''

if old_field in content:
    content = content.replace(old_field, new_fields)
    print("Fixed guests fields in UI!")
else:
    print("Pattern not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
