'use client';
import { useCharterStore } from '../store/useCharterStore';

interface StaffService {
  id: number;
  name_en: string;
  name_ru?: string;
  price: number | null;
  category?: string;
}

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
  const set = useCharterStore(s => s.set);

  const toggleService = (service: any) => {
    const exists = selectedServices.find(s => s.id === service.id);
    if (exists) {
      set({ selectedServices: selectedServices.filter(s => s.id !== service.id) });
    } else {
      set({ selectedServices: [...selectedServices, { id: service.id, name: service.name_en, nameRu: service.name_ru, price: service.price || 0 }] });
    }
  };
  const staffServices    = useCharterStore(s => s.staffServices);
  const selectedServices = useCharterStore(s => s.selectedServices);
  const getPrice         = useCharterStore(s => s.getPrice);
  const setPrice         = useCharterStore(s => s.setPrice);

  if (staffServices.length === 0) return (
    <div className="os-section" id="services">
      <div className="os-section__title">👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</div>
      <p style={{ color: 'var(--os-text-3)', fontStyle: 'italic', fontSize: 13 }}>Услуги не загружены</p>
    </div>
  );

  return (
    <div className="os-section" id="services">
      <div className="os-section__title">👨‍💼 ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</div>

      {/* Единый grid для всех услуг */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 8,
      }}>
        {(staffServices as StaffService[]).map(service => {
          const cat      = service.category || 'other';
          const meta     = CAT[cat] || CAT.other;
          const selected = selectedServices.find((s: any) => s.id === service.id);
          const price    = getPrice(`service_${service.id}`, service.price || 0);

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              style={{
                padding: '14px 16px',
                backgroundColor: selected ? `${meta.color}18` : 'var(--os-surface)',
                borderRadius: 'var(--r-sm)',
                border: `1.5px solid ${selected ? meta.color : 'var(--os-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              {/* Строка 1: кастомный чекбокс + название */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${selected ? meta.color : 'var(--os-border)'}`,
                  backgroundColor: selected ? meta.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {selected && <span style={{ color: '#0C1825', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: selected ? 'var(--os-text-1)' : 'var(--os-text-2)',
                    lineHeight: 1.3,
                  }}>
                    {service.name_ru || service.name_en}
                  </div>
                </div>
              </div>

              {/* Строка 2: категория-бейдж + цена */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 3,
                  backgroundColor: `${meta.color}20`,
                  color: meta.color, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  {meta.icon} {meta.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}
                     onClick={e => e.stopPropagation()}>
                  <input
                    type="number"
                    value={price}
                    onChange={e => { e.stopPropagation(); setPrice(`service_${service.id}`, Number(e.target.value)); }}
                    style={{
                      width: 70, padding: '3px 6px', textAlign: 'right',
                      border: '1px solid var(--os-border)', borderRadius: 4,
                      backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)',
                      fontSize: 11, fontWeight: 700, outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--os-text-3)' }}>฿</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
