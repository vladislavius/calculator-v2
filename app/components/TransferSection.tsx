'use client';
import { useCharterStore } from '../store/useCharterStore';
import PriceInput from './ui/PriceInput';

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
    set,
  } = useCharterStore();

  const setDir = (dir: 'round_trip' | 'one_way') => {
    set({ transferDirection: dir });
    if (useOwnTransfer) {
      const p = dir === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay;
      set({ transferPickup: { ...transferPickup, price: p }, customTransferPrice: p });
    } else if (useOwnTransferVip) {
      const p = dir === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay;
      set({ transferPickup: { ...transferPickup, price: p }, customTransferPrice: p });
    }
  };

  const isNone = transferPickup.type === 'none';
  const isOwn  = String(transferPickup.type) === 'own';
  const isVip  = useOwnTransferVip;

  const rtPrice = transferDirection === 'round_trip';

  return (
    <div id="transfer" className="os-section">
      <div className="os-section__title" style={{ color: 'var(--os-green)' }}>🚗 ТРАНСФЕР</div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className={`os-dir-btn${transferDirection === 'round_trip' ? ' os-dir-btn--active' : ''}`}
          onClick={() => setDir('round_trip')}>
          🔄 Туда и обратно
        </button>
        <button className={`os-dir-btn${transferDirection === 'one_way' ? ' os-dir-btn--active' : ''}`}
          onClick={() => setDir('one_way')}>
          ➡️ В одну сторону
        </button>
      </div>

      {/* Transfer type options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 10 }}>

        {/* None */}
        <div className={`os-item-row${isNone ? ' os-item-row--active-green' : ''}`}
          onClick={() => { set({ transferPickup: { ...transferPickup, type: 'none', price: 0 }, useOwnTransfer: false, useOwnTransferVip: false, customTransferPrice: null }); }}>
          <div className={`os-radio${isNone ? ' os-radio--green' : ''}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>Не нужен</div>
            <div className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Клиент доберётся сам</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--os-green)', flexShrink: 0 }}>0 ฿</span>
        </div>

        {/* Standard */}
        <div className={`os-item-row${isOwn ? ' os-item-row--active-green' : ''}`}
          onClick={() => {
            const p = rtPrice ? ownTransferPriceRoundTrip : ownTransferPriceOneWay;
            set({ transferPickup: { ...transferPickup, type: 'own', price: p }, useOwnTransfer: true, useOwnTransferVip: false, customTransferPrice: p });
          }}>
          <div className={`os-radio${isOwn ? ' os-radio--green' : ''}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>🚐 Наш трансфер</div>
            <div className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Стандартный минивэн</div>
          </div>
          <PriceInput
            value={rtPrice ? ownTransferPriceRoundTrip : ownTransferPriceOneWay}
            onChange={v => {
              if (rtPrice) {
                set({ ownTransferPriceRoundTrip: v });
                if (isOwn) set({ transferPickup: { ...transferPickup, price: v }, customTransferPrice: v });
              } else {
                set({ ownTransferPriceOneWay: v });
                if (isOwn) set({ transferPickup: { ...transferPickup, price: v }, customTransferPrice: v });
              }
            }}
            accentColor="var(--os-green)"
            width={70}
          />
        </div>

        {/* VIP */}
        <div className={`os-item-row${isVip ? ' os-item-row--active-gold' : ''}`}
          onClick={() => {
            const p = rtPrice ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay;
            set({ transferPickup: { ...transferPickup, type: 'vip', price: p }, useOwnTransfer: false, useOwnTransferVip: true, customTransferPrice: p });
          }}>
          <div className={`os-radio${isVip ? ' os-radio--gold' : ''}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>👑 Наш трансфер VIP</div>
            <div className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)' }}>Премиум минивэн</div>
          </div>
          <PriceInput
            value={rtPrice ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay}
            onChange={v => {
              if (rtPrice) {
                set({ ownTransferVipPriceRoundTrip: v });
                if (isVip) set({ transferPickup: { ...transferPickup, price: v }, customTransferPrice: v });
              } else {
                set({ ownTransferVipPriceOneWay: v });
                if (isVip) set({ transferPickup: { ...transferPickup, price: v }, customTransferPrice: v });
              }
            }}
            accentColor="var(--os-gold)"
            width={70}
          />
        </div>
      </div>

      {/* Address */}
      {!isNone && (
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--os-text-2)' }}>📍 Адрес забора:</label>
          <input
            value={transferPickup.pickup}
            onChange={e => set({ transferPickup: { ...transferPickup, pickup: e.target.value } })}
            placeholder="Название отеля или адрес"
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--os-border)', borderRadius: 'var(--r-sm)', fontSize: 13, background: 'var(--os-input)', color: 'var(--os-text-1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Total */}
      {transferPickup.price > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>✓ Трансфер ({transferDirection === 'round_trip' ? 'туда-обратно' : 'в одну сторону'}):</span>
          <span style={{ fontWeight: 800, color: 'var(--os-green)', fontSize: 15 }}>{transferPickup.price.toLocaleString()} ฿</span>
        </div>
      )}
    </div>
  );
}
