'use client';
import { useCharterStore } from '../store/useCharterStore';

interface RouteFee { id:number; name_en:string; name_ru?:string; price_per_person:number; mandatory:boolean; }
interface SelectedFee { id:number; name:string; pricePerPerson:number; adults:number; children:number; }

const feeRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  padding: '9px 12px', borderRadius: 'var(--r-sm)',
  border: '1.5px solid var(--os-border)',
  backgroundColor: 'var(--os-surface)',
  marginBottom: 6, transition: 'all 0.15s',
};
const feeRowActive: React.CSSProperties = {
  ...feeRow,
  border: '1.5px solid var(--os-red)',
  backgroundColor: 'rgba(239,68,68,0.07)',
};
const numInput: React.CSSProperties = {
  width: 80, padding: '4px 8px', textAlign: 'right',
  border: '1.5px solid var(--os-border)', borderRadius: 'var(--r-sm)',
  backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)',
  fontSize: 13, fontWeight: 700, outline: 'none', flexShrink: 0,
};
const unitLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--os-red)', flexShrink: 0, width: 52,
};
const counterBtn: React.CSSProperties = {
  width: 24, height: 24, border: '1.5px solid var(--os-border)',
  borderRadius: 4, backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)',
  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

export default function FeesSection() {
  const {
    selectedBoat, routeFees = [], selectedFees = [],
    landingEnabled = false, landingFee = 0,
    defaultParkFeeEnabled = false, defaultParkFee = 0,
    defaultParkFeeAdults = 0, defaultParkFeeChildren = 0,
    set, getPrice, setPrice,
  } = useCharterStore();

  const routeName = selectedBoat?.route_name || '';

  const setLandingEnabled = (v: boolean) => set({ landingEnabled: v });
  const setLandingFee = (v: number) => set({ landingFee: v });
  const setDefaultParkFeeEnabled = (v: boolean) => set({ defaultParkFeeEnabled: v });
  const setDefaultParkFee = (v: number) => set({ defaultParkFee: v });
  const setDefaultParkFeeAdults = (v: number) => set({ defaultParkFeeAdults: v });
  const setDefaultParkFeeChildren = (v: number) => set({ defaultParkFeeChildren: v });
  const setSelectedFees = (v: any) => set({ selectedFees: v });

  const toggleFee = (fee: any) => {
    const exists = selectedFees.find(f => f.id === fee.id);
    if (exists) {
      set({ selectedFees: selectedFees.filter(f => f.id !== fee.id) });
    } else {
      set({ selectedFees: [...selectedFees, { id: fee.id, name: fee.name_en, pricePerPerson: fee.price_per_person, adults: defaultParkFeeAdults, children: defaultParkFeeChildren }] });
    }
  };
  return (
    <div className="os-section" id="fees">
      <div className="os-section__title" style={{ color: 'var(--os-red)', marginBottom: 12 }}>🏝️ ПАРКОВЫЕ СБОРЫ И ВЫСАДКА</div>

      {/* ── Основные сборы: 2 колонки ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginBottom: 8 }}>
      {/* ── Высадка на остров ── */}
      <div style={landingEnabled ? feeRowActive : feeRow}>
        <input type="checkbox" checked={landingEnabled} onChange={() => setLandingEnabled(!landingEnabled)}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--os-red)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>🚤 Высадка на остров</span>
        <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>Landing fee</span>
        <input type="number" value={landingFee} onChange={e => setLandingFee(Number(e.target.value)||0)}
          style={numInput} onClick={e => e.stopPropagation()} />
        <span style={unitLabel}>THB</span>
      </div>

      {/* ── Парковый сбор ── */}
      <div style={defaultParkFeeEnabled ? feeRowActive : feeRow}>
        <input type="checkbox" checked={defaultParkFeeEnabled} onChange={() => setDefaultParkFeeEnabled(!defaultParkFeeEnabled)}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--os-red)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>🌴 Парковый сбор</span>
        <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>National Park Fee</span>
        <input type="number" value={defaultParkFee} onChange={e => setDefaultParkFee(Number(e.target.value)||0)}
          style={numInput} onClick={e => e.stopPropagation()} />
        <span style={unitLabel}>THB/чел</span>
      </div>

      </div>{/* конец grid основных сборов */}

      {/* ── Счётчики гостей для паркового сбора ── */}
      {defaultParkFeeEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 'var(--r-sm)', marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--os-text-3)', minWidth: 60 }}>Взрослых:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={counterBtn} onClick={() => setDefaultParkFeeAdults(Math.max(0, defaultParkFeeAdults-1))}>−</button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{defaultParkFeeAdults}</span>
            <button style={counterBtn} onClick={() => setDefaultParkFeeAdults(defaultParkFeeAdults+1)}>+</button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--os-text-3)', minWidth: 40 }}>Детей:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={counterBtn} onClick={() => setDefaultParkFeeChildren(Math.max(0, defaultParkFeeChildren-1))}>−</button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{defaultParkFeeChildren}</span>
            <button style={counterBtn} onClick={() => setDefaultParkFeeChildren(defaultParkFeeChildren+1)}>+</button>
          </div>
          <span style={{ width: '100%', textAlign: 'right', fontWeight: 800, color: 'var(--os-red)', fontSize: 14 }}>
            = {(defaultParkFee * (defaultParkFeeAdults + defaultParkFeeChildren)).toLocaleString()} THB
          </span>
        </div>
      )}

      {/* ── Маршрутные сборы ── */}
      {routeFees.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📍 {routeName}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
          {routeFees.map(fee => {
            const sel = selectedFees.find(f => f.id === fee.id);
            return (
              <div key={fee.id} style={sel ? feeRowActive : feeRow}>
                <input type="checkbox" checked={!!sel} onChange={() => toggleFee(fee)}
                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--os-red)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)', minWidth: '150px' }}>
                  {fee.name_en}
                  {fee.mandatory && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 4, color: 'var(--os-red)' }}>⚠️ обязательно</span>}
                </span>
                {fee.name_ru && <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>{fee.name_ru}</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--os-text-1)', flexShrink: 0 }}>
                  {fee.price_per_person.toLocaleString()}
                </span>
                <span style={unitLabel}>THB/чел</span>
                {/* Счётчики людей для выбранного сбора */}
                {sel && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.15)' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--os-text-3)', width: 30 }}>Взр:</span>
                      <button style={counterBtn} onClick={() => { const updated = selectedFees.map(f => f.id === fee.id ? {...f, adults: Math.max(0, (f.adults||0)-1)} : f); set({ selectedFees: updated }); }}>−</button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{sel.adults||0}</span>
                      <button style={counterBtn} onClick={() => { const updated = selectedFees.map(f => f.id === fee.id ? {...f, adults: (f.adults||0)+1} : f); set({ selectedFees: updated }); }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--os-text-3)', width: 30 }}>Дет:</span>
                      <button style={counterBtn} onClick={() => { const updated = selectedFees.map(f => f.id === fee.id ? {...f, children: Math.max(0, (f.children||0)-1)} : f); set({ selectedFees: updated }); }}>−</button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{sel.children||0}</span>
                      <button style={counterBtn} onClick={() => { const updated = selectedFees.map(f => f.id === fee.id ? {...f, children: (f.children||0)+1} : f); set({ selectedFees: updated }); }}>+</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 800, color: 'var(--os-red)', fontSize: 13 }}>
                        = {(fee.price_per_person * ((sel.adults||0) + (sel.children||0))).toLocaleString()} THB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {routeFees.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--os-text-3)', fontStyle: 'italic', marginTop: 4 }}>
          Информация о сборах для этого маршрута не найдена
        </p>
      )}
    </div>
  );
}
