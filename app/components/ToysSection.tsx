'use client';
import { useCharterStore } from '../store/useCharterStore';
import Counter from './ui/Counter';
import PriceInput from './ui/PriceInput';
import CollapsibleSection from './ui/CollapsibleSection';

export default function ToysSection() {
  const {
    boatOptions = [], selectedExtras = [],
    watersportsPartners = [], watersportsCatalog = [],
    selectedPartnerWatersports = [], expandedSections = {},
    customPrices = {},
    set, getPrice, setPrice, toggleSection,
  } = useCharterStore();

  const toggleExtra = (opt: any) => {
    const exists = selectedExtras.find((e: any) => e.optionId === opt.id);
    if (exists) set({ selectedExtras: selectedExtras.filter((e: any) => e.optionId !== opt.id) });
    else set({ selectedExtras: [...selectedExtras, { optionId: opt.id, name: opt.name_en || opt.name, nameRu: opt.name_ru || '', quantity: 1, price: opt.price || 0, pricePer: opt.price_per || 'fix', category: opt.option_category || 'other' }] });
  };

  const removePartnerWatersport = (id: number) => {
    set({ selectedPartnerWatersports: selectedPartnerWatersports.filter((w: any) => w.id !== id) });
  };

  const updatePartnerWatersport = (id: number, field: string, value: number) => {
    set({ selectedPartnerWatersports: selectedPartnerWatersports.map((w: any) => w.id === id ? { ...w, [field]: value } : w) });
  };

  const addPartnerWatersport = (item: any, partner: any) => {
    set({
      selectedPartnerWatersports: [...selectedPartnerWatersports, {
        id: item.id,
        name: item.name_en,
        partnerName: partner.name,
        partnerId: partner.id,
        pricePerHour: (item.price_per_hour || 0),
        pricePerDay: (item.price_per_day || 0),
        hours: (item.price_per_hour || 0) > 0 ? 1 : 0,
        days: (item.price_per_hour || 0) > 0 ? 0 : ((item.price_per_day || 0) > 0 ? 1 : 0),
      }],
    });
  };

  const waterIncluded = boatOptions.filter((o: any) =>
    ['water', 'toys', 'equipment'].includes(o.category_code) && o.status === 'included'
  );
  const waterPaid = boatOptions.filter((o: any) =>
    ['water', 'toys'].includes(o.category_code) && o.status === 'paid_optional'
  );

  return (
    <div id="toys" className="os-section">
      <div className="os-section__title" style={{ color: 'var(--os-aqua)' }}>🎿 ВОДНЫЕ РАЗВЛЕЧЕНИЯ</div>

      {/* Included from boat */}
      {waterIncluded.length > 0 && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--os-card)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--os-green)' }}>✅ Включено: </span>
          {waterIncluded.map((o: any, i: number) => <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>)}
        </div>
      )}

      {/* Paid extras from boat */}
      {waterPaid.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--os-aqua)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>➕ Добавить с яхты:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
            {waterPaid.map((opt: any) => {
              const isAdded = selectedExtras.some((e: any) => e.optionId === opt.id);
              return (
                <div key={opt.id}
                  className={`os-item-row${isAdded ? ' os-item-row--active-aqua' : ''}`}
                  onClick={() => toggleExtra(opt)}>
                  <div className={`os-check${isAdded ? ' os-check--aqua' : ''}`}>
                    {isAdded && <span className="os-check__tick">✓</span>}
                  </div>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{opt.option_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <PriceInput
                      value={getPrice(`opt_${opt.id}`, opt.price || 0)}
                      onChange={v => setPrice(`opt_${opt.id}`, v)}
                      unit={`THB${opt.price_per === 'hour' ? '/ч' : opt.price_per === 'day' ? '/д' : ''}`}
                      accentColor="var(--os-aqua)"
                      width={65}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Partner watersports collapsible */}
      {watersportsPartners.length > 0 && (
        <CollapsibleSection
          title="🏄 Водные игрушки (партнёры)"
          isOpen={!!expandedSections.partnerWatersports}
          onToggle={() => toggleSection('partnerWatersports')}
          accentColor="var(--os-aqua)"
          badge={selectedPartnerWatersports.length > 0 ? selectedPartnerWatersports.length : undefined}
        >
          {(watersportsPartners as any[]).map((partner: any) => (
            <div key={partner.id} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: 'var(--os-aqua)', fontSize: 13 }}>{partner.name}</span>
                {partner.phone && <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginTop: 2 }}>📞 {partner.phone}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {(watersportsCatalog as any[]).filter((w: any) => w.partner_id === partner.id).map((item: any) => {
                  const isAdded = selectedPartnerWatersports.some((w: any) => w.id === item.id);
                  const pw = selectedPartnerWatersports.find((w: any) => w.id === item.id);
                  const basePrice = (item.price_per_hour || 0) > 0 ? item.price_per_hour : item.price_per_day;
                  const byHour = (item.price_per_hour || 0) > 0;
                  const byDay = (item.price_per_day || 0) > 0 && !byHour;

                  return (
                    <div key={item.id}
                      className={`os-item-row${isAdded ? ' os-item-row--active-aqua' : ''}`}
                      onClick={() => isAdded ? removePartnerWatersport(item.id) : addPartnerWatersport(item, partner)}>
                      <div className={`os-check${isAdded ? ' os-check--aqua' : ''}`}>
                        {isAdded && <span className="os-check__tick">✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--os-text-1)' }}>{item.name_en}</span>
                        {item.name_ru && <span className="os-hide-mobile" style={{ marginLeft: 6, fontSize: 11, color: 'var(--os-text-3)' }}>({item.name_ru})</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                        {isAdded && pw && (
                          <>
                            {byHour && (
                              <Counter
                                value={pw.hours || 1}
                                onChange={v => updatePartnerWatersport(item.id, 'hours', Math.max(1, v))}
                                min={1}
                                label="ч"
                              />
                            )}
                            {byDay && (
                              <Counter
                                value={pw.days || 1}
                                onChange={v => updatePartnerWatersport(item.id, 'days', Math.max(1, v))}
                                min={1}
                                label="дн"
                              />
                            )}
                          </>
                        )}
                        <PriceInput
                          value={getPrice(`ws_${item.id}`, basePrice)}
                          onChange={v => {
                            setPrice(`ws_${item.id}`, v);
                            if (isAdded) {
                              set({
                                selectedPartnerWatersports: selectedPartnerWatersports.map((w: any) =>
                                  w.id === item.id ? { ...w, pricePerHour: byHour ? v : 0, pricePerDay: byDay ? v : 0 } : w
                                ),
                              });
                            }
                          }}
                          unit={`THB/${byHour ? 'ч' : 'д'}`}
                          accentColor="var(--os-aqua)"
                          width={75}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}
