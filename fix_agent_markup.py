with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix agent view to include markup in client price and profit
old_agent = '''<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{boat.calculated_agent_total?.toLocaleString() || boat.base_price.toLocaleString()}</span></p>
                        <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {boat.calculated_total.toLocaleString()} THB</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed' }}>
                          Profit: {((boat.calculated_total || 0) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
                        </p>'''

new_agent = '''<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{(boat.calculated_agent_total || boat.base_price).toLocaleString()}</span></p>
                        <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB{markupPercent > 0 && <span style={{ fontSize: '11px', color: '#8b5cf6' }}> (+{markupPercent}%)</span>}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed' }}>
                          Profit: {(Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
                        </p>'''

if old_agent in content:
    content = content.replace(old_agent, new_agent)
    print("Fixed agent markup display!")
else:
    print("Pattern not found, checking...")
    # Print what we have around line 658
    lines = content.split('\n')
    for i in range(656, 665):
        print(f"{i+1}: {lines[i][:80]}...")

with open('app/page.tsx', 'w') as f:
    f.write(content)
