'use client';
import { useCharterStore } from '../store/useCharterStore';
import PriceInput from './ui/PriceInput';

const CAT: Record<string, { icon: string; color: string; label: string }> = {
  media:         { icon: '📸', color: 'var(--os-aqua)',   label: 'Фото/Видео' },
  entertainment: { icon: '🎵', color: 'var(--os-purple)', label: 'Развлечения' },
  wellness:      { icon: '💆', color: 'var(--os-green)',  label: 'Велнес' },
  service:       { icon: '🤵', color: 'var(--os-gold)',   label: 'Сервис' },
  guide:         { icon: '🗺️', color: '#06b6d4',          label: 'Гид' },
  diving:        { icon: '🤿', color: '#0ea5e9',          label: 'Дайвинг' },
  decoration:    { icon: '🎉', color: '#ec4899',          label: 'Декор' },
  transfer:      { icon: '🚐', color: 'var(--os-green)',  label: 'Трансфер' },
  other:         { icon: '📦', color: 'var(--os-text-2)', label: 'Прочее' },
};

export default function ServicesSection() {
  const set              = useCharterStore(s => s.set);
  const staffServices    = useCharterStore(s => s.staffServices);
  const selectedServices = useCharterStore(s => s.selectedServices);
  const getPrice         = useCharterStore(s => s.getPrice);
  const setPrice         = useCharterStore(s => s.setPrice);

  const toggleService = (service: any) => {
    const exists = selectedServices.find((s: any) => s.id === service.id);
    if (exists) set({ selectedServices: selectedServices.filter((s: any) => s.id !== service.id) });
    else set({ selectedServices: [...selectedServices, { id: service.id, name: service.name_en, nameRu: service.name_ru, price: service.price || 0 }] });
  };

  if (staffServices.length === 0) return (
    <div className="os-section" id="services">
      <div className="os-section__title">👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</div>
      <p style={{ color: 'var(--os-text-3)', fontStyle: 'italic', fontSize: 13 }}>Услуги не загружены</p>
    </div>
  );

  return (
    <div className="os-section" id="services">
      <div className="os-section__title">👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {(staffServices as any[]).map((service: any) => {
          const cat      = service.category || 'other';
          const meta     = CAT[cat] || CAT.other;
          const selected = selectedServices.find((s: any) => s.id === service.id);

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              style={{
                padding: '12px 14px',
                background: selected ? `${meta.color}18` : 'var(--os-surface)',
                borderRadius: 'var(--r-sm)',
                border: `1.5px solid ${selected ? meta.color : 'var(--os-border)'}`,
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              {/* Row 1: checkbox + name */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div className={`os-check${selected ? '' : ''}`}
                  style={{
                    marginTop: 1,
                    borderColor: selected ? meta.color : undefined,
                    background: selected ? meta.color : undefined,
                  }}>
                  {selected && <span className="os-check__tick">✓</span>}
                </div>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: selected ? 'var(--os-text-1)' : 'var(--os-text-2)', lineHeight: 1.3 }}>
                  {service.name_ru || service.name_en}
                </div>
              </div>

              {/* Row 2: category badge + price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 3,
                  background: `${meta.color}20`, color: meta.color,
                  fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {meta.icon} {meta.label}
                </span>
                <div style={{ marginLeft: 'auto' }}>
                  <PriceInput
                    value={getPrice(`service_${service.id}`, service.price || 0)}
                    onChange={v => setPrice(`service_${service.id}`, v)}
                    width={70}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
