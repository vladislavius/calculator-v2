'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useIsMobile } from '../../hooks/useIsMobile';

type OfferItem = {
  id: string; name: string; nameRu: string;
  quantity: number; unit: string; price: number; total: number; category: string;
};
type Offer = {
  id: string; boat_name: string; search_date: string; guests: number;
  time_slot: string; total_client: number; lang: string;
  snapshot: any; notes: string; created_at: string; expires_at: string;
};

const SLOT: Record<string,string> = { full_day:'Полный день', half_day_am:'Полдня (утро)', half_day_pm:'Полдня (вечер)', overnight:'Ночёвка', custom:'Индивидуально' };
const CAT: Record<string,string> = { boat:'⛵ Аренда яхты', extra:'👥 Доп. гости', catering:'🍽️ Питание', drink:'🍹 Напитки', toy:'🏄 Водные развлечения', watersport:'🌊 Водные услуги', service:'🎉 Доп. услуги', fee:'🎫 Парковые сборы', transfer:'🚐 Трансфер' };
const UNIT: Record<string,string> = { fix:'fix', pax:'pax', hour:'h', day:'day', trip:'trip', pcs:'pcs' };

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer]   = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/offers?id=${id}`).then(r=>r.json()).then(d => {
      if (d.error) setError(d.error); else setOffer(d);
      setLoading(false);
    });
  }, [id]);

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  if (loading) return <div style={{minHeight:'100vh',background:'#0C1825',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b'}}>Загрузка...</div>;
  if (error||!offer) return (
    <div style={{minHeight:'100vh',background:'#0C1825',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{fontSize:40}}>😔</div>
      <div style={{color:'#e2e8f0',fontSize:18,fontWeight:700}}>Предложение не найдено</div>
      <div style={{color:'#64748b',fontSize:13}}>{error==='Offer expired'?'Срок действия истёк':'Ссылка недействительна'}</div>
    </div>
  );

  const snap = offer.snapshot||{};
  const boat = snap.boat||{};
  const items: OfferItem[] = snap.items||[];
  const cats = Array.from(new Set(items.map(i=>i.category)));
  const expires = new Date(offer.expires_at).toLocaleDateString('ru-RU');
  const dateFmt = offer.search_date ? new Date(offer.search_date+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const usd = Math.round((offer.total_client||0)/34).toLocaleString();
  const rub = Math.round((offer.total_client||0)*2.7).toLocaleString();

  const sec: React.CSSProperties = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px', marginBottom:10 };
  const th: React.CSSProperties = { fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', padding:'4px 8px', textAlign:'left' };
  const td: React.CSSProperties = { fontSize:12, color:'#cbd5e1', padding:'6px 8px', borderTop:'1px solid rgba(255,255,255,0.04)' };

  return (
    <div style={{minHeight:'100vh',background:'#0C1825',color:'#e2e8f0',fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{background:'rgba(10,16,24,0.95)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,backdropFilter:'blur(10px)'}}>
        <span style={{fontSize:18,fontWeight:800,color:'#0891b2',letterSpacing:1}}>ONLYSEA</span>
        <button onClick={copyLink} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:copied?'rgba(0,212,180,0.15)':'rgba(255,255,255,0.05)',color:copied?'#00d4b4':'#e2e8f0',cursor:'pointer',fontSize:12,fontWeight:600}}>
          {copied?'✅ Скопировано!':'🔗 Скопировать ссылку'}
        </button>
      </div>

      <div style={{maxWidth:720,margin:'0 auto',padding: isMobile ? '10px 10px 24px' : '16px 20px 32px'}}>

        {/* Фото + заголовок в одном блоке */}
        <div style={{...sec, padding:0, overflow:'hidden', marginBottom:10}}>
          {boat.main_photo_url && (
            <img src={boat.main_photo_url} alt={offer.boat_name} style={{width:'100%',height:isMobile?180:280,objectFit:'cover',display:'block',borderRadius:'12px 12px 0 0'}} />
          )}
          <div style={{padding:'12px 16px'}}>
            <div style={{fontSize:22,fontWeight:800}}>{offer.boat_name}</div>
            {boat.partner_name && <div style={{fontSize:12,color:'#64748b',marginBottom:8}}>{boat.partner_name}</div>}
            {/* Инфо в одну строку */}
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>
              {[
                {icon:'📅', val: dateFmt},
                {icon:'👥', val:`${offer.guests} чел.`},
                {icon:'⏱', val: SLOT[offer.time_slot]||offer.time_slot},
                ...(boat.length_ft?[{icon:'📏',val:`${boat.length_ft} ft`}]:[]),
                ...(boat.route_name_ru||boat.route_name?[{icon:'🗺',val:boat.route_name_ru||boat.route_name}]:[]),
                ...(boat.max_guests?[{icon:'👤',val:`до ${boat.max_guests}`}]:[]),
                ...(boat.cabin_count>0?[{icon:'🛏',val:`${boat.cabin_count} каюты`}]:[]),
              ].map((x,i)=>(
                <span key={i} style={{fontSize:12,padding:'3px 10px',borderRadius:20,background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>
                  {x.icon} {x.val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Включено в стоимость */}
        {(() => {
          const boatOptions = snap.boatOptions || [];
          const boatDrinks = snap.boatDrinks || [];
          const includedOptions = boatOptions.filter((o) => o.status === 'included');
          const includedDrinks = boatDrinks.filter((d) => d.included);
          if (includedOptions.length === 0 && includedDrinks.length === 0) return null;
          return (
            <div style={sec}>
              <div style={{fontSize:13,fontWeight:700,color:'#22c55e',marginBottom:10}}>✅ Включено в стоимость</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {includedOptions.map((opt, i) => (
                  <span key={'o'+i} style={{fontSize:12,padding:'4px 10px',borderRadius:20,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#86efac'}}>
                    {opt.option_name_ru || opt.option_name || opt.name_en || opt.name}
                  </span>
                ))}
                {includedDrinks.map((d, i) => (
                  <span key={'d'+i} style={{fontSize:12,padding:'4px 10px',borderRadius:20,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#86efac'}}>
                    {d.name_ru || d.name_en}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Позиции по категориям */}
        {cats.map(cat => {
          const ci = items.filter(i=>i.category===cat);
          if (!ci.length) return null;
          return (
            <div key={cat} style={sec}>
              <div style={{fontSize:13,fontWeight:700,color:'#0891b2',marginBottom:8}}>{CAT[cat]||cat}</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={th}>Название</th>
                    <th style={{...th,textAlign:'center'}}>Кол-во</th>
                    <th style={{...th,textAlign:'right'}}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {ci.map((item,i)=>(
                    <tr key={i}>
                      <td style={td}>{item.nameRu||item.name}</td>
                      <td style={{...td,textAlign:'center',color:'#64748b'}}>{item.quantity} {UNIT[item.unit]||item.unit}</td>
                      <td style={{...td,textAlign:'right',fontWeight:600,color:'#e2e8f0'}}>{item.total.toLocaleString()} ฿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Итого */}
        <div style={{...sec,border:'1px solid rgba(8,145,178,0.25)',background:'rgba(8,145,178,0.06)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#0891b2',marginBottom:10}}>💰 Итого к оплате</div>
          {cats.map(cat=>{
            const t=items.filter(i=>i.category===cat).reduce((s,i)=>s+i.total,0);
            if(!t) return null;
            return (
              <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <span style={{color:'#64748b'}}>{CAT[cat]||cat}</span>
                <span style={{fontWeight:600}}>+{t.toLocaleString()} ฿</span>
              </div>
            );
          })}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,padding:'12px 16px',background:'rgba(8,145,178,0.12)',borderRadius:10}}>
            <span style={{fontSize:15,fontWeight:800}}>ИТОГО</span>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:isMobile?22:28,fontWeight:900,color:'#0891b2'}}>{(offer.total_client||0).toLocaleString()} ฿</div>
              <div style={{fontSize:11,color:'#475569'}}>≈ {usd} USD · ≈ {rub} ₽</div>
            </div>
          </div>
        </div>

        {/* Заметки */}
        {offer.notes && (
          <div style={sec}>
            <div style={{fontSize:12,fontWeight:700,color:'#0891b2',marginBottom:6}}>📝 Примечания</div>
            <div style={{fontSize:12,color:'#94a3b8',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{offer.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:'center',marginTop:16,fontSize:11,color:'#334155'}}>
          ONLYSEA · Phuket · Действительно до {expires}
        </div>
      </div>
    </div>
  );
}
