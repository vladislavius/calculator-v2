'use client';

import { useCharterStore } from '../store/useCharterStore';

interface StaffService {
  id: number;
  name_en: string;
  name_ru?: string;
  price: number | null;
}

export default function ServicesSection({ toggleService }: { toggleService: (service: StaffService) => void }) {
  const staffServices = useCharterStore(s => s.staffServices);
  const selectedServices = useCharterStore(s => s.selectedServices);
  const getPrice = useCharterStore(s => s.getPrice);
  const setPrice = useCharterStore(s => s.setPrice);

  return (
    <div id="services" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#faf5ff', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>👨‍💼 ДОПОЛНИТЕЛЬНЫЙ ПЕРСОНАЛ</h3>
      
      {staffServices.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {staffServices.map(service => {
            const selected = selectedServices.find((s: any) => s.id === service.id);
            return (
              <div key={service.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: selected ? '#1a0a2a' : '#0f2337', borderRadius: '10px', border: selected ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" checked={!!selected} onChange={() => toggleService(service)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <div>
                    <span style={{ fontWeight: '500' }}>{service.name_en}</span>
                    {service.name_ru && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{service.name_ru}</p>}
                  </div>
                </div>
                <span style={{ fontWeight: '600', color: '#7c3aed' }}>+<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={getPrice(`service_${service.id}`, service.price || 0)}
                      onChange={(e) => setPrice(`service_${service.id}`, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '70px', padding: '2px 4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', textAlign: 'right', fontSize: '12px' }}
                    /> THB
                  </span></span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#64748b', fontStyle: 'italic' }}>Список персонала не загружен</p>
      )}
    </div>
  );
}
