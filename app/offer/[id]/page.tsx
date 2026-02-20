'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type OfferItem = {
  id: string; name: string; nameRu: string;
  quantity: number; unit: string; price: number; total: number; category: string;
};

type Offer = {
  id: string; boat_name: string; search_date: string; guests: number;
  time_slot: string; total_client: number; total_agent: number;
  lang: string; snapshot: any; notes: string; created_at: string; expires_at: string;
};

const TIME_SLOT_LABELS: Record<string, string> = {
  full_day: 'Полный день', half_day_am: 'Полдня (утро)',
  half_day_pm: 'Полдня (вечер)', overnight: 'Ночёвка', custom: 'Индивидуально',
};

const CAT_LABELS: Record<string, string> = {
  boat: '⛵ Аренда яхты', extra: '👥 Доп. гости',
  catering: '🍽️ Питание', drink: '🍹 Напитки',
  toy: '🏄 Водные развлечения', watersport: '🌊 Водные услуги',
  service: '🎉 Доп. услуги', fee: '🎫 Парковые сборы', transfer: '🚐 Трансфер',
};

const UNIT_LABELS: Record<string, string> = {
  fix: 'fix', pax: 'pax', hour: 'h', day: 'day', trip: 'trip', pcs: 'pcs',
};

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/offers?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setOffer(d); setLoading(false); });
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0C1825', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#64748b', fontSize:16 }}>Загрузка предложения...</div>
    </div>
  );

  if (error || !offer) return (
    <div style={{ minHeight:'100vh', background:'#0C1825', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>😔</div>
      <div style={{ color:'#e2e8f0', fontSize:20, fontWeight:700 }}>Предложение не найдено</div>
      <div style={{ color:'#64748b', fontSize:14 }}>{error==='Offer expired' ? 'Срок действия истёк' : 'Ссылка недействительна'}</div>
      <a href="/" style={{ padding:'10px 24px', borderRadius:8, backgroundColor:'#0891b2', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:600 }}>← На главную</a>
    </div>
  );

  const snap = offer.snapshot || {};
  const boat = snap.boat || {};
  const items: OfferItem[] = snap.items || [];

  // Группируем items по категории
  const categories = Array.from(new Set(items.map(i => i.category)));

  const expiresDate = new Date(offer.expires_at).toLocaleDateString('ru-RU');
  const createdDate = new Date(offer.created_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });
  const searchDateFmt = offer.search_date
    ? new Date(offer.search_date + 'T00:00:00').toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })
    : '—';

  const usd = Math.round((offer.total_client||0)/34).toLocaleString('en-US');
  const rub = Math.round((offer.total_client||0)*2.7).toLocaleString('ru-RU');

  // Стили
  const card: React.CSSProperties = {
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:16, padding:24, marginBottom:16,
  };
  const th: React.CSSProperties = {
    fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase',
    padding:'8px 12px', textAlign:'left',
  };
  const td: React.CSSProperties = {
    fontSize:13, color:'#cbd5e1', padding:'10px 12px',
    borderTop:'1px solid rgba(255,255,255,0.05)',
  };
  const tdRight: React.CSSProperties = { ...td, textAlign:'right', fontWeight:600, color:'#e2e8f0' };

  return (
    <div style={{ minHeight:'100vh', background:'#0C1825', color:'#e2e8f0', fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, backdropFilter:'blur(10px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, fontWeight:800, color:'#0891b2', letterSpacing:1 }}>ONLYSEA</span>
          <span style={{ fontSize:12, color:'#475569' }}>· Предложение для клиента</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={copyLink} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background: copied?'rgba(0,212,180,0.15)':'rgba(255,255,255,0.05)', color:copied?'#00d4b4':'#e2e8f0', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            {copied ? '✅ Скопировано!' : '🔗 Скопировать ссылку'}
          </button>
          <a href="/" style={{ padding:'7px 14px', borderRadius:8, backgroundColor:'#0891b2', color:'#fff', textDecoration:'none', fontSize:12, fontWeight:600 }}>
            Калькулятор →
          </a>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 20px' }}>

        {/* Hero фото */}
        {boat.main_photo_url && (
          <div style={{ borderRadius:16, overflow:'hidden', marginBottom:20, height:260 }}>
            <img src={boat.main_photo_url} alt={offer.boat_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}

        {/* Заголовок */}
        <div style={{ ...card, paddingBottom:20 }}>
          <div style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>{offer.boat_name}</div>
          {boat.partner_name && <div style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>{boat.partner_name}</div>}

          {/* Инфо-плитки */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12, marginBottom:16 }}>
            {[
              { icon:'📅', label:'Дата', val: searchDateFmt },
              { icon:'👥', label:'Гостей', val:`${offer.guests} чел.` },
              { icon:'⏱', label:'Формат', val: TIME_SLOT_LABELS[offer.time_slot]||offer.time_slot },
              ...(boat.length_ft?[{icon:'📏',label:'Длина',val:`${boat.length_ft} ft`}]:[]),
              ...(boat.route_name_ru||boat.route_name?[{icon:'🗺',label:'Маршрут',val:boat.route_name_ru||boat.route_name}]:[]),
            ].map((item,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:3 }}>{item.icon} {item.label}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Спецификации */}
          {(boat.max_guests||boat.cabin_count||boat.crew_count) && (
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#94a3b8' }}>
              {boat.max_guests && <span>👥 До {boat.max_guests} гостей</span>}
              {boat.cabin_count > 0 && <span>🛏 {boat.cabin_count} каюты</span>}
              {boat.crew_count > 0 && <span>👨‍✈️ {boat.crew_count} экипаж</span>}
            </div>
          )}
        </div>

        {/* Включено */}
        {boat.description && (
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'#0891b2' }}>✅ Включено в стоимость</div>
            <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{boat.description}</div>
          </div>
        )}

        {/* Состав по категориям */}
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} style={card}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'#0891b2' }}>
                {CAT_LABELS[cat] || cat}
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Название</th>
                    <th style={{ ...th, textAlign:'center' }}>Кол-во</th>
                    <th style={{ ...th, textAlign:'right' }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, i) => (
                    <tr key={i}>
                      <td style={td}>{item.nameRu || item.name}</td>
                      <td style={{ ...td, textAlign:'center', color:'#94a3b8' }}>
                        {item.quantity} {UNIT_LABELS[item.unit]||item.unit}
                      </td>
                      <td style={tdRight}>{item.total.toLocaleString()} ฿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Итого */}
        <div style={{ ...card, border:'1px solid rgba(8,145,178,0.3)', background:'rgba(8,145,178,0.07)' }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'#0891b2' }}>💰 Итого к оплате</div>

          {/* Разбивка по категориям */}
          <div style={{ marginBottom:16 }}>
            {categories.map(cat => {
              const total = items.filter(i=>i.category===cat).reduce((s,i)=>s+i.total,0);
              if (total === 0) return null;
              return (
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                  <span style={{ color:'#94a3b8' }}>{CAT_LABELS[cat]||cat}</span>
                  <span style={{ fontWeight:600 }}>+{total.toLocaleString()} ฿</span>
                </div>
              );
            })}
          </div>

          {/* Финальная сумма */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'rgba(8,145,178,0.15)', borderRadius:12 }}>
            <span style={{ fontSize:18, fontWeight:800 }}>ИТОГО К ОПЛАТЕ</span>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:32, fontWeight:900, color:'#0891b2' }}>{(offer.total_client||0).toLocaleString()} ฿</div>
              <div style={{ fontSize:12, color:'#64748b' }}>≈ {usd} USD · ≈ {rub} ₽</div>
            </div>
          </div>
        </div>

        {/* Заметки */}
        {offer.notes && (
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:10, color:'#0891b2' }}>📝 Примечания</div>
            <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{offer.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'24px 0 8px', color:'#334155', fontSize:12, borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:8 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#475569', marginBottom:4 }}>ONLYSEA · Аренда яхт на Пхукете</div>
          <div>onlysea.com · Действительно до {expiresDate}</div>
          <div style={{ marginTop:4, color:'#1e293b' }}>Создано {createdDate}</div>
        </div>
      </div>
    </div>
  );
}
