'use client';

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

interface ToysSectionProps {
  boatOptions: BoatOption[];
  selectedExtras: SelectedExtra[];
  toggleExtra: (opt: BoatOption) => void;
  watersportsPartners: WatersportsPartner[];
  watersportsCatalog: WatersportsCatalogItem[];
  selectedPartnerWatersports: SelectedPartnerWatersport[];
  setSelectedPartnerWatersports: (items: SelectedPartnerWatersport[]) => void;
  removePartnerWatersport: (id: number) => void;
  updatePartnerWatersport: (id: number, field: string, value: number) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  customPrices: Record<string, number>;
  getPrice: (key: string, defaultPrice: number) => number;
  setPrice: (key: string, value: number) => void;
}

export default function ToysSection({
  boatOptions, selectedExtras, toggleExtra,
  watersportsPartners, watersportsCatalog, selectedPartnerWatersports,
  setSelectedPartnerWatersports, removePartnerWatersport, updatePartnerWatersport,
  expandedSections, toggleSection, customPrices, getPrice, setPrice
}: ToysSectionProps) {
  return (
    <div id="toys" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#0d2137', borderRadius: '16px', border: '1px solid rgba(0,201,255,0.2)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#0891b2' }}>🎿 ВОДНЫЕ РАЗВЛЕЧЕНИЯ</h3>
      
      {/* Included water toys */}
      {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#0d2137', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.2)' }}>
          <span style={{ fontWeight: '600', color: '#166534' }}>Включено: </span>
          {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').map((o, i) => (
            <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>
          ))}
        </div>
      )}

      {/* Paid water toys from boat */}
      {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').length > 0 && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#132840', borderRadius: '12px', border: '1px solid rgba(0,201,255,0.2)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#0891b2' }}>➕ Добавить с яхты:</p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').map(opt => {
              const isAdded = selectedExtras.some(e => e.optionId === opt.id);
              return (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#0e3a4a' : '#0f2337', borderRadius: '8px', border: isAdded ? '2px solid #00C9FF' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={isAdded} onChange={() => toggleExtra(opt)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '500' }}>{opt.option_name}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#0891b2' }}>
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
        <div style={{ borderRadius: '12px', border: '1px solid rgba(0,201,255,0.2)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleSection('partnerWatersports')}
            style={{ padding: '14px 16px', backgroundColor: '#0d2137', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{expandedSections.partnerWatersports ? '▼' : '▶'}</span>
              <span style={{ fontWeight: '600', color: '#0891b2' }}>🏄 🏄 Водные развлечения от партнёров</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>({watersportsPartners.length} партнёров)</span>
            </div>
          </div>
          
          {expandedSections.partnerWatersports && (
            <div style={{ padding: '16px', backgroundColor: '#132840' }}>
              {watersportsPartners.map(partner => (
                <div key={partner.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#0d2137', borderRadius: '10px', border: '1px solid rgba(0,201,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: '#0891b2', fontSize: '16px' }}>{partner.name}</span>
                      {partner.phone && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>📞 {partner.phone}</p>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {watersportsCatalog.filter(w => w.partner_id === partner.id).map(item => {
                      const isAdded = selectedPartnerWatersports.some(w => w.id === item.id);
                      const pw = selectedPartnerWatersports.find(w => w.id === item.id);
                      const basePrice = (item.price_per_hour || 0) > 0 ? item.price_per_hour : item.price_per_day;
                      
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: isAdded ? '#0e3a4a' : '#0f2337', borderRadius: '8px', border: isAdded ? '2px solid #00C9FF' : '1px solid rgba(255,255,255,0.08)' }}>
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
                              <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                              {item.name_ru && <span style={{ marginLeft: '6px', fontSize: '13px', color: '#64748b' }}>({item.name_ru})</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isAdded && pw && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {(item.price_per_hour || 0) > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'hours', Math.max(1, (pw.hours || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>−</button>
                                    <span style={{ minWidth: '40px', textAlign: 'center' }}>{pw.hours} ч</span>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'hours', (pw.hours || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                  </div>
                                )}
                                {(item.price_per_day || 0) > 0 && (item.price_per_hour || 0) === 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'days', Math.max(1, (pw.days || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>−</button>
                                    <span style={{ minWidth: '40px', textAlign: 'center' }}>{pw.days} дн</span>
                                    <button onClick={() => updatePartnerWatersport(item.id, 'days', (pw.days || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>+</button>
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
                              <span style={{ fontSize: '12px', color: '#64748b' }}>THB/{(item.price_per_hour || 0) > 0 ? 'час' : 'день'}</span>
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
