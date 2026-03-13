'use client';
import { useCharterStore } from '../store/useCharterStore';

export default function GuestSelector() {
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  const lang = useCharterStore(st => st.lang);
  if (!boat) return null;

  const adultPrice  = s.customAdultPrice  !== null ? s.customAdultPrice  : (boat.extra_pax_price || 0);
  const childPrice  = s.customChildPrice  !== null ? s.customChildPrice  : Math.round((boat.extra_pax_price || 0) * 0.5);
  const surcharge   = s.extraAdults * adultPrice + s.children3to11 * childPrice;
  const totalGuests = s.adults + s.extraAdults + s.children3to11 + s.childrenUnder3;

  return (
    <div className="os-guests">
      <div style={{ fontSize:13, fontWeight:700, color:'var(--os-text-1)' }}>
        {lang === 'en' ? '👥 Guests on board' : '👥 Гости на борту'}
      </div>
      <div className="os-guests__info">
        <span>{lang === 'en' ? 'Base included' : 'Базовое включено'}: <strong>{boat.base_pax || 8}</strong></span>
        <span>·</span>
        <span>{lang === 'en' ? 'Max' : 'Макс'}: <strong>{boat.max_guests}</strong></span>
        {boat.cabin_count > 0 && <span>· 🛏️ <strong>{boat.cabin_count}</strong></span>}
      </div>
      <div className="os-guests__grid">
        <div className="os-guest-cell">
          <div className="os-guest-cell__label">{lang === 'en' ? '👨 Extra adults' : '👨 Доп. взрослые'}</div>
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
          <div className="os-guest-cell__label">{lang === 'en' ? '👧 Children 3–11' : '👧 Дети 3–11'}</div>
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
          <div className="os-guest-cell__label">
            {lang === 'en' ? '👶 Under 3' : '👶 До 3 лет'}
            {' '}<span style={{ color:'var(--os-green)', fontSize:10 }}>(free)</span>
          </div>
          <div className="os-guest-cell__row">
            <button className="os-counter__btn" onClick={() => s.set({ childrenUnder3: Math.max(0, s.childrenUnder3-1) })}>−</button>
            <span className="os-counter__val" style={{ fontSize:18 }}>{s.childrenUnder3}</span>
            <button className="os-counter__btn" onClick={() => s.set({ childrenUnder3: s.childrenUnder3+1 })}>+</button>
          </div>
        </div>
      </div>
      <div className="os-guests__footer">
        <span>
          {lang === 'en' ? 'Total' : 'Всего'}: <strong style={{ color:'var(--os-aqua)' }}>{totalGuests}</strong>
          {' '}{lang === 'en' ? 'of' : 'из'} {boat.max_guests}
        </span>
        {surcharge > 0 && <span className="os-guests__surcharge">+{surcharge.toLocaleString()} ฿</span>}
      </div>
    </div>
  );
}
