'use client';

import { useCharterStore } from '../store/useCharterStore';
import Counter from './ui/Counter';
import PriceInput from './ui/PriceInput';

export default function DrinksSection() {
  const boatDrinks  = useCharterStore(s => s.boatDrinks);
  const drinkOrders = useCharterStore(s => s.drinkOrders);
  const set         = useCharterStore(s => s.set);
  const getPrice    = useCharterStore(s => s.getPrice);
  const setPrice    = useCharterStore(s => s.setPrice);

  const included = boatDrinks.filter(d => d.included);
  const paid     = boatDrinks.filter(d => !d.included && d.price >= 0);

  const addDrink = (drink: any) => {
    if (!drinkOrders.find(o => o.drinkId === Number(drink.id))) {
      set({ drinkOrders: [...drinkOrders, { drinkId: Number(drink.id), name: drink.name_en, quantity: 1, price: drink.price, unit: 'pcs' }] });
    }
  };
  const removeDrink = (drinkId: any) => {
    set({ drinkOrders: drinkOrders.filter(o => o.drinkId !== Number(drinkId)) });
  };
  const changeQty = (drinkId: number, qty: number) => {
    set({ drinkOrders: drinkOrders.map(d => d.drinkId === drinkId ? { ...d, quantity: qty } : d) });
  };

  return (
    <div id="drinks" className="os-section">
      <div className="os-section__title" style={{ color: 'var(--os-purple)' }}>🍺 НАПИТКИ И АЛКОГОЛЬ</div>

      {/* Included drinks */}
      {included.length > 0 && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.07)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: 'var(--os-green)' }}>✅ Включено: </span>
          {included.map((d, i) => (
            <span key={d.id} style={{ color: 'var(--os-text-1)' }}>
              {i > 0 ? ', ' : ''}
              {d.name_en}
              {d.name_ru && <span className="os-hide-mobile" style={{ color: 'var(--os-text-3)', fontSize: 11 }}> ({d.name_ru})</span>}
            </span>
          ))}
        </div>
      )}

      {/* Paid drinks */}
      {paid.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--os-purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>➕ Добавить напитки:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {paid.map(drink => {
              const order = drinkOrders.find(o => o.drinkId === Number(drink.id));
              return (
                <div
                  key={drink.id}
                  className={`os-item-row${order ? ' os-item-row--active-purple' : ''}`}
                  onClick={() => order ? removeDrink(String(drink.id)) : addDrink(drink)}
                >
                  {/* Checkbox */}
                  <div className={`os-check${order ? ' os-check--purple' : ''}`}>
                    {order && <span className="os-check__tick">✓</span>}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>{drink.name_en}</div>
                    {drink.name_ru && <div className="os-hide-mobile" style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{drink.name_ru}</div>}
                  </div>

                  {/* Counter + price */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {order && (
                      <Counter
                        value={order.quantity}
                        onChange={qty => changeQty(Number(drink.id), qty)}
                        min={1}
                      />
                    )}
                    <PriceInput
                      value={getPrice(`drink_${drink.id}`, drink.price)}
                      onChange={v => setPrice(`drink_${drink.id}`, v)}
                      accentColor="var(--os-purple)"
                      width={65}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {boatDrinks.length === 0 && (
        <p style={{ color: 'var(--os-text-3)', fontStyle: 'italic', fontSize: 13 }}>Информация о напитках не указана в контракте</p>
      )}
    </div>
  );
}
