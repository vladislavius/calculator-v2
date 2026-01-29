with open('app/page.tsx', 'r') as f:
    content = f.read()

# Replace CATERING_PACKAGES section with boat food options
old_food_section = """                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {CATERING_PACKAGES.map(pkg => (
                      <div key={pkg.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontWeight: '600' }}>{pkg.name}</h4>
                          <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{pkg.price} THB/чел</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>{pkg.nameRu} • мин. {pkg.minPersons} чел</p>
                        <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#9ca3af' }}>{pkg.items.join(', ')}</p>
                        <button onClick={() => addCatering(pkg)} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                          + Добавить
                        </button>
                      </div>
                    ))}
                  </div>"""

new_food_section = """                  {/* Food options from the boat */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#059669' }}>🚤 Питание на яхте</h4>
                    
                    {/* Included food */}
                    {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'included').length > 0 && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontWeight: '600', color: '#059669', marginBottom: '8px', fontSize: '13px' }}>✓ Включено в стоимость:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'included').map(opt => (
                            <span key={opt.id} style={{ padding: '4px 10px', backgroundColor: '#d1fae5', borderRadius: '12px', fontSize: '12px', color: '#065f46' }}>
                              {opt.option_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Paid food options */}
                    {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'paid_optional' && opt.price > 0).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'paid_optional' && opt.price > 0).map(opt => (
                          <div key={opt.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '500', fontSize: '13px' }}>{opt.option_name}</span>
                              <span style={{ fontWeight: '600', color: '#2563eb', fontSize: '13px' }}>{opt.price} THB</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{opt.price_per === 'person' ? 'за человека' : opt.price_per === 'day' ? 'в день' : 'за заказ'}</div>
                            <button 
                              onClick={() => {
                                const exists = selectedExtras.find(e => e.optionId === opt.id);
                                if (!exists) {
                                  setSelectedExtras([...selectedExtras, {
                                    optionId: opt.id,
                                    name: opt.option_name,
                                    nameRu: opt.option_name_ru || opt.option_name,
                                    quantity: 1,
                                    price: opt.price,
                                    pricePer: opt.price_per || 'trip',
                                    category: 'food'
                                  }]);
                                }
                              }}
                              disabled={selectedExtras.some(e => e.optionId === opt.id)}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: selectedExtras.some(e => e.optionId === opt.id) ? '#d1d5db' : '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px', 
                                width: '100%' 
                              }}
                            >
                              {selectedExtras.some(e => e.optionId === opt.id) ? '✓ Добавлено' : '+ Добавить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {boatOptions.filter(opt => opt.category_code === 'food').length === 0 && (
                      <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#6b7280', textAlign: 'center' }}>
                        Информация о питании на яхте не указана
                      </div>
                    )}
                  </div>"""

if old_food_section in content:
    content = content.replace(old_food_section, new_food_section)
    print("Replaced CATERING_PACKAGES with boat food options!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
