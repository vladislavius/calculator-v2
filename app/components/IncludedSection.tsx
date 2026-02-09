'use client';

import { BoatOption } from '../lib/types';

interface RouteFee {
  id: number;
  name_en: string;
  price_per_person: number;
  mandatory: boolean;
}

interface IncludedSectionProps {
  boatOptions: BoatOption[];
  routeFees: RouteFee[];
  loadingOptions: boolean;
}

export default function IncludedSection({ boatOptions, routeFees, loadingOptions }: IncludedSectionProps) {
  return (
    <>
      <div id="included" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '16px', border: '2px solid #86efac' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#166534' }}>✅ ВКЛЮЧЕНО В СТОИМОСТЬ</h3>
        {loadingOptions ? (
          <p>Загрузка...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {boatOptions.filter(o => o.status === 'included').map(opt => (
              <span key={opt.id} style={{ padding: '8px 16px', backgroundColor: '#dcfce7', borderRadius: '20px', fontSize: '14px', color: '#166534', border: '1px solid #86efac' }}>
                ✓ {opt.option_name}
              </span>
            ))}
            {boatOptions.filter(o => o.status === 'included').length === 0 && (
              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о включённых опциях не указана в контракте</span>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '2px solid #fca5a5' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>❌ НЕ ВКЛЮЧЕНО (нужно доплатить или взять своё)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {routeFees.filter(f => f.mandatory).map(fee => (
            <div key={fee.id} style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{fee.name_en}</span>
              <span style={{ fontWeight: '600', color: '#dc2626' }}>— {fee.price_per_person} THB/чел</span>
              <span style={{ padding: '2px 8px', backgroundColor: '#fecaca', borderRadius: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>⚠️ ОБЯЗАТЕЛЬНО</span>
            </div>
          ))}
          <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <span>Алкоголь</span>
          </div>
          <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <span>Трансфер от отеля</span>
          </div>
          <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <span>VAT 7% (если нужен счёт)</span>
          </div>
        </div>
      </div>
    </>
  );
}
