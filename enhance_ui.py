import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Update catering orders display to allow changing persons count
old_catering_display = """                      {cateringOrders.map((order, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fcd34d' }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>{order.packageName}</span>
                            <span style={{ marginLeft: '8px', color: '#92400e' }}>× {order.persons} чел</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '600' }}>{(order.pricePerPerson * order.persons).toLocaleString()} THB</span>
                            <button onClick={() => removeCatering(i)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ))}"""

new_catering_display = """                      {cateringOrders.map((order, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fcd34d' }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>{order.packageName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateCateringPersons(i, order.persons - 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d97706', background: '#fef3c7', cursor: 'pointer' }}>-</button>
                            <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '500' }}>{order.persons} чел</span>
                            <button onClick={() => updateCateringPersons(i, order.persons + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d97706', background: '#fef3c7', cursor: 'pointer' }}>+</button>
                            <span style={{ fontWeight: '600', marginLeft: '10px', minWidth: '80px' }}>{(order.pricePerPerson * order.persons).toLocaleString()} THB</span>
                            <button onClick={() => removeCatering(i)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                          </div>
                        </div>
                      ))}"""

if old_catering_display in content:
    content = content.replace(old_catering_display, new_catering_display)
    print("1. Updated catering display with +/- buttons")

# 2. Add catering partners section after CATERING_PACKAGES display
old_catering_end = """                  {/* Dietary Requirements */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={labelStyle}>🥗 Особые пожелания по еде</label>"""

new_catering_end = """                  {/* Catering Partners from DB */}
                  {cateringPartners.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#7c3aed' }}>🍽️ Кейтеринг от партнёров</h4>
                      {cateringPartners.map(partner => (
                        <div key={partner.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#faf5ff' }}>
                          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#7c3aed' }}>{partner.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>{partner.description}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {cateringMenu.filter(m => m.partner_id === partner.id).map(item => (
                              <div key={item.id} style={{ padding: '8px', border: '1px solid #ddd6fe', borderRadius: '6px', backgroundColor: 'white' }}>
                                <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.name_en}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.name_ru} • мин. {item.min_persons} чел</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                  <span style={{ fontWeight: '600', color: '#7c3aed' }}>{item.price_per_person} THB/чел</span>
                                  <button onClick={() => addCateringFromDB(item, partner)} style={{ padding: '4px 10px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ Добавить</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dietary Requirements */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={labelStyle}>🥗 Особые пожелания по еде</label>"""

if old_catering_end in content:
    content = content.replace(old_catering_end, new_catering_end)
    print("2. Added catering partners section")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nUI Part 1 done!")
