import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Find summary tab and add boat markup slider
# Look for the summary section marker
old_summary_start = """              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>📋 Итоговый расчёт</h3>"""

new_summary_start = """              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>📋 Итоговый расчёт</h3>
                  
                  {/* Boat Markup Slider */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#92400e' }}>⚙️ Наценка на яхту</span>
                      <span style={{ fontWeight: '700', color: '#d97706', fontSize: '18px' }}>{boatMarkup}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={boatMarkup} 
                      onChange={(e) => setBoatMarkup(Number(e.target.value))}
                      style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#92400e', marginTop: '8px' }}>
                      <span>База партнёра: {selectedBoat?.calculated_total?.toLocaleString() || 0} THB</span>
                      <span>Для клиента: {totals.boatPriceWithMarkup?.toLocaleString() || 0} THB</span>
                    </div>
                  </div>"""

if old_summary_start in content:
    content = content.replace(old_summary_start, new_summary_start)
    print("1. Added boat markup slider to summary")

# 2. Add transfer markup slider if transfer selected
old_transfer_summary = """                        <span>🚗 Трансфер</span>
                            <span>{totals.transfer.toLocaleString()} THB</span>"""

new_transfer_summary = """                        <span>🚗 Трансфер</span>
                            <span>{totals.transfer.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.partnerWatersports > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>🏄 Водные игрушки (партнёры)</span>
                            <span>{totals.partnerWatersports.toLocaleString()} THB"""

if old_transfer_summary in content:
    content = content.replace(old_transfer_summary, new_transfer_summary)
    print("2. Added partner watersports to summary")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nUI Part 4 done!")
