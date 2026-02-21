'use client';
import { useCharterStore } from '../store/useCharterStore';

import { TransferOrder } from '../lib/types';


const tRow = (active: boolean, color = 'var(--os-green)'): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 'var(--r-sm)',
  backgroundColor: active ? `${color}12` : 'var(--os-surface)',
  border: `1.5px solid ${active ? color : 'var(--os-border)'}`,
  transition: 'all 0.15s', cursor: 'pointer',
});

const numInput = (color = 'var(--os-green)'): React.CSSProperties => ({
  width: 75, padding: '3px 6px', textAlign: 'right',
  border: `1.5px solid ${color}`, borderRadius: 4,
  backgroundColor: 'var(--os-card)', color,
  fontSize: 12, fontWeight: 700, outline: 'none', flexShrink: 0,
});

const dirBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)',
  border: `1.5px solid ${active ? 'var(--os-green)' : 'var(--os-border)'}`,
  backgroundColor: active ? 'rgba(34,197,94,0.1)' : 'var(--os-surface)',
  color: active ? 'var(--os-green)' : 'var(--os-text-2)',
  cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
});

export default function TransferSection() {
  const {
    transferDirection = 'round_trip',
    transferPickup = { type: 'none', pickup: '', dropoff: 'Marina', price: 0, notes: '' },
    useOwnTransfer = false,
    useOwnTransferVip = false,
    ownTransferPriceRoundTrip = 0,
    ownTransferPriceOneWay = 0,
    ownTransferVipPriceRoundTrip = 0,
    ownTransferVipPriceOneWay = 0,
    transferOptionsDB = [],
    customTransferPrice = null,
    customPrices = {},
    set, setPrice,
  } = useCharterStore();

  const setTransferDirection = (v) => set({ transferDirection: v });
  const setTransferPickup = (v) => set({ transferPickup: v });
  const setUseOwnTransfer = (v) => set({ useOwnTransfer: v });
  const setUseOwnTransferVip = (v) => set({ useOwnTransferVip: v });
  const setOwnTransferPriceRoundTrip = (v) => set({ ownTransferPriceRoundTrip: v });
  const setOwnTransferPriceOneWay = (v) => set({ ownTransferPriceOneWay: v });
  const setOwnTransferVipPriceRoundTrip = (v) => set({ ownTransferVipPriceRoundTrip: v });
  const setOwnTransferVipPriceOneWay = (v) => set({ ownTransferVipPriceOneWay: v });
  const setCustomTransferPrice = (v) => set({ customTransferPrice: v });

  const isNone = transferPickup.type === 'none';
  const isOwn  = String(transferPickup.type) === 'own';
  const isVip  = useOwnTransferVip;

  return (
    <div id="transfer" className="os-section">
      <div className="os-section__title" style={{ color: 'var(--os-green)' }}>🚗 ТРАНСФЕР</div>

      {/* Направление */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button style={dirBtn(transferDirection === 'round_trip')}
          onClick={() => {
            setTransferDirection('round_trip');
            if (useOwnTransfer) { setTransferPickup({...transferPickup, price: ownTransferPriceRoundTrip}); setCustomTransferPrice(ownTransferPriceRoundTrip); }
            else if (useOwnTransferVip) { setTransferPickup({...transferPickup, price: ownTransferVipPriceRoundTrip}); setCustomTransferPrice(ownTransferVipPriceRoundTrip); }
          }}>
          🔄 Туда и обратно
        </button>
        <button style={dirBtn(transferDirection === 'one_way')}
          onClick={() => {
            setTransferDirection('one_way');
            if (useOwnTransfer) { setTransferPickup({...transferPickup, price: ownTransferPriceOneWay}); setCustomTransferPrice(ownTransferPriceOneWay); }
            else if (useOwnTransferVip) { setTransferPickup({...transferPickup, price: ownTransferVipPriceOneWay}); setCustomTransferPrice(ownTransferVipPriceOneWay); }
          }}>
          ➡️ Только в одну сторону
        </button>
      </div>

      {/* Варианты трансфера: 2 колонки */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>

        {/* Не нужен */}
        <div style={tRow(isNone)} onClick={() => { setTransferPickup({...transferPickup, type: 'none', price: 0}); setUseOwnTransfer(false); setUseOwnTransferVip(false); setCustomTransferPrice(null); }}>
          <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isNone ? 'var(--os-green)' : 'var(--os-border)'}`, backgroundColor: isNone ? 'var(--os-green)' : 'transparent' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>Не нужен</div>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Клиент доберётся сам</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--os-green)', flexShrink: 0 }}>0 ฿</span>
        </div>

        {/* Стандарт */}
        <div style={tRow(isOwn)} onClick={() => { const p = transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay; setTransferPickup({...transferPickup, type: 'own', price: p}); setUseOwnTransfer(true); setUseOwnTransferVip(false); setCustomTransferPrice(p); }}>
          <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isOwn ? 'var(--os-green)' : 'var(--os-border)'}`, backgroundColor: isOwn ? 'var(--os-green)' : 'transparent' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>🚐 Наш трансфер</div>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Стандартный минивэн</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <input type="number"
              value={transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay}
              onChange={e => { const v = Number(e.target.value); if (transferDirection === 'round_trip') { setOwnTransferPriceRoundTrip(v); if (isOwn) { setTransferPickup({...transferPickup, price: v}); setCustomTransferPrice(v); } } else { setOwnTransferPriceOneWay(v); if (isOwn) { setTransferPickup({...transferPickup, price: v}); setCustomTransferPrice(v); } } }}
              style={numInput()} />
            <span style={{ fontSize: 11, color: 'var(--os-green)', fontWeight: 600 }}>฿</span>
          </div>
        </div>

        {/* VIP */}
        <div style={tRow(isVip, 'var(--os-gold)')} onClick={() => { const p = transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay; setTransferPickup({...transferPickup, type: 'vip', price: p}); setUseOwnTransfer(false); setUseOwnTransferVip(true); setCustomTransferPrice(p); }}>
          <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isVip ? 'var(--os-gold)' : 'var(--os-border)'}`, backgroundColor: isVip ? 'var(--os-gold)' : 'transparent' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>👑 Наш трансфер VIP</div>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Премиум минивэн</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <input type="number"
              value={transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay}
              onChange={e => { const v = Number(e.target.value); if (transferDirection === 'round_trip') { setOwnTransferVipPriceRoundTrip(v); if (isVip) { setTransferPickup({...transferPickup, price: v}); setCustomTransferPrice(v); } } else { setOwnTransferVipPriceOneWay(v); if (isVip) { setTransferPickup({...transferPickup, price: v}); setCustomTransferPrice(v); } } }}
              style={numInput('var(--os-gold)')} />
            <span style={{ fontSize: 11, color: 'var(--os-gold)', fontWeight: 600 }}>฿</span>
          </div>
        </div>

      </div>

      {/* Адрес */}
      {!isNone && (
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--os-text-2)' }}>📍 Адрес забора:</label>
          <input
            value={transferPickup.pickup}
            onChange={e => setTransferPickup({...transferPickup, pickup: e.target.value})}
            placeholder="Название отеля или адрес"
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--os-border)', borderRadius: 'var(--r-sm)', fontSize: 13, backgroundColor: 'var(--os-input)', color: 'var(--os-text-1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Итог */}
      {transferPickup.price > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>✓ Трансфер ({transferDirection === 'round_trip' ? 'туда-обратно' : 'в одну сторону'}):</span>
          <span style={{ fontWeight: 800, color: 'var(--os-green)', fontSize: 15 }}>{transferPickup.price.toLocaleString()} ฿</span>
        </div>
      )}
    </div>
  );
}
