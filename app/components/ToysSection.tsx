'use client';
import { useCharterStore } from '../store/useCharterStore';

import { BoatOption, SelectedExtra } from '../lib/types';

interface WatersportsPartner {
  id: number;
  name: string;
  phone?: string;
}

interface WatersportsCatalogItem {
  id: number;
  partner_id: number;
  name_en: string;
  name_ru?: string;
  price_per_hour: number;
  price_per_day: number;
}

interface SelectedPartnerWatersport {
  id: number;
  name: string;
  partnerName: string;
  partnerId: number;
  pricePerHour: number;
  pricePerDay: number;
  hours: number;
  days: number;
}


export default function ToysSection() {
  const {
    boatOptions = [], selectedExtras = [],
    watersportsPartners = [], watersportsCatalog = [],
    selectedPartnerWatersports = [], expandedSections = {},
    customPrices = {},
    set, getPrice, setPrice, toggleSection,
  } = useCharterStore();

  const toggleExtra = (opt: any) => {
    const exists = selectedExtras.find(e => e.id === opt.id);
    if (exists) set({ selectedExtras: selectedExtras.filter(e => e.id !== opt.id) });
    else set({ selectedExtras: [...selectedExtras, { id: opt.id, name: opt.name_en || opt.name, price: opt.price || 0 }] });
  };

  const setSelectedPartnerWatersports = (v: any) => set({ selectedPartnerWatersports: typeof v === 'function' ? v(selectedPartnerWatersports) : v });

  const removePartnerWatersport = (id: number) => {
    set({ selectedPartnerWatersports: selectedPartnerWatersports.filter(w => w.id !== id) });
  };

  const updatePartnerWatersport = (id: number, field: string, value: number) => {
    set({ selectedPartnerWatersports: selectedPartnerWatersports.map(w => w.id === id ? {...w, [field]: value} : w) });
  };
  return (
    <div id="toys" className="os-section">
      <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: 'var(--os-aqua)' }}>🎿 ВОДНЫЕ РАЗВЛЕЧЕНИЯ</h3>
      
      {/* Included water toys */}
      {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: 'var(--os-card)', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.2)' }}>
          <span style={{ fontWeight: '600', color: 'var(--os-green)' }}>Включено: </span>
          {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').map((o, i) => (
            <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>
          ))}
        </div>
      )}

      {/* Paid water toys from boat */}
      {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').length > 0 && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--os-card)', borderRadius: '12px', border: '1px solid var(--os-border)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: '600', color: 'var(--os-aqua)' }}>➕ Добавить с яхты:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').map(opt => {
              const isAdded = selectedExtras.some(e => e.optionId === opt.id);
              return (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? 'var(--os-aqua-glow)' : 'var(--os-surface)', borderRadius: '8px', border: isAdded ? '2px solid #00C9FF' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={isAdded} onChange={() => toggleExtra(opt)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '500' }}>{opt.option_name}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--os-aqua)' }}>
                    +<input
                      type="number"
                      value={getPrice(`opt_${opt.id}`, opt.price || 0)}
                      onChange={(e) => setPrice(`opt_${opt.id}`, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '60px', padding: '2px 4px', border: '1px solid #0891b2', borderRadius: '4px', textAlign: 'right', fontSize: '13px' }}
                    /> THB{opt.price_per === 'hour' ? '/час' : opt.price_per === 'day' ? '/день' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Partner watersports - Collapsible */}
      {watersportsPartners.length > 0 && (
        <div style={{ borderRadius: '12px', border: '1px solid var(--os-border)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleSection('partnerWatersports')}
            style={{ padding: '14px 16px', backgroundColor: 'var(--os-card)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px' }}>{expandedSections.partnerWatersports ? '▼' : '▶'}</span>
              <span style={{ fontWeight: '600', color: 'var(--os-aqua)' }}>🏄 🏄 Водные развлечения от партнёров</span>
              <span style={{ fontSize: '13px', color: 'var(--os-text-3)' }}>({watersportsPartners.length} партнёров)</span>
            </div>
          </div>
          
          {expandedSections.partnerWatersports && (
            <div style={{ padding: '16px', backgroundColor: 'var(--os-card)' }}>
              {watersportsPartners.map(partner => (
                <div key={partner.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--os-card)', borderRadius: '10px', border: '1px solid var(--os-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: '700', color: 'var(--os-aqua)', fontSize: '13px' }}>{partner.name}</span>
                      {partner.phone && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--os-text-3)' }}>📞 {partner.phone}</p>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {watersportsCatalog.filter(w => w.partner_id === partner.id).map(item => {
                      const isAdded = selectedPartnerWatersports.some(w => w.id === item.id);
                      const pw = selectedPartnerWatersports.find(w => w.id === item.id);
                      const basePrice = (item.price_per_hour || 0) > 0 ? item.price_per_hour : item.price_per_day;
                      
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: isAdded ? 'var(--os-aqua-glow)' : 'var(--os-surface)', borderRadius: '8px', border: isAdded ? '2px solid #00C9FF' : '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                              type="checkbox" 
                              checked={isAdded} 
                              onChange={() => {
                                if (isAdded) {
                                  removePartnerWatersport(item.id);
                                } else {
                                  setSelectedPartnerWatersports([...selectedPartnerWatersports, {
                                    id: item.id,
                                    name: item.name_en,
                                    partnerName: partner.name,
                                    partnerId: partner.id,
                                    pricePerHour: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_hour > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_hour || 0),
                                    pricePerDay: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_day > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_day || 0),
                                    hours: (item.price_per_hour || 0) > 0 ? 1 : 0,
                                    days: (item.price_per_hour || 0) > 0 ? 0 : ((item.price_per_day || 0) > 0 ? 1 : 0),
                                  }]);
                                }
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                            />
                            <div>
                              <span style={{ fontWeight: '500', fontSize: '13px', color: 'var(--os-text-1)' }}>{item.name_en}</span>
                              {item.name_ru && <span style={{ marginLeft: '6px', fontSize: '13px', color: 'var(--os-text-3)' }}>({item.name_ru})</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isAdded && pw && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {(item.price_per_hour || 0) > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'hours', Math.max(1, (pw.hours || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid var(--os-aqua)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: '16px', fontWeight: '700', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                    <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '13px' }}>{pw.hours} ч</span>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'hours', (pw.hours || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid var(--os-aqua)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: '16px', fontWeight: '700', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                )}
                                {(item.price_per_day || 0) > 0 && (item.price_per_hour || 0) === 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'days', Math.max(1, (pw.days || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid var(--os-aqua)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: '16px', fontWeight: '700', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                    <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '13px' }}>{pw.days} дн</span>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'days', (pw.days || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid var(--os-aqua)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: '16px', fontWeight: '700', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                )}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                value={getPrice(`ws_${item.id}`, basePrice)}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setPrice(`ws_${item.id}`, val);
                                  if (isAdded) {
                                    const updated = selectedPartnerWatersports.map(w => 
                                      w.id === item.id ? {...w, pricePerHour: (item.price_per_hour || 0) > 0 ? val : 0, pricePerDay: (item.price_per_day || 0) > 0 ? val : 0} : w
                                    );
                                    setSelectedPartnerWatersports(updated);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '80px', padding: '6px 8px', border: '1px solid #0891b2', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--os-text-3)', fontWeight: '600' }}>THB/{(item.price_per_hour || 0) > 0 ? 'час' : 'день'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
