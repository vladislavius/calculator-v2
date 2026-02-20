'use client';

import { useCharterStore } from '../store/useCharterStore';

interface StaffService {
  id: number;
  name_en: string;
  name_ru?: string;
  price: number | null;
  category?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  media:         { label: 'Фото и видео',        icon: '📸', color: '#3b82f6' },
  entertainment: { label: 'Развлечения',          icon: '🎵', color: '#8b5cf6' },
  wellness:      { label: 'Велнес и уход',        icon: '💆', color: '#10b981' },
  service:       { label: 'Сервис',               icon: '🤵', color: '#f59e0b' },
  guide:         { label: 'Гиды и экскурсии',     icon: '🗺️', color: '#06b6d4' },
  diving:        { label: 'Дайвинг',              icon: '🤿', color: '#0ea5e9' },
  decoration:    { label: 'Декорации',            icon: '🎉', color: '#ec4899' },
  transfer:      { label: 'Трансфер',             icon: '🚐', color: '#22c55e' },
  other:         { label: 'Прочее',               icon: '📦', color: '#94a3b8' },
};

export default function ServicesSection({ toggleService }: { toggleService: (service: StaffService) => void }) {
  const staffServices = useCharterStore(s => s.staffServices);
  const selectedServices = useCharterStore(s => s.selectedServices);
  const getPrice = useCharterStore(s => s.getPrice);
  const setPrice = useCharterStore(s => s.setPrice);

  // Группируем по категориям
  const grouped = staffServices.reduce((acc: Record<string, StaffService[]>, s: StaffService) => {
    const cat = s.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  if (staffServices.length === 0) {
    return (
      <div id="services" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#0d2137', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</h3>
        <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '12px' }}>Услуги не загружены</p>
      </div>
    );
  }

  return (
    <div id="services" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#0d2137', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</h3>

      {Object.entries(grouped).map(([cat, services]) => {
        const meta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
        return (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>{meta.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {(services as StaffService[]).map(service => {
                const selected = selectedServices.find((s: any) => s.id === service.id);
                return (
                  <div key={service.id}
                    onClick={() => toggleService(service)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: selected ? '#1a1040' : '#0f2337', borderRadius: '10px', border: selected ? `2px solid ${meta.color}` : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" checked={!!selected} onChange={() => toggleService(service)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: meta.color }} />
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '13px', color: '#e2e8f0' }}>{service.name_ru || service.name_en}</div>
                        {service.name_ru && service.name_en !== service.name_ru && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{service.name_en}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <input
                        type="number"
                        value={getPrice(`service_${service.id}`, service.price || 0)}
                        onChange={(e) => { e.stopPropagation(); setPrice(`service_${service.id}`, Number(e.target.value)); }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '72px', padding: '3px 6px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', textAlign: 'right', fontSize: '12px', backgroundColor: '#132840', color: '#e2e8f0' }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>฿</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
