with open('app/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with "Итоговый расчёт" and insert markup slider after it
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'Итоговый расчёт</h3>' in line:
        # Insert the markup slider block
        slider_code = '''
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
                      <span style={{ color: '#92400e' }}>База партнёра: <strong>{(selectedBoat?.calculated_total || selectedBoat?.base_price || 0).toLocaleString()} THB</strong></span>
                      <span style={{ color: '#059669' }}>Цена для клиента: <strong>{Math.round((selectedBoat?.calculated_total || selectedBoat?.base_price || 0) * (1 + boatMarkup / 100)).toLocaleString()} THB</strong></span>
                    </div>
                  </div>

'''
        new_lines.append(slider_code)
        print(f"Inserted markup slider after line {i+1}")

with open('app/page.tsx', 'w') as f:
    f.writelines(new_lines)

print("Done!")
