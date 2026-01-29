with open('app/page.tsx', 'r') as f:
    content = f.read()

# Find the route selection step and add included options display
old_step2 = """<div style={{ marginTop: '20px' }}>
              <button style={styles.button(false)} onClick={() => setStep(1)}>
                ← Назад к яхтам
              </button>
            </div>
          </div>
        )}"""

new_step2 = """<div style={{ marginTop: '20px' }}>
              <button style={styles.button(false)} onClick={() => setStep(1)}>
                ← Назад к яхтам
              </button>
            </div>
            
            {/* Included Options */}
            {includedOptions.length > 0 && (
              <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#10b981' }}>✓ Включено в стоимость</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {includedOptions.map((opt: any) => (
                    <span key={opt.id} style={{ 
                      background: 'rgba(16,185,129,0.2)', 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.9)'
                    }}>
                      {opt.option?.name_en || opt.option?.name_ru}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}"""

if old_step2 in content:
    content = content.replace(old_step2, new_step2)
    print("Added included options display!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
