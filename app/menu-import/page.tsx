'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface MenuSet {
  name: string;
  name_ru: string;
  category: string;
  price: number | null;
  dishes: string[];
  dishes_ru: string[];
}

interface ParsedMenu {
  menu_name: string;
  sets: MenuSet[];
  notes: string;
  notes_ru?: string;
}

export default function MenuImportPage() {
  const [menuText, setMenuText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenu | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedBoatId, setSelectedBoatId] = useState<number | null>(null);
  const [menuType, setMenuType] = useState<'included' | 'paid'>('included');
  const [pricePerPerson, setPricePerPerson] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Load partners on mount
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    const { data } = await getSupabase().from('partners').select('id, name').order('name');
    if (data) setPartners(data);
  };

  const loadBoats = async (partnerId: number) => {
    const { data } = await getSupabase().from('boats').select('id, name').eq('partner_id', partnerId).order('name');
    if (data) setBoats(data);
  };

  const handlePartnerChange = (partnerId: number) => {
    setSelectedPartnerId(partnerId);
    setSelectedBoatId(null);
    loadBoats(partnerId);
  };

  const parseMenu = async () => {
    if (!selectedPartnerId) {
      alert('⚠️ Сначала выберите партнёра!');
      return;
    }
    if (menuText.length < 50) {
      alert('Вставьте текст меню (минимум 50 символов)');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: menuText })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Parse failed');
      }

      setParsedMenu(result.data);
      setMessage(`✅ Распознано ${result.data.sets?.length || 0} сетов`);
    } catch (error: any) {
      setMessage('❌ Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMenu = async () => {
    if (!parsedMenu || !selectedPartnerId) {
      alert('Выберите партнёра и распарсите меню');
      return;
    }

    setLoading(true);

    try {
      // Check if menu already exists
      const { data: existingMenu } = await supabase
        .from('partner_menus')
        .select('id')
        .eq('partner_id', selectedPartnerId)
        .is('boat_id', selectedBoatId ? selectedBoatId : null)
        .maybeSingle();

      let menuId: number;

      if (existingMenu) {
        // Delete old sets and update menu
        await getSupabase().from('menu_sets').delete().eq('menu_id', existingMenu.id);
        
        const { error: updateError } = await supabase
          .from('partner_menus')
          .update({
            name: parsedMenu.menu_name || 'Menu',
            type: menuType,
            price_per_person: menuType === 'paid' ? pricePerPerson : null,
            notes: parsedMenu.notes,
            conditions: parsedMenu.notes,
          conditions_ru: parsedMenu.notes_ru || parsedMenu.notes
          })
          .eq('id', existingMenu.id);

        if (updateError) throw updateError;
        menuId = existingMenu.id;
        console.log('Updated existing menu:', menuId);
      } else {
        // Create new menu
        const { data: menu, error: menuError } = await supabase
          .from('partner_menus')
          .insert({
            partner_id: selectedPartnerId,
            boat_id: selectedBoatId,
            name: parsedMenu.menu_name || 'Menu',
            type: menuType,
            price_per_person: menuType === 'paid' ? pricePerPerson : null,
            notes: parsedMenu.notes,
            conditions: parsedMenu.notes,
          conditions_ru: parsedMenu.notes_ru || parsedMenu.notes
          })
          .select('id')
          .single();

        if (menuError) throw menuError;
        menuId = menu.id;
        console.log('Created new menu:', menuId);
      }

      // Create sets
      for (let i = 0; i < parsedMenu.sets.length; i++) {
        const set = parsedMenu.sets[i];
        await getSupabase().from('menu_sets').insert({
          menu_id: menuId,
          name: set.name,
          name_ru: set.name_ru,
          category: set.category,
          price: set.price,
          dishes: set.dishes,
          dishes_ru: set.dishes_ru,
          sort_order: i
        });
      }

      setMessage(`✅ Меню ${existingMenu ? 'обновлено' : 'сохранено'}! ${parsedMenu.sets.length} сетов.`);
      setParsedMenu(null);
      setMenuText('');
    } catch (error: any) {
      setMessage('❌ Ошибка сохранения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    thai: '🇹🇭 Тайская',
    western: '🍝 Западная',
    vegetarian: '🥗 Вегетарианская',
    kids: '👶 Детская',
    seafood: '🦐 Морепродукты',
    bbq: '🍖 BBQ',
    other: '📋 Другое'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🍽️ Импорт меню</h1>
        <a href="/partners" style={{ color: '#2563eb' }}>← Назад к партнёрам</a>
      </div>

      {/* Partner/Boat Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Партнёр *</label>
          <select
            value={selectedPartnerId || ''}
            onChange={(e) => handlePartnerChange(Number(e.target.value))}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="">Выберите партнёра</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Лодка (опционально)</label>
          <select
            value={selectedBoatId || ''}
            onChange={(e) => setSelectedBoatId(e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            disabled={!selectedPartnerId}
          >
            <option value="">Для всех лодок партнёра</option>
            {boats.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Тип меню</label>
          <select
            value={menuType}
            onChange={(e) => setMenuType(e.target.value as 'included' | 'paid')}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="included">✅ Включено в стоимость</option>
            <option value="paid">💰 Платное меню</option>
          </select>
        </div>
        {menuType === 'paid' && (
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Цена за персону (THB)</label>
            <input
              type="number"
              value={pricePerPerson || ''}
              onChange={(e) => setPricePerPerson(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              placeholder="500"
            />
          </div>
        )}
      </div>

      {/* Input */}
      {!parsedMenu && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            📋 Вставьте текст меню (из PDF/Word)
          </label>
          <textarea
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            style={{ width: '100%', height: '300px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}
            placeholder="Thai Set 1&#10;Tom Yum Goong&#10;Chicken with Cashew Nuts&#10;Fried Chicken Wings&#10;Steamed Rice&#10;Dessert of the Day&#10;&#10;Thai Set 2&#10;..."
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>{menuText.length} символов</span>
            <button
              onClick={parseMenu}
              disabled={loading || menuText.length < 50}
              style={{
                padding: '10px 24px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {loading ? '⏳ Анализ...' : '🚀 Распознать меню'}
            </button>
          </div>
        </div>
      )}

      {/* Parsed Result */}
      {parsedMenu && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
              📋 {parsedMenu.menu_name || 'Меню'} — {parsedMenu.sets.length} сетов
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setParsedMenu(null); setMenuText(''); }}
                style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                ← Назад
              </button>
              <button
                onClick={saveMenu}
                disabled={loading || !selectedPartnerId}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                💾 Сохранить меню
              </button>
            </div>
          </div>

          {parsedMenu.notes && (
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              ⚠️ {parsedMenu.notes}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {parsedMenu.sets.map((set, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '15px' }}>{set.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>{set.name_ru}</p>
                  </div>
                  <span style={{ padding: '4px 8px', backgroundColor: '#e5e7eb', borderRadius: '4px', fontSize: '12px' }}>
                    {categoryLabels[set.category] || set.category}
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {set.dishes.map((dish, di) => (
                    <li key={di} style={{ marginBottom: '4px' }}>
                      {dish}
                      {set.dishes_ru[di] && (
                        <span style={{ color: '#9ca3af' }}> — {set.dishes_ru[di]}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {set.price && (
                  <p style={{ marginTop: '8px', fontWeight: '600', color: '#059669' }}>
                    💰 {set.price.toLocaleString()} THB/чел
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: message.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          borderRadius: '8px',
          color: message.startsWith('✅') ? '#065f46' : '#991b1b'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
