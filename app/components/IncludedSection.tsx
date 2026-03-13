'use client';
import { useCharterStore } from '../store/useCharterStore';
import GuestSelector from './GuestSelector';

export default function IncludedSection() {
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  const lang = useCharterStore(st => st.lang);
  if (!boat) return null;

  const included    = s.boatOptions.filter(o => o.status === 'included');
  const notIncluded = s.boatOptions.filter(o => o.status === 'not_included' || o.status === 'byob');

  return (
    <div id="included" style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Boat info */}
      <div style={{ padding:'14px 16px', background:'rgba(0,0,0,0.25)', border:'1px solid var(--os-border)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--os-text-2)', display:'flex', flexWrap:'wrap', gap:12 }}>
        <span>📏 {boat.length_ft} ft</span>
        <span>{lang === 'en' ? `👥 up to ${boat.max_guests} guests` : `👥 до ${boat.max_guests} чел`}</span>
        {boat.cabin_count > 0 && <span>🛏️ {boat.cabin_count} {lang === 'en' ? 'cabins' : 'каюты'}</span>}
        {boat.crew_count  > 0 && <span>👨‍✈️ {boat.crew_count} {lang === 'en' ? 'crew' : 'экипаж'}</span>}
        <span>🗺️ {boat.route_name}</span>
        {boat.marina_name && <span>⚓ {boat.marina_name}</span>}
      </div>

      {/* Guests */}
      <GuestSelector />

      {/* Included */}
      {included.length > 0 && (
        <div style={{ background:'var(--os-card)', border:'1px solid var(--os-border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--os-border)', fontSize:13, fontWeight:700, color:'var(--os-green)', display:'flex', alignItems:'center', gap:8 }}>
            {lang === 'en' ? '✅ INCLUDED' : '✅ ВКЛЮЧЕНО В СТОИМОСТЬ'}
          </div>
          <div style={{ padding:'14px 16px' }} className="os-included-grid">
            {included.map(opt => (
              <span key={opt.id} className="os-included-item">
                ✓ {lang === 'en' ? (opt.option_name || opt.option_name_ru) : (opt.option_name_ru || opt.option_name)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not included */}
      {notIncluded.length > 0 && (
        <div style={{ background:'var(--os-card)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(239,68,68,0.15)', fontSize:13, fontWeight:700, color:'var(--os-red)', display:'flex', alignItems:'center', gap:8 }}>
            {lang === 'en' ? '✕ NOT INCLUDED' : '✕ НЕ ВКЛЮЧЕНО (нужно доплатить или взять своё)'}
          </div>
          <div style={{ padding:'14px 16px', display:'flex', flexWrap:'wrap', gap:8 }}>
            {notIncluded.map(opt => (
              <span key={opt.id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', background:'var(--os-red-bg)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-sm)', fontSize:12, color:'var(--os-red)', fontWeight:500 }}>
                ✕ {lang === 'en' ? (opt.option_name || opt.option_name_ru) : (opt.option_name_ru || opt.option_name)}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
