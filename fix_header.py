with open('app/page.tsx', 'r') as f:
    content = f.read()

old_header = """          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            </div>"""

new_header = """          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="/import" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
              📄 Import
            </a>
            <a href="/partners" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
              👥 Партнёры
            </a>
          </div>"""

if old_header in content:
    content = content.replace(old_header, new_header)
    print("Added navigation links to header!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
