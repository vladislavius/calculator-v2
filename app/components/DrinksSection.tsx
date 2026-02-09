'use client';

import { DrinkOrder } from '../lib/types';

interface BoatDrink {
  id: number;
  name_en: string;
  name_ru?: string;
  price: number;
  included: boolean;
}

interface DrinksSectionProps {
  boatDrinks: BoatDrink[];
  drinkOrders: DrinkOrder[];
  addDrink: (drink: BoatDrink) => void;
  removeDrink: (drinkId: string) => void;
  setDrinkOrders: (orders: DrinkOrder[]) => void;
  getPrice: (key: string, defaultPrice: number) => number;
  setPrice: (key: string, value: number) => void;
}

export default function DrinksSection({ boatDrinks, drinkOrders, addDrink, removeDrink, setDrinkOrders, getPrice, setPrice }: DrinksSectionProps) {
  return (
    <div id="drinks" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fdf4ff', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>🍺 НАПИТКИ И АЛКОГОЛЬ</h3>
      
      {boatDrinks.filter(d => d.included).length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #86efac' }}>
          <span style={{ fontWeight: '600', color: '#166534' }}>Включено: </span>
          {boatDrinks.filter(d => d.included).map((d, i) => (
            <span key={d.id}>{i > 0 ? ', ' : ''}{d.name_en}</span>
          ))}
        </div>
      )}

      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#7c3aed', fontWeight: '500' }}>➕ Добавить алкоголь?</p>

      {boatDrinks.filter(d => !d.included && d.price > 0).length > 0 && (
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
          <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#7c3aed' }}>С яхты:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {boatDrinks.filter(d => !d.included && d.price > 0).map(drink => {
              const order = drinkOrders.find(o => String(o.drinkId) === String(drink.id));
              return (
                <div key={drink.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: order ? '#f3e8ff' : '#fafafa', borderRadius: '8px', border: order ? '2px solid #a855f7' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={!!order} 
                      onChange={() => {
                        if (order) {
                          removeDrink(String(drink.id));
                        } else {
                          addDrink(drink);
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{drink.name_en}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => setDrinkOrders(drinkOrders.map(d => String(d.drinkId) === String(drink.id) ? {...d, quantity: Math.max(1, d.quantity - 1)} : d))} style={{ width: '24px', height: '24px', border: '1px solid #7c3aed', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{order.quantity}</span>
                        <button onClick={() => setDrinkOrders(drinkOrders.map(d => String(d.drinkId) === String(drink.id) ? {...d, quantity: d.quantity + 1} : d))} style={{ width: '24px', height: '24px', border: '1px solid #7c3aed', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                      </div>
                    )}
                    <span style={{ fontWeight: '600', color: '#7c3aed', fontSize: '14px', minWidth: '80px', textAlign: 'right' }}>
                      {order ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={getPrice(`drink_${drink.id}`, drink.price) * order.quantity}
                            onChange={(e) => setPrice(`drink_${drink.id}`, Math.round(Number(e.target.value) / order.quantity))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '70px', padding: '2px 4px', border: '1px solid #a855f7', borderRadius: '4px', textAlign: 'right', fontSize: '13px' }}
                          /> THB
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          +<input
                            type="number"
                            value={getPrice(`drink_${drink.id}`, drink.price)}
                            onChange={(e) => setPrice(`drink_${drink.id}`, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '60px', padding: '2px 4px', border: '1px solid #a855f7', borderRadius: '4px', textAlign: 'right', fontSize: '13px' }}
                          /> THB
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {boatDrinks.length === 0 && (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о напитках не указана в контракте</p>
      )}
    </div>
  );
}
