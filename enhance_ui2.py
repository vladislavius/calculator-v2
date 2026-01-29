import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Find water toys section and add partners section after it
# Look for the end of WATER_TOYS section
old_toys_section = """                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {WATER_TOYS.filter(t => t.price > 0).map(toy => ("""

# Find where water toys ends and add partner watersports
old_toys_end_pattern = r'(\{WATER_TOYS\.filter\(t => t\.price > 0\)\.map\(toy =>[\s\S]*?</div>\s*\)\)\}\s*</div>)'

# Add watersports partners section - we'll insert it after finding the toys section
# Let's find a marker to add after

# Look for the transfer section which comes after water toys
old_transfer_start = """              {/* TRANSFER TAB */}
              {activeTab === 'transfer' && ("""

new_watersports_and_transfer = """              {/* WATERSPORTS PARTNERS */}
              {activeTab === 'toys' && watersportsPartners.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0891b2' }}>🏄 Водные игрушки от партнёров</h4>
                  
                  {/* Selected partner watersports */}
                  {selectedPartnerWatersports.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfeff', borderRadius: '8px', border: '1px solid #a5f3fc' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600' }}>Выбрано:</h5>
                      {selectedPartnerWatersports.map(w => {
                        const basePrice = (w.pricePerHour * w.hours) + (w.pricePerDay * w.days);
                        const finalPrice = Math.round(basePrice * (1 + w.markup / 100));
                        return (
                          <div key={w.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '6px', backgroundColor: 'white', borderRadius: '6px' }}>
                            <span style={{ fontWeight: '500', flex: '1' }}>{w.name} ({w.partnerName})</span>
                            {w.pricePerHour > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" min="0" value={w.hours} onChange={(e) => updatePartnerWatersport(w.id, 'hours', Number(e.target.value))} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                                <span style={{ fontSize: '11px' }}>час</span>
                              </div>
                            )}
                            {w.pricePerDay > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" min="0" value={w.days} onChange={(e) => updatePartnerWatersport(w.id, 'days', Number(e.target.value))} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                                <span style={{ fontSize: '11px' }}>дн</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px' }}>Наценка:</span>
                              <input type="number" min="0" max="100" value={w.markup} onChange={(e) => updatePartnerWatersport(w.id, 'markup', Number(e.target.value))} style={{ width: '45px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                              <span style={{ fontSize: '11px' }}>%</span>
                            </div>
                            <span style={{ fontWeight: '600', color: '#0891b2' }}>{finalPrice.toLocaleString()} THB</span>
                            <button onClick={() => removePartnerWatersport(w.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {watersportsPartners.map(partner => (
                    <div key={partner.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f0fdfa' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#0891b2' }}>{partner.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {watersportsCatalog.filter(w => w.partner_id === partner.id).map(item => (
                          <div key={item.id} style={{ padding: '8px', border: '1px solid #99f6e4', borderRadius: '6px', backgroundColor: 'white' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.name_en}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.price_per_hour > 0 && `${item.price_per_hour} THB/час`}
                              {item.price_per_hour > 0 && item.price_per_day > 0 && ' • '}
                              {item.price_per_day > 0 && `${item.price_per_day} THB/день`}
                            </div>
                            <button 
                              onClick={() => addPartnerWatersport(item, partner)} 
                              disabled={selectedPartnerWatersports.some(w => w.id === item.id)}
                              style={{ marginTop: '6px', padding: '4px 10px', backgroundColor: selectedPartnerWatersports.some(w => w.id === item.id) ? '#d1d5db' : '#0891b2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                            >
                              {selectedPartnerWatersports.some(w => w.id === item.id) ? 'Добавлено' : '+ Добавить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRANSFER TAB */}
              {activeTab === 'transfer' && ("""

if old_transfer_start in content:
    content = content.replace(old_transfer_start, new_watersports_and_transfer)
    print("1. Added watersports partners section")

# 2. Update transfer to show round-trip option with markup
old_transfer_display = """                    {TRANSFER_OPTIONS.filter(t => t.type !== 'none').map(opt => (
                      <button key={opt.type}
                        onClick={() => setTransferType(opt.type as any)}
                        style={{
                          padding: '16px',
                          border: transferType === opt.type ? '2px solid #2563eb' : '1px solid #d1d5db',
                          borderRadius: '8px',
                          backgroundColor: transferType === opt.type ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{opt.name}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>до {opt.maxPax} чел</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', marginTop: '8px' }}>{opt.price.toLocaleString()} THB</div>
                      </button>
                    ))}"""

new_transfer_display = """                    {/* Transfer from DB */}
                    {transferOptionsDB.length > 0 ? (
                      <div>
                        {transferOptionsDB.map(opt => (
                          <div key={opt.id} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{opt.name_en}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{opt.vehicle_type} • до {opt.max_passengers} чел • {opt.area}</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => { setTransferType('db_oneway_' + opt.id as any); setTransferPrice(opt.price_one_way); }}
                                style={{ padding: '8px 12px', border: transferType === 'db_oneway_' + opt.id ? '2px solid #2563eb' : '1px solid #d1d5db', borderRadius: '6px', backgroundColor: transferType === 'db_oneway_' + opt.id ? '#eff6ff' : 'white', cursor: 'pointer' }}>
                                В одну сторону: <strong>{Number(opt.price_one_way).toLocaleString()} THB</strong>
                              </button>
                              <button 
                                onClick={() => { setTransferType('db_roundtrip_' + opt.id as any); setTransferPrice(opt.price_round_trip); }}
                                style={{ padding: '8px 12px', border: transferType === 'db_roundtrip_' + opt.id ? '2px solid #10b981' : '1px solid #d1d5db', borderRadius: '6px', backgroundColor: transferType === 'db_roundtrip_' + opt.id ? '#ecfdf5' : 'white', cursor: 'pointer' }}>
                                Туда-обратно: <strong style={{ color: '#10b981' }}>{Number(opt.price_round_trip).toLocaleString()} THB</strong>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback to mock data */
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {TRANSFER_OPTIONS.filter(t => t.type !== 'none').map(opt => (
                          <button key={opt.type}
                            onClick={() => setTransferType(opt.type as any)}
                            style={{
                              padding: '16px',
                              border: transferType === opt.type ? '2px solid #2563eb' : '1px solid #d1d5db',
                              borderRadius: '8px',
                              backgroundColor: transferType === opt.type ? '#eff6ff' : 'white',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{opt.name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>до {opt.maxPax} чел</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', marginTop: '8px' }}>{opt.price.toLocaleString()} THB</div>
                          </button>
                        ))}
                      </div>
                    )}"""

if old_transfer_display in content:
    content = content.replace(old_transfer_display, new_transfer_display)
    print("2. Updated transfer with DB options and round-trip")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nUI Part 2 done!")
