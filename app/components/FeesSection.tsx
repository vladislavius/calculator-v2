'use client';
import { useCharterStore } from '../store/useCharterStore';
import Counter from './ui/Counter';
import PriceInput from './ui/PriceInput';

export default function FeesSection() {
  const {
    selectedBoat, routeFees = [], selectedFees = [],
    landingEnabled = false, landingFee = 0,
    defaultParkFeeEnabled = false, defaultParkFee = 0,
    defaultParkFeeAdults = 0, defaultParkFeeChildren = 0,
    set,
  } = useCharterStore();

  const routeName = selectedBoat?.route_name || '';

  const toggleFee = (fee: any) => {
    const exists = selectedFees.find((f: any) => f.id === fee.id);
    if (exists) {
      set({ selectedFees: selectedFees.filter((f: any) => f.id !== fee.id) });
    } else {
      set({ selectedFees: [...selectedFees, { id: fee.id, name: fee.name_en, pricePerPerson: fee.price_per_person, adults: defaultParkFeeAdults, children: defaultParkFeeChildren }] });
    }
  };

  const updateFee = (id: number, field: string, value: number) => {
    set({ selectedFees: selectedFees.map((f: any) => f.id === id ? { ...f, [field]: value } : f) });
  };

  return (
    <div className="os-section" id="fees">
      <div className="os-section__title" style={{ color: 'var(--os-red)', marginBottom: 12 }}>🏝️ ПАРКОВЫЕ СБОРЫ И ВЫСАДКА</div>

      {/* Main fees: 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginBottom: 8 }}>

        {/* Landing fee */}
        <div className={`os-item-row${landingEnabled ? ' os-item-row--active-red' : ''}`}
          onClick={() => set({ landingEnabled: !landingEnabled })}>
          <div className={`os-check${landingEnabled ? ' os-check--red' : ''}`}>
            {landingEnabled && <span className="os-check__tick">✓</span>}
          </div>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>🚤 Высадка на остров</span>
          <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>Landing fee</span>
          <PriceInput
            value={landingFee}
            onChange={v => set({ landingFee: v })}
            unit="THB"
            width={80}
          />
        </div>

        {/* Park fee */}
        <div className={`os-item-row${defaultParkFeeEnabled ? ' os-item-row--active-red' : ''}`}
          onClick={() => set({ defaultParkFeeEnabled: !defaultParkFeeEnabled })}>
          <div className={`os-check${defaultParkFeeEnabled ? ' os-check--red' : ''}`}>
            {defaultParkFeeEnabled && <span className="os-check__tick">✓</span>}
          </div>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>🌴 Парковый сбор</span>
          <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>National Park Fee</span>
          <PriceInput
            value={defaultParkFee}
            onChange={v => set({ defaultParkFee: v })}
            unit="THB/чел"
            width={80}
          />
        </div>
      </div>

      {/* Park fee guest counters */}
      {defaultParkFeeEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--r-sm)', marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--os-text-3)', minWidth: 60 }}>Взрослых:</span>
          <Counter value={defaultParkFeeAdults} onChange={v => set({ defaultParkFeeAdults: v })} />
          <span style={{ fontSize: 12, color: 'var(--os-text-3)', minWidth: 40 }}>Детей:</span>
          <Counter value={defaultParkFeeChildren} onChange={v => set({ defaultParkFeeChildren: v })} />
          <span style={{ width: '100%', textAlign: 'right', fontWeight: 800, color: 'var(--os-red)', fontSize: 14 }}>
            = {(defaultParkFee * (defaultParkFeeAdults + defaultParkFeeChildren)).toLocaleString()} THB
          </span>
        </div>
      )}

      {/* Route fees */}
      {routeFees.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📍 {routeName}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            {routeFees.map((fee: any) => {
              const sel = selectedFees.find((f: any) => f.id === fee.id);
              return (
                <div key={fee.id} className={`os-item-row${sel ? ' os-item-row--active-red' : ''}`}
                  onClick={() => toggleFee(fee)}>
                  <div className={`os-check${sel ? ' os-check--red' : ''}`}>
                    {sel && <span className="os-check__tick">✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)', minWidth: 150 }}>
                    {fee.name_en}
                    {fee.mandatory && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: 'rgba(239,68,68,0.15)', borderRadius: 4, color: 'var(--os-red)' }}>⚠️ обязательно</span>}
                  </span>
                  {fee.name_ru && <span className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)', marginRight: 4 }}>{fee.name_ru}</span>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--os-text-1)', flexShrink: 0 }}>{fee.price_per_person.toLocaleString()}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--os-red)', flexShrink: 0, width: 52 }}>THB/чел</span>

                  {/* Per-fee guest counters */}
                  {sel && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.15)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--os-text-3)', width: 30 }}>Взр:</span>
                        <Counter value={sel.adults || 0} onChange={v => updateFee(fee.id, 'adults', v)} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--os-text-3)', width: 30 }}>Дет:</span>
                        <Counter value={sel.children || 0} onChange={v => updateFee(fee.id, 'children', v)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: 800, color: 'var(--os-red)', fontSize: 13 }}>
                          = {(fee.price_per_person * ((sel.adults || 0) + (sel.children || 0))).toLocaleString()} THB
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
