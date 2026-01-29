with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add back button style and navigation
old_tabs = '''<button onClick={() => setActiveTab('included')} style={tabStyle(activeTab === 'included')}>✅ Включено</button>'''

new_tabs = '''<button onClick={() => setActiveTab('included')} style={tabStyle(activeTab === 'included')}>✅ Включено</button>'''

# Add navigation buttons at the bottom of tab content area
old_tab_content_end = '''</div>
          </div>
        </div>
      )}'''

new_tab_content_end = '''</div>
            
            {/* Navigation Buttons */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1] as any);
                }}
                disabled={activeTab === 'included'}
                style={{ padding: '12px 24px', backgroundColor: activeTab === 'included' ? '#e5e7eb' : '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: activeTab === 'included' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>
                ← Назад
              </button>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1] as any);
                }}
                disabled={activeTab === 'summary'}
                style={{ padding: '12px 24px', backgroundColor: activeTab === 'summary' ? '#e5e7eb' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: activeTab === 'summary' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>
                Далее →
              </button>
            </div>
          </div>
        </div>
      )}'''

content = content.replace(old_tab_content_end, new_tab_content_end)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Back/Next buttons added!")
