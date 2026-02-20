'use client';
import { useState } from 'react';
import { useCharterStore } from '../store/useCharterStore';
import { useUserRole } from '../hooks/useUserRole';
import { calculateTotals } from '../lib/calculateTotals';

export default function SummarySection({ generatePDF, generateWhatsApp }: { generatePDF:()=>void; generateWhatsApp:()=>void }) {
  const { isAdmin } = useUserRole();
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerUrl, setOfferUrl] = useState('');
  const [offerCopied, setOfferCopied] = useState(false);
  if (!boat) return null;

  const generateOffer = async () => {
    setOfferLoading(true);
    try {
      const totals = calculateTotals({
        selectedBoat: boat,
        selectedExtras: s.selectedExtras,
        cateringOrders: s.cateringOrders,
        drinkOrders: s.drinkOrders,
        transferPickup: s.transferPickup,
        transferDropoff: s.transferDropoff,
        selectedServices: s.selectedServices,
        selectedToys: s.selectedToys,
        selectedFees: s.selectedFees,
        selectedPartnerWatersports: s.selectedPartnerWatersports,
        boatMarkup: s.boatMarkup,
        markupMode: s.markupMode,
        fixedMarkup: s.fixedMarkup,
        partnerMarkups: s.partnerMarkups,
        customPrices: s.customPrices,
        landingFee: s.landingFee,
        landingEnabled: s.landingEnabled,
        defaultParkFee: s.defaultParkFee,
        defaultParkFeeEnabled: s.defaultParkFeeEnabled,
        defaultParkFeeAdults: s.defaultParkFeeAdults,
        defaultParkFeeChildren: s.defaultParkFeeChildren,
        transferPrice: s.transferPrice,
        transferMarkup: s.transferMarkup,
        corkageFee: s.corkageFee,
        extraAdults: s.extraAdults,
        children3to11: s.children3to11,
        childrenUnder3: s.childrenUnder3,
        adults: s.adults,
        customAdultPrice: s.customAdultPrice,
        customChildPrice: s.customChildPrice,
      });

      // Строим lines для отображения
      const lines = [
        { label: '⛵ Аренда лодки', val: totals.boatBase || 0 },
        { label: '🎫 Сборы', val: totals.fees || 0 },
        { label: '🍽️ Питание', val: totals.catering || 0 },
        { label: '🍹 Напитки', val: totals.drinks || 0 },
        { label: '🏄 Водные развлечения', val: (totals.toys || 0) + (totals.partnerWatersports || 0) },
        { label: '🎉 Персонал', val: totals.services || 0 },
        { label: '🚐 Трансфер', val: totals.transfer || 0 },
        { label: '📈 Наценка', val: totals.markup || 0 },
      ].filter(l => l.val > 0);

      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boat_id: boat.boat_id,
          boat_name: boat.boat_name,
          search_date: s.searchDate,
          guests: s.adults + s.extraAdults + s.children3to11 + s.childrenUnder3,
          time_slot: s.timeSlot,
          total_client: totals.totalClient || 0,
          total_agent: totals.totalAgent || 0,
          lang: s.lang,
          notes: s.customNotes,
          snapshot: { boat, lines },
        }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/offer/${data.id}`;
        setOfferUrl(url);
        await navigator.clipboard.writeText(url);
        setOfferCopied(true);
        setTimeout(() => setOfferCopied(false), 3000);
      }
    } catch(e) {
      console.error('Ошибка создания предложения:', e);
    }
    setOfferLoading(false);
  };

  const totals = calculateTotals({
    selectedBoat:s.selectedBoat, selectedExtras:s.selectedExtras, cateringOrders:s.cateringOrders,
    drinkOrders:s.drinkOrders, selectedToys:s.selectedToys, selectedServices:s.selectedServices,
    selectedFees:s.selectedFees, selectedPartnerWatersports:s.selectedPartnerWatersports,
    transferPickup:s.transferPickup, transferDropoff:s.transferDropoff, transferPrice:s.transferPrice,
    transferMarkup:s.transferMarkup, landingEnabled:s.landingEnabled, landingFee:s.landingFee,
    defaultParkFeeEnabled:s.defaultParkFeeEnabled, defaultParkFee:s.defaultParkFee,
    defaultParkFeeAdults:s.defaultParkFeeAdults, defaultParkFeeChildren:s.defaultParkFeeChildren,
    corkageFee:s.corkageFee, extraAdults:s.extraAdults, children3to11:s.children3to11,
    childrenUnder3:s.childrenUnder3, adults:s.adults, customAdultPrice:s.customAdultPrice,
    customChildPrice:s.customChildPrice, boatMarkup:s.boatMarkup, fixedMarkup:s.fixedMarkup,
    markupMode:s.markupMode, markupPercent:s.markupPercent, customPrices:s.customPrices,
  });

  const base         = boat.client_price || boat.base_price || 0;
  const markupAmt    = s.markupMode === 'fixed' ? s.fixedMarkup : Math.round(base * s.boatMarkup / 100);
  const markupPct    = s.markupMode === 'fixed' ? (base > 0 ? (s.fixedMarkup/base*100).toFixed(1) : '0') : s.boatMarkup;
  const guestSurcharge = s.extraAdults*(s.customAdultPrice??boat.extra_pax_price??0) + s.children3to11*(s.customChildPrice??Math.round((boat.extra_pax_price??0)*0.5));
  const usd          = ((totals.totalClient||0)/34).toLocaleString('en-US',{maximumFractionDigits:0});
  const rub          = ((totals.totalClient||0)*2.7).toLocaleString('ru-RU',{maximumFractionDigits:0});

  const lines = [
    { label:'🛥️ Яхта',          val: base,                           show: true },
    { label:'👥 Доп. гости',     val: guestSurcharge,                 show: guestSurcharge > 0 },
    { label:'🎫 Сборы',          val: totals.fees,                    show: totals.fees > 0 },
    { label:'🍽️ Питание',        val: totals.catering,                show: totals.catering > 0 },
    { label:'🍹 Напитки',        val: totals.drinks,                  show: totals.drinks > 0 },
    { label:'🤿 Водные развл.',   val: totals.toys,                    show: totals.toys > 0 },
    { label:'🌊 Партн. водные',  val: totals.partnerWatersports||0,   show: (totals.partnerWatersports||0) > 0 },
    { label:'🎉 Персонал',       val: totals.services,                show: totals.services > 0 },
    { label:'🚐 Трансфер',       val: totals.transfer,                show: totals.transfer > 0 },
    { label:'➕ Доп. опции',     val: totals.extras,                  show: totals.extras > 0 },
  ];

  return (
    <div id="summary" className="os-summary">
      <div className="os-summary__header">
        <div className="os-summary__title">📊 Итоговый расчёт</div>
        <span className="os-tag os-tag--aqua">{s.adults+s.extraAdults+s.children3to11+s.childrenUnder3} гостей</span>
      </div>

      {isAdmin && <div className="os-markup-bar">
        <div className="os-markup-label">Наценка менеджера</div>
        <div className="os-markup-mode">
          <button className={`os-markup-mode-btn${s.markupMode==='percent'?' active':''}`} onClick={()=>s.set({markupMode:'percent'})}>% авто</button>
          <button className={`os-markup-mode-btn${s.markupMode==='fixed'?' active':''}`}   onClick={()=>s.set({markupMode:'fixed'})}>฿ фиксированно</button>
        </div>
        {s.markupMode === 'percent' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <input type="number" min="0" max="500" value={s.boatMarkup} onChange={e=>s.set({boatMarkup:Number(e.target.value)||0})} className="os-markup-input" style={{ width:90 }} />
              <span style={{ fontSize:28, fontWeight:800, color:'var(--os-text-2)' }}>%</span>
            </div>
            <input type="range" min="0" max="200" value={s.boatMarkup} onChange={e=>s.set({boatMarkup:Number(e.target.value)})} style={{ width:'100%', accentColor:'var(--os-aqua)', cursor:'pointer' }} />
            <div className="os-markup-hint">= <span>+{markupAmt.toLocaleString()} ฿</span> к цене лодки</div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="number" min="0" step="500" value={s.fixedMarkup} onChange={e=>s.set({fixedMarkup:Number(e.target.value)||0})} className="os-markup-input" style={{ width:140 }} />
            <span style={{ fontSize:18, fontWeight:700, color:'var(--os-text-2)' }}>฿</span>
            <div className="os-markup-hint" style={{ marginTop:0 }}>≈ <span>{markupPct}%</span></div>
          </div>
        )}
      </div>}

      <div className="os-summary-lines">
        {lines.filter(l=>l.show).map(l=>(
          <div key={l.label} className="os-summary-line">
            <span>{l.label}</span>
            <span className="os-summary-line__val">{l.val.toLocaleString()} ฿</span>
          </div>
        ))}
        {isAdmin && <div className="os-summary-line markup">
          <span>📈 Наценка</span>
          <span className="os-summary-line__val">+{markupAmt.toLocaleString()} ฿</span>
        </div>}
        {isAdmin && <div className="os-summary-line profit">
          <span style={{ fontSize:11, color:'var(--os-text-3)' }}>Агент (себестоимость)</span>
          <span className="os-summary-line__val" style={{ fontSize:12 }}>{(boat.calculated_agent_total||boat.base_price||0).toLocaleString()} ฿</span>
        </div>}
      </div>

      <div className="os-summary-total">
        <div className="os-summary-total__label">💰 Клиент платит</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
          <span className="os-summary-total__amount">{(totals.totalClient||0).toLocaleString()}</span>
          <span className="os-summary-total__unit">฿</span>
        </div>
      </div>

      <div className="os-summary-currency">≈ {usd} USD · ≈ {rub} RUB</div>

      <div style={{ padding:'12px 20px', borderTop:'1px solid var(--os-border)' }}>
        <div className="os-markup-label" style={{ marginBottom:6 }}>📝 Заметки для клиента</div>
        <textarea value={s.customNotes} onChange={e=>s.set({customNotes:e.target.value})} placeholder="Особые пожелания, кэш-ваучер, детали встречи..." className="os-notes-input" />
      </div>

      <div className="os-summary-actions">
        <button onClick={generatePDF}       className="os-action-btn os-action-btn--pdf">📄 PDF</button>
        <button onClick={generateWhatsApp}  className="os-action-btn os-action-btn--wa">💬 WhatsApp</button>
        <button onClick={generateOffer} disabled={offerLoading}
          className="os-action-btn"
          style={{ backgroundColor: offerCopied ? 'var(--os-green)' : '#7c3aed', opacity: offerLoading ? 0.7 : 1 }}>
          {offerLoading ? '⏳...' : offerCopied ? '✅ Скопировано!' : '🔗 Ссылка'}
        </button>
        {offerUrl && (
          <div style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 6,
            backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            fontSize: 11, color: '#a78bfa', wordBreak: 'break-all', cursor: 'pointer' }}
            onClick={() => { navigator.clipboard.writeText(offerUrl); setOfferCopied(true); setTimeout(()=>setOfferCopied(false),2000); }}>
            🔗 {offerUrl}
          </div>
        )}
      </div>
    </div>
  );
}
