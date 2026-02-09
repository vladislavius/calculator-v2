'use client';

import { SearchResult } from '../lib/types';

interface GuestSelectorProps {
  selectedBoat: SearchResult;
  extraAdults: number;
  setExtraAdults: (v: number) => void;
  children3to11: number;
  setChildren3to11: (v: number) => void;
  childrenUnder3: number;
  setChildrenUnder3: (v: number) => void;
  customAdultPrice: number | null;
  setCustomAdultPrice: (v: number | null) => void;
  customChildPrice: number | null;
  setCustomChildPrice: (v: number | null) => void;
}

export default function GuestSelector({
  selectedBoat, extraAdults, setExtraAdults,
  children3to11, setChildren3to11, childrenUnder3, setChildrenUnder3,
  customAdultPrice, setCustomAdultPrice, customChildPrice, setCustomChildPrice
}: GuestSelectorProps) {
  return (
    <>
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: '600', fontSize: '15px' }}>👥 Гости на борту</p>
                  
                  {/* Info line */}
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px' }}>
                    <span>Базовая цена: <strong>{selectedBoat.base_pax || 8} чел</strong></span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Макс: <strong>{selectedBoat.max_guests} чел</strong></span>
                    {selectedBoat.cabin_count > 0 && (
                      <>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>🛏️ Кают: <strong>{selectedBoat.cabin_count}</strong></span>
                      </>
                    )}
                  </div>

                  {/* Guest inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {/* Extra Adults */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>👨 Доп. взрослые</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <button onClick={() => setExtraAdults(Math.max(0, extraAdults - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{extraAdults}</span>
                        <button onClick={() => setExtraAdults(extraAdults + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={customAdultPrice !== null ? customAdultPrice : (selectedBoat.extra_pax_price || 0)}
                          onChange={(e) => setCustomAdultPrice(Number(e.target.value) || 0)}
                          style={{ width: '65px', padding: '4px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '12px', textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.8)' }}
                        />
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>THB</span>
                      </div>
                    </div>

                    {/* Children 3-11 */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>👧 Дети 3-11 лет</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <button onClick={() => setChildren3to11(Math.max(0, children3to11 - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{children3to11}</span>
                        <button onClick={() => setChildren3to11(children3to11 + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={customChildPrice !== null ? customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5))}
                          onChange={(e) => setCustomChildPrice(Number(e.target.value) || 0)}
                          style={{ width: '65px', padding: '4px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '12px', textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.8)' }}
                        />
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>THB</span>
                      </div>
                    </div>

                    {/* Children under 3 */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>
                        👶 Дети до 3 лет
                        <span style={{ color: '#4ade80' }}> (бесплатно)</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => setChildrenUnder3(Math.max(0, childrenUnder3 - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{childrenUnder3}</span>
                        <button onClick={() => setChildrenUnder3(childrenUnder3 + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Total guests & surcharge */}
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>
                      Всего гостей: <strong>{(selectedBoat.base_pax || 8) + extraAdults + children3to11 + childrenUnder3}</strong> из {selectedBoat.max_guests}
                    </span>
                    {(extraAdults > 0 || children3to11 > 0) && (
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#fbbf24' }}>
                        Доплата: +{((extraAdults * (customAdultPrice !== null ? customAdultPrice : (selectedBoat.extra_pax_price || 0))) + (children3to11 * (customChildPrice !== null ? customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5))))).toLocaleString()} THB
                      </span>
                    )}
                  </div>
                </div>
    </>
  );
}