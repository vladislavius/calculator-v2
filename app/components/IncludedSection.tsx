'use client';
import { useCharterStore } from '../store/useCharterStore';
import { BoatOption } from '../lib/types';

export default function IncludedSection() {
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  if (!boat) return null;

  const included = s.boatOptions.filter(o => o.status === 'included');
  const notIncluded = s.boatOptions.filter(o => o.status === 'not_included' || o.status === 'byob');

  return (
    <div id="included" style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Инфо о лодке */}
      <div style={{ padding:'14px 16px', background:'rgba(0,0,0,0.25)', border:'1px solid var(--os-border)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--os-text-2)', display:'flex', flexWrap:'wrap', gap:12 }}>
        <span>📏 {boat.length_ft} ft</span>
        <span>👥 до {boat.max_guests} чел</span>
        {boat.cabin_count > 0 && <span>🛏️ {boat.cabin_count} каюты</span>}
        {boat.crew_count  > 0 && <span>👨‍✈️ {boat.crew_count} экипаж</span>}
        <span>🗺️ {boat.route_name}</span>
        {boat.marina_name && <span>⚓ {boat.marina_name}</span>}
      </div>

      {/* Гости */}
      <GuestSelectorInline />

      {/* Включено */}
      {included.length > 0 && (
        <div style={{ background:'var(--os-card)', border:'1px solid var(--os-border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--os-border)', fontSize:13, fontWeight:700, color:'var(--os-green)', display:'flex', alignItems:'center', gap:8 }}>
            ✅ ВКЛЮЧЕНО В СТОИМОСТЬ
          </div>
          <div style={{ padding:'14px 16px', display:'flex', flexWrap:'wrap', gap:8 }}>
            {included.map(opt => (
              <span key={opt.id} className="os-included-item">
                ✓ {opt.option_name_ru || opt.option_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Не включено */}
      {notIncluded.length > 0 && (
        <div style={{ background:'var(--os-card)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(239,68,68,0.15)', fontSize:13, fontWeight:700, color:'var(--os-red)', display:'flex', alignItems:'center', gap:8 }}>
            ✕ НЕ ВКЛЮЧЕНО (нужно доплатить или взять своё)
          </div>
          <div style={{ padding:'14px 16px', display:'flex', flexWrap:'wrap', gap:8 }}>
            {notIncluded.map(opt => (
              <span key={opt.id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', background:'var(--os-red-bg)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-sm)', fontSize:12, color:'var(--os-red)', fontWeight:500 }}>
                ✕ {opt.option_name_ru || opt.option_name}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function GuestSelectorInline() {
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  if (!boat) return null;

  const adultPrice  = s.customAdultPrice  !== null ? s.customAdultPrice  : (boat.extra_pax_price || 0);
  const childPrice  = s.customChildPrice  !== null ? s.customChildPrice  : Math.round((boat.extra_pax_price || 0) * 0.5);
  const surcharge   = s.extraAdults * adultPrice + s.children3to11 * childPrice;
  const totalGuests = s.adults + s.extraAdults + s.children3to11 + s.childrenUnder3;

  return (
    <div className="os-guests">
      <div style={{ fontSize:13, fontWeight:700, color:'var(--os-text-1)' }}>👥 Гости на борту</div>
      <div className="os-guests__info">
        <span>Базовое включено: <strong>{boat.base_pax || 8}</strong></span>
        <span>·</span>
        <span>Макс: <strong>{boat.max_guests}</strong></span>
        {boat.cabin_count > 0 && <span>· 🛏️ <strong>{boat.cabin_count}</strong></span>}
      </div>
      <div className="os-guests__grid">
        <div className="os-guest-cell">
          <div className="os-guest-cell__label">👨 Доп. взрослые</div>
          <div className="os-guest-cell__row">
            <button className="os-counter__btn" onClick={() => s.set({ extraAdults: Math.max(0, s.extraAdults-1) })}>−</button>
            <span className="os-counter__val" style={{ fontSize:18 }}>{s.extraAdults}</span>
            <button className="os-counter__btn" onClick={() => s.set({ extraAdults: s.extraAdults+1 })}>+</button>
          </div>
          <div className="os-guest-cell__price-row">
            <input type="number" value={adultPrice} onChange={e => s.set({ customAdultPrice: Number(e.target.value)||0 })} className="os-guest-price-input" />
            <span style={{ fontSize:11, color:'var(--os-text-3)' }}>฿/чел</span>
          </div>
        </div>
        <div className="os-guest-cell">
          <div className="os-guest-cell__label">👧 Дети 3–11</div>
          <div className="os-guest-cell__row">
            <button className="os-counter__btn" onClick={() => s.set({ children3to11: Math.max(0, s.children3to11-1) })}>−</button>
            <span className="os-counter__val" style={{ fontSize:18 }}>{s.children3to11}</span>
            <button className="os-counter__btn" onClick={() => s.set({ children3to11: s.children3to11+1 })}>+</button>
          </div>
          <div className="os-guest-cell__price-row">
            <input type="number" value={childPrice} onChange={e => s.set({ customChildPrice: Number(e.target.value)||0 })} className="os-guest-price-input" />
            <span style={{ fontSize:11, color:'var(--os-text-3)' }}>฿/чел</span>
          </div>
        </div>
        <div className="os-guest-cell">
          <div className="os-guest-cell__label">👶 До 3 лет <span style={{ color:'var(--os-green)', fontSize:10 }}>(free)</span></div>
          <div className="os-guest-cell__row">
            <button className="os-counter__btn" onClick={() => s.set({ childrenUnder3: Math.max(0, s.childrenUnder3-1) })}>−</button>
            <span className="os-counter__val" style={{ fontSize:18 }}>{s.childrenUnder3}</span>
            <button className="os-counter__btn" onClick={() => s.set({ childrenUnder3: s.childrenUnder3+1 })}>+</button>
          </div>
        </div>
      </div>
      <div className="os-guests__footer">
        <span>Всего: <strong style={{ color:'var(--os-aqua)' }}>{totalGuests}</strong> из {boat.max_guests}</span>
        {surcharge > 0 && <span className="os-guests__surcharge">+{surcharge.toLocaleString()} ฿</span>}
      </div>
    </div>
  );
}
