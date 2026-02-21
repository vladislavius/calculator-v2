'use client';

import { useCharterStore } from '../store/useCharterStore';

interface BoatDrink {
  id: number;
  name_en: string;
  name_ru?: string;
  price: number;
  included: boolean;
  category?: string;
}


const drinkRow = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px', borderRadius: 'var(--r-sm)',
  backgroundColor: active ? 'rgba(168,85,247,0.08)' : 'var(--os-surface)',
  border: `1.5px solid ${active ? 'var(--os-purple)' : 'var(--os-border)'}`,
  transition: 'all 0.15s', cursor: 'pointer',
});

const numInput: React.CSSProperties = {
  width: 70, padding: '3px 6px', textAlign: 'right',
  border: '1.5px solid var(--os-purple)', borderRadius: 4,
  backgroundColor: 'var(--os-card)', color: 'var(--os-purple)',
  fontSize: 12, fontWeight: 700, outline: 'none', flexShrink: 0,
};

const ctrBtn: React.CSSProperties = {
  width: 24, height: 24, border: '1.5px solid var(--os-border)',
  borderRadius: 4, backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)',
  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

export default function DrinksSection() {
  const addDrink = (drink: any) => {
    const exists = drinkOrders.find(o => String(o.drinkId) === String(drink.id));
    if (!exists) set({ drinkOrders: [...drinkOrders, { drinkId: String(drink.id), name: drink.name_en, quantity: 1, price: drink.price }] });
  };
  const removeDrink = (drinkId: any) => {
    set({ drinkOrders: drinkOrders.filter(o => String(o.drinkId) !== String(drinkId)) });
  };
  const boatDrinks    = useCharterStore(s => s.boatDrinks);
  const drinkOrders   = useCharterStore(s => s.drinkOrders);
  const set           = useCharterStore(s => s.set);
  const getPrice      = useCharterStore(s => s.getPrice);
  const setPrice      = useCharterStore(s => s.setPrice);

  const included = boatDrinks.filter(d => d.included);
  const paid     = boatDrinks.filter(d => !d.included && d.price >= 0);

  return (
    <div id="drinks" className="os-section">
      <div className="os-section__title" style={{ color: 'var(--os-purple)' }}>🍺 НАПИТКИ И АЛКОГОЛЬ</div>

      {/* Включённые напитки */}
      {included.length > 0 && (
        <div style={{ marginBottom: 10, padding: '8px 12px', backgroundColor: 'rgba(34,197,94,0.07)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: 'var(--os-green)' }}>✅ Включено: </span>
          {included.map((d, i) => (
            <span key={d.id} style={{ color: 'var(--os-text-1)' }}>{i > 0 ? ', ' : ''}{d.name_en}{d.name_ru && <span style={{ color: 'var(--os-text-3)', fontSize: 11 }}> ({d.name_ru})</span>}</span>
          ))}
        </div>
      )}

      {/* Платные напитки */}
      {paid.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--os-purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>➕ Добавить напитки:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {paid.map(drink => {
              const order = drinkOrders.find(o => String(o.drinkId) === String(drink.id));
              return (
                <div key={drink.id} style={drinkRow(!!order)}
                  onClick={() => { if (order) { removeDrink(String(drink.id)); } else { addDrink(drink); } }}>
                  {/* Кастомный чекбокс */}
                  <div style={{
                    width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${order ? 'var(--os-purple)' : 'var(--os-border)'}`,
                    backgroundColor: order ? 'var(--os-purple)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {order && <span style={{ color: '#0C1825', fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  {/* Название */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--os-text-1)' }}>{drink.name_en}</div>
                    {drink.name_ru && <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{drink.name_ru}</div>}
                  </div>
                  {/* Счётчик + цена */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {order && (
                      <>
                        <button style={ctrBtn} onClick={() => set({ drinkOrders: drinkOrders.map(d => String(d.drinkId) === String(drink.id) ? {...d, quantity: Math.max(1, d.quantity - 1)} : d) })}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--os-text-1)' }}>{order.quantity}</span>
                        <button style={ctrBtn} onClick={() => set({ drinkOrders: drinkOrders.map(d => String(d.drinkId) === String(drink.id) ? {...d, quantity: d.quantity + 1} : d) })}>+</button>
                      </>
                    )}
                    <input
                      type="number"
                      value={getPrice(`drink_${drink.id}`, drink.price)}
                      onChange={e => setPrice(`drink_${drink.id}`, Number(e.target.value))}
                      style={numInput}
                    />
                    <span style={{ fontSize: 11, color: 'var(--os-purple)', fontWeight: 600, flexShrink: 0 }}>฿</span>
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
