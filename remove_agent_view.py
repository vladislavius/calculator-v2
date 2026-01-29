with open('app/page.tsx', 'r') as f:
    content = f.read()

# Remove the Agent View block from header
old_agent_view = """            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px' }}>
              <input type="checkbox" checked={showAgentPrice} onChange={(e) => setShowAgentPrice(e.target.checked)} />
              <span style={{ fontSize: '14px' }}>Agent View</span>
              {showAgentPrice && (
                <>
                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>+</span>
                  <input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    style={{ width: '50px', padding: '4px', borderRadius: '4px', border: 'none', color: '#1f2937' }} min="0" max="100" />
                  <span style={{ fontSize: '12px' }}>%</span>
                </>
              )}
            </div>"""

new_agent_view = ""  # Remove completely

if old_agent_view in content:
    content = content.replace(old_agent_view, new_agent_view)
    print("Removed Agent View from header!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
