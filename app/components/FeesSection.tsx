'use client';

interface RouteFee {
  id: number;
  name_en: string;
  name_ru?: string;
  price_per_person: number;
  mandatory: boolean;
}

interface SelectedFee {
  id: number;
  name: string;
  pricePerPerson: number;
  adults: number;
  children: number;
}

interface FeesSectionProps {
  routeName: string;
  routeFees: RouteFee[];
  selectedFees: SelectedFee[];
  toggleFee: (fee: RouteFee) => void;
  setSelectedFees: (fees: SelectedFee[]) => void;
  landingEnabled: boolean;
  setLandingEnabled: (v: boolean) => void;
  landingFee: number;
  setLandingFee: (v: number) => void;
  defaultParkFeeEnabled: boolean;
  setDefaultParkFeeEnabled: (v: boolean) => void;
  defaultParkFee: number;
  setDefaultParkFee: (v: number) => void;
  defaultParkFeeAdults: number;
  setDefaultParkFeeAdults: (v: number) => void;
  defaultParkFeeChildren: number;
  setDefaultParkFeeChildren: (v: number) => void;
  getPrice: (key: string, defaultPrice: number) => number;
  setPrice: (key: string, value: number) => void;
}

export default function FeesSection({
  routeName, routeFees, selectedFees, toggleFee, setSelectedFees,
  landingEnabled, setLandingEnabled, landingFee, setLandingFee,
  defaultParkFeeEnabled, setDefaultParkFeeEnabled, defaultParkFee, setDefaultParkFee,
  defaultParkFeeAdults, setDefaultParkFeeAdults, defaultParkFeeChildren, setDefaultParkFeeChildren,
  getPrice, setPrice
}: FeesSectionProps) {
  return (
    <div id="fees" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '1px solid #fca5a5' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>🏝️ ПАРКОВЫЕ СБОРЫ И ВЫСАДКА</h3>

      {/* Landing fee */}
      <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: landingEnabled ? '#fee2e2' : 'white', borderRadius: '12px', border: landingEnabled ? '2px solid #f87171' : '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="checkbox" checked={landingEnabled} onChange={() => setLandingEnabled(!landingEnabled)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            <div>
              <span style={{ fontWeight: '600' }}>🚤 Высадка на остров</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Landing fee / Сбор за высадку</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="number" value={landingFee} onChange={(e) => setLandingFee(Number(e.target.value) || 0)} style={{ width: '80px', padding: '8px', border: '1px solid #dc2626', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }} />
            <span style={{ fontWeight: '600', color: '#dc2626' }}>THB</span>
          </div>
        </div>
      </div>

      {/* Default park fee */}
      <div style={{ padding: '16px', backgroundColor: defaultParkFeeEnabled ? '#fee2e2' : 'white', borderRadius: '12px', border: defaultParkFeeEnabled ? '2px solid #f87171' : '1px solid #e5e7eb', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <input type="checkbox" checked={defaultParkFeeEnabled} onChange={() => setDefaultParkFeeEnabled(!defaultParkFeeEnabled)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: '600' }}>🌴 Парковый сбор (по умолчанию)</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>National Park Fee / Сбор за посещение нац. парка</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type="number" value={defaultParkFee} onChange={(e) => setDefaultParkFee(Number(e.target.value) || 0)} style={{ width: '60px', padding: '2px 4px', border: '1px solid #dc2626', borderRadius: '4px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#dc2626' }} />
            <span style={{ fontWeight: '600', color: '#dc2626' }}>THB/чел</span>
          </div>
        </div>
        {defaultParkFeeEnabled && (
          <div style={{ marginTop: '12px', marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#6b7280' }}>Взрослых:</label>
              <button onClick={() => setDefaultParkFeeAdults(Math.max(0, defaultParkFeeAdults - 1))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
              <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{defaultParkFeeAdults}</span>
              <button onClick={() => setDefaultParkFeeAdults(defaultParkFeeAdults + 1)} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#6b7280' }}>Детей:</label>
              <button onClick={() => setDefaultParkFeeChildren(Math.max(0, defaultParkFeeChildren - 1))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
              <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{defaultParkFeeChildren}</span>
              <button onClick={() => setDefaultParkFeeChildren(defaultParkFeeChildren + 1)} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ marginLeft: 'auto', fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>
              = {(defaultParkFee * (defaultParkFeeAdults + defaultParkFeeChildren)).toLocaleString()} THB
            </div>
          </div>
        )}
      </div>

      {/* Route-specific fees */}
      {routeFees.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>📍 {routeName}:</p>
          {routeFees.map(fee => {
            const selected = selectedFees.find((f) => f.id === fee.id);
            return (
              <div key={fee.id} style={{ padding: '16px', backgroundColor: selected ? '#fee2e2' : 'white', borderRadius: '12px', border: selected ? '2px solid #f87171' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input type="checkbox" checked={!!selected} onChange={() => toggleFee(fee)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: '600' }}>{fee.name_en}</span>
                      {fee.mandatory && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#fecaca', borderRadius: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>⚠️ Обязательно</span>}
                      {fee.name_ru && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{fee.name_ru}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="number" value={getPrice(`fee_${fee.id}`, fee.price_per_person)} onChange={(e) => setPrice(`fee_${fee.id}`, Number(e.target.value))} onClick={(e) => e.stopPropagation()} style={{ width: '60px', padding: '2px 4px', border: '1px solid #dc2626', borderRadius: '4px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#dc2626' }} />
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>THB/чел</span>
                    </div>
                  </div>
                </div>
                {selected && (
                  <div style={{ marginTop: '12px', marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#6b7280' }}>Взрослых:</label>
                      <button onClick={() => setSelectedFees(selectedFees.map((f) => f.id === fee.id ? {...f, adults: Math.max(0, f.adults - 1)} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                      <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{selected.adults}</span>
                      <button onClick={() => setSelectedFees(selectedFees.map((f) => f.id === fee.id ? {...f, adults: f.adults + 1} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#6b7280' }}>Детей:</label>
                      <button onClick={() => setSelectedFees(selectedFees.map((f) => f.id === fee.id ? {...f, children: Math.max(0, f.children - 1)} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                      <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{selected.children}</span>
                      <button onClick={() => setSelectedFees(selectedFees.map((f) => f.id === fee.id ? {...f, children: f.children + 1} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ marginLeft: 'auto', fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>
                      = {(getPrice(`fee_${fee.id}`, fee.price_per_person) * (selected.adults + selected.children)).toLocaleString()} THB
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о сборах для этого маршрута не найдена</p>
      )}
    </div>
  );
}
