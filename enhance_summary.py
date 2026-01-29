import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add boat markup slider right after the summary title
old_summary = """              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>📋 Итоговый расчёт</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>"""

new_summary = """              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>📋 Итоговый расчёт</h3>

                  {/* Boat Markup Slider */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#92400e', fontSize: '15px' }}>⚙️ Наценка на яхту</span>
                      <span style={{ fontWeight: '700', color: '#d97706', fontSize: '24px' }}>{boatMarkup}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={boatMarkup} 
                      onChange={(e) => setBoatMarkup(Number(e.target.value))}
                      style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: '#f59e0b' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '10px' }}>
                      <span style={{ color: '#92400e' }}>База партнёра: <strong>{selectedBoat?.calculated_total?.toLocaleString() || selectedBoat?.base_price?.toLocaleString() || 0} THB</strong></span>
                      <span style={{ color: '#059669' }}>Цена для клиента: <strong>{(totals.boatPriceWithMarkup || Math.round((selectedBoat?.calculated_total || selectedBoat?.base_price || 0) * (1 + boatMarkup / 100))).toLocaleString()} THB</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>"""

if old_summary in content:
    content = content.replace(old_summary, new_summary)
    print("1. Added boat markup slider to summary!")
else:
    print("Pattern not found for summary")

# Also add partner watersports to the breakdown
old_toys_line = """                        {totals.toys > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🏄 Водные игрушки</span>
                            <span>{totals.toys.toLocaleString()} THB</span>
                          </div>
                        )}"""

new_toys_line = """                        {totals.toys > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🏄 Водные игрушки (яхта)</span>
                            <span>{totals.toys.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.partnerWatersports > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🏄 Водные игрушки (партнёры)</span>
                            <span>{totals.partnerWatersports.toLocaleString()} THB</span>
                          </div>
                        )}"""

if old_toys_line in content:
    content = content.replace(old_toys_line, new_toys_line)
    print("2. Added partner watersports to breakdown!")
else:
    print("Pattern not found for toys line")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nSummary enhancement done!")
