with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix the price display in results (lines 658-666)
old_code = '''<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{boat.calculated_agent_total?.toLocaleString() || boat.base_price.toLocaleString()}</span></p>
                        <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {boat.calculated_total.toLocaleString()} THB</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#f59e0b' }}>
                          Profit: {((boat.calculated_total || 0) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
                        </p>'''

new_code = '''<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{boat.calculated_agent_total?.toLocaleString() || boat.base_price.toLocaleString()}</span></p>
                        <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB</p>
                        {markupPercent > 0 && <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#8b5cf6' }}>+{markupPercent}% markup</p>}
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#f59e0b' }}>
                          Profit: {(Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
                        </p>'''

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Fixed agent view markup!")
else:
    print("Agent view code not found")

# Also fix the non-agent view (line 666)
old_simple = '''{boat.calculated_total.toLocaleString()} THB'''
new_simple = '''{Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB'''

# Be careful - only replace in the results display area, not everywhere
# Let's do a more targeted replacement
lines = content.split('\n')
for i, line in enumerate(lines):
    if i >= 663 and i <= 668 and '{boat.calculated_total.toLocaleString()} THB' in line:
        lines[i] = line.replace('{boat.calculated_total.toLocaleString()} THB', 
                                '{Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB')
        print(f"Fixed line {i+1}")

content = '\n'.join(lines)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
