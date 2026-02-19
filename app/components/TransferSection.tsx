'use client';

import { TransferOrder } from '../lib/types';


interface TransferSectionProps {
  transferDirection: 'round_trip' | 'one_way';
  setTransferDirection: (v: 'round_trip' | 'one_way') => void;
  transferPickup: TransferOrder;
  setTransferPickup: (v: TransferOrder) => void;
  useOwnTransfer: boolean;
  setUseOwnTransfer: (v: boolean) => void;
  useOwnTransferVip: boolean;
  setUseOwnTransferVip: (v: boolean) => void;
  ownTransferPriceRoundTrip: number;
  setOwnTransferPriceRoundTrip: (v: number) => void;
  ownTransferPriceOneWay: number;
  setOwnTransferPriceOneWay: (v: number) => void;
  ownTransferVipPriceRoundTrip: number;
  setOwnTransferVipPriceRoundTrip: (v: number) => void;
  ownTransferVipPriceOneWay: number;
  setOwnTransferVipPriceOneWay: (v: number) => void;
  transferOptionsDB: any[];
  customTransferPrice: number | null;
  setCustomTransferPrice: (v: number | null) => void;
  customPrices: Record<string, number>;
  setPrice: (key: string, value: number) => void;
}

export default function TransferSection({
  transferDirection, setTransferDirection,
  transferPickup, setTransferPickup,
  useOwnTransfer, setUseOwnTransfer,
  useOwnTransferVip, setUseOwnTransferVip,
  ownTransferPriceRoundTrip, setOwnTransferPriceRoundTrip,
  ownTransferPriceOneWay, setOwnTransferPriceOneWay,
  ownTransferVipPriceRoundTrip, setOwnTransferVipPriceRoundTrip,
  ownTransferVipPriceOneWay, setOwnTransferVipPriceOneWay,
  transferOptionsDB, customTransferPrice, setCustomTransferPrice,
  customPrices, setPrice
}: TransferSectionProps) {
  return (
    <div id="transfer" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#0d2137', borderRadius: '16px', border: '1px solid rgba(46,204,113,0.2)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#2ECC71' }}>🚗 ТРАНСФЕР</h3>
      
      {/* Direction selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => {
            setTransferDirection('round_trip');
            if (useOwnTransfer) {
              setTransferPickup({...transferPickup, price: ownTransferPriceRoundTrip});
              setCustomTransferPrice(ownTransferPriceRoundTrip);
            } else if (useOwnTransferVip) {
              setTransferPickup({...transferPickup, price: ownTransferVipPriceRoundTrip});
              setCustomTransferPrice(ownTransferVipPriceRoundTrip);
            } else if (transferPickup.type !== 'none' && transferPickup.type !== 'own') {
              const opt = transferOptionsDB.find((o: any) => String(o.id) === String(transferPickup.type));
              if (opt) {
                const newPrice = customPrices[`transfer_${opt.id}`] !== undefined 
                  ? customPrices[`transfer_${opt.id}`] 
                  : (Number(opt.price_round_trip) || 0);
                setTransferPickup({...transferPickup, price: newPrice});
                setCustomTransferPrice(newPrice);
                setPrice(`transfer_${opt.id}`, Number(opt.price_round_trip) || 0);
              }
            }
          }}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: transferDirection === 'round_trip' ? '2px solid #2ECC71' : '1px solid rgba(255,255,255,0.1)', backgroundColor: transferDirection === 'round_trip' ? '#0e3a2a' : '#0f2337', cursor: 'pointer', fontWeight: '600' }}
        >
          🔄 Туда и обратно
        </button>
        <button
          onClick={() => {
            setTransferDirection('one_way');
            if (useOwnTransfer) {
              setTransferPickup({...transferPickup, price: ownTransferPriceOneWay});
              setCustomTransferPrice(ownTransferPriceOneWay);
            } else if (useOwnTransferVip) {
              setTransferPickup({...transferPickup, price: ownTransferVipPriceOneWay});
              setCustomTransferPrice(ownTransferVipPriceOneWay);
            } else if (transferPickup.type !== 'none' && transferPickup.type !== 'own') {
              const opt = transferOptionsDB.find((o: any) => String(o.id) === String(transferPickup.type));
              if (opt) {
                const newPrice = Number(opt.price_one_way) || 0;
                setTransferPickup({...transferPickup, price: newPrice});
                setCustomTransferPrice(newPrice);
                setPrice(`transfer_${opt.id}`, Number(opt.price_one_way) || 0);
              }
            }
          }}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: transferDirection === 'one_way' ? '2px solid #2ECC71' : '1px solid rgba(255,255,255,0.1)', backgroundColor: transferDirection === 'one_way' ? '#0e3a2a' : '#0f2337', cursor: 'pointer', fontWeight: '600' }}
        >
          ➡️ Только в одну сторону
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        {/* No transfer */}
        <div 
          onClick={() => {
            setTransferPickup({...transferPickup, type: 'none', price: 0});
            setUseOwnTransfer(false);
            setCustomTransferPrice(null);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: transferPickup.type === 'none' ? '#0e3a2a' : '#0f2337', borderRadius: '10px', border: transferPickup.type === 'none' ? '2px solid #2ECC71' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: transferPickup.type === 'none' ? '6px solid #2ECC71' : '2px solid rgba(255,255,255,0.2)', backgroundColor: '#132840' }} />
            <div>
              <span style={{ fontWeight: '600' }}>Не нужен</span>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Клиент доберётся сам</p>
            </div>
          </div>
          <span style={{ fontWeight: '600', color: '#2ECC71' }}>0 THB</span>
        </div>

        {/* Own transfer */}
        <div 
          onClick={() => {
            const price = transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay;
            setTransferPickup({...transferPickup, type: 'own', price});
            setUseOwnTransfer(true);
            setUseOwnTransferVip(false);
            setCustomTransferPrice(price);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: String(transferPickup.type) === 'own' ? '#0e3a2a' : '#0f2337', borderRadius: '10px', border: String(transferPickup.type) === 'own' ? '2px solid #2ECC71' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: String(transferPickup.type) === 'own' ? '6px solid #2ECC71' : '2px solid rgba(255,255,255,0.2)', backgroundColor: '#132840' }} />
            <div>
              <span style={{ fontWeight: '600' }}>🚐 Наш трансфер</span>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Стандартный минивэн</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (transferDirection === 'round_trip') {
                  setOwnTransferPriceRoundTrip(val);
                  if (String(transferPickup.type) === 'own') {
                    setTransferPickup({...transferPickup, price: val});
                    setCustomTransferPrice(val);
                  }
                } else {
                  setOwnTransferPriceOneWay(val);
                  if (String(transferPickup.type) === 'own') {
                    setTransferPickup({...transferPickup, price: val});
                    setCustomTransferPrice(val);
                  }
                }
              }}
              style={{ width: '70px', padding: '4px 6px', border: '1px solid #22c55e', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}
            />
            <span style={{ fontWeight: '600', color: '#2ECC71' }}>THB</span>
          </div>
        </div>

        {/* VIP Transfer */}
        <div
          onClick={() => {
            const price = transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay;
            setTransferPickup({...transferPickup, type: 'vip', price});
            setUseOwnTransfer(false);
            setUseOwnTransferVip(true);
            setCustomTransferPrice(price);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: useOwnTransferVip ? '#1a2a0a' : '#0f2337', borderRadius: '10px', border: useOwnTransferVip ? '2px solid #F4C430' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: useOwnTransferVip ? '6px solid #F4C430' : '2px solid rgba(255,255,255,0.2)', backgroundColor: '#132840' }} />
            <div>
              <span style={{ fontWeight: '600' }}>👑 Наш трансфер VIP</span>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Премиум минивэн</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (transferDirection === 'round_trip') {
                  setOwnTransferVipPriceRoundTrip(val);
                  if (useOwnTransferVip) {
                    setTransferPickup({...transferPickup, price: val});
                    setCustomTransferPrice(val);
                  }
                } else {
                  setOwnTransferVipPriceOneWay(val);
                  if (useOwnTransferVip) {
                    setTransferPickup({...transferPickup, price: val});
                    setCustomTransferPrice(val);
                  }
                }
              }}
              style={{ width: '70px', padding: '4px 6px', border: '1px solid #f59e0b', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}
            />
            <span style={{ fontWeight: '600', color: '#F4C430' }}>THB</span>
          </div>
        </div>
      </div>

      {/* Address input */}
      {transferPickup.type !== 'none' && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#132840', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#cbd5e1', fontSize: '14px' }}>📍 Адрес забора:</label>
          <input
            value={transferPickup.pickup}
            onChange={(e) => setTransferPickup({...transferPickup, pickup: e.target.value})}
            placeholder="Название отеля или адрес"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '14px' }}
          />
        </div>
      )}

      {/* Total */}
      {transferPickup.price > 0 && (
        <div style={{ marginTop: '16px', padding: '14px 16px', backgroundColor: '#0e3a2a', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600' }}>✓ Трансфер ({transferDirection === 'round_trip' ? 'round trip' : 'one way'}):</span>
          <span style={{ fontWeight: '700', color: '#2ECC71', fontSize: '20px' }}>{transferPickup.price.toLocaleString()} THB</span>
        </div>
      )}
    </div>
  );
}
