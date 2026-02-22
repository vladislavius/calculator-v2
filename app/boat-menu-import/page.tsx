'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  set_name: string | null;
  set_name_ru: string | null;
  name_en: string;
  name_th: string | null;
  name_ru: string;
  category: string;
  price: number | null;
  price_unit: string;
  is_free: boolean;
}

interface ParsedMenu {
  menu_type: 'sets' | 'a_la_carte';
  menu_name: string;
  menu_name_ru: string;
  selection_rule: string;
  price_per_person: number | null;
  min_persons: number | null;
  notes: string;
  notes_ru: string;
  items: MenuItem[];
}

export default function BoatMenuImportPage() {
  
  const [partners, setPartners] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedBoatIdss, setSelectedBoatIdss] = useState<number[]>([]);
  const [menuText, setMenuText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenu | null>(null);
  const [existingMenus, setExistingMenus] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      loadBoats(selectedPartnerId);
    } else {
      setBoats([]);
      setSelectedBoatIds([]);
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    if (selectedBoatIds.length > 0) loadExistingMenus();
  }, [selectedBoatIds]);

  const loadPartners = async () => {
    const { data } = await supabase.from('partners').select('id, name').order('name');
    setPartners(data || []);
  };

  const loadBoats = async (partnerId: number) => {
    const { data } = await supabase.from('boats').select('id, name').eq('partner_id', partnerId).eq('active', true).order('name');
    setBoats(data || []);
    setSelectedBoatIds(null);
  };

  const loadExistingMenus = async () => {
    if (selectedBoatIds.length === 0) return;
    const { data } = await supabase
      .from('boat_menus')
      .select('*, boat_menu_items(*)')
      .in('boat_id', selectedBoatIds)
      .order('created_at', { ascending: false });
    setExistingMenus(data || []);
  };

  const parseMenu = async () => {
    if (!menuText.trim()) { setMessage('Вставьте текст меню'); return; }
    setParsing(true);
    setMessage('');
    try {
      const res = await fetch('/api/parse-boat-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: menuText })
      });
      const result = await res.json();
      if (result.success) {
        setParsedMenu(result.data);
        setMessage('Меню распознано! Проверьте и сохраните.');
      } else {
        setMessage('Ошибка: ' + result.error);
      }
    } catch (e: any) {
      setMessage('Ошибка: ' + e.message);
    }
    setParsing(false);
  };

  const saveMenu = async () => {
    if (!parsedMenu || selectedBoatIds.length === 0 || !selectedPartnerId) {
      setMessage('Выберите партнёра и лодку');
      return;
    }
    setSaving(true);
    try {
      let totalSaved = 0;
      for (const boatId of selectedBoatIds) {
        const { data: menu, error: menuErr } = await supabase
          .from('boat_menus')
          .insert({
            boat_id: boatId,
            partner_id: selectedPartnerId,
            menu_type: parsedMenu.menu_type,
            name: parsedMenu.menu_name,
            name_ru: parsedMenu.menu_name_ru,
            price_per_person: parsedMenu.price_per_person,
            min_persons: parsedMenu.min_persons,
            selection_rule: parsedMenu.selection_rule,
            notes: parsedMenu.notes,
            notes_ru: parsedMenu.notes_ru,
          })
          .select()
          .single();

        if (menuErr) throw menuErr;

        const items = parsedMenu.items.map((item, i) => ({
          menu_id: menu.id,
          set_name: item.set_name,
          set_name_ru: item.set_name_ru,
          name_en: item.name_en,
          name_th: item.name_th,
          name_ru: item.name_ru,
          category: item.category,
          price: item.price,
          price_unit: item.price_unit,
          is_free: item.is_free,
          sort_order: i,
        }));

        const { error: itemsErr } = await supabase.from('boat_menu_items').insert(items);
        if (itemsErr) throw itemsErr;
        totalSaved += items.length;
      }

      setMessage('Меню сохранено для ' + selectedBoatIds.length + ' лодок! ' + totalSaved + ' позиций.');
      setParsedMenu(null);
      setMenuText('');
      loadExistingMenus();
    } catch (e: any) {
      setMessage('Ошибка сохранения: ' + e.message);
    }
    setSaving(false);
  };

  const deleteMenu = async (menuId: number) => {
    if (!confirm('Удалить это меню?')) return;
    await supabase.from('boat_menu_items').delete().eq('menu_id', menuId);
    await supabase.from('boat_menus').delete().eq('id', menuId);
    loadExistingMenus();
    setMessage('Меню удалено');
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (!parsedMenu) return;
    const items = [...parsedMenu.items];
    (items[index] as any)[field] = value;
    setParsedMenu({ ...parsedMenu, items });
  };

  const removeItem = (index: number) => {
    if (!parsedMenu) return;
    const items = parsedMenu.items.filter((_, i) => i !== index);
    setParsedMenu({ ...parsedMenu, items });
  };

  const addItem = () => {
    if (!parsedMenu) return;
    setParsedMenu({
      ...parsedMenu,
      items: [...parsedMenu.items, {
        set_name: null, set_name_ru: null,
        name_en: '', name_th: null, name_ru: '',
        category: 'other', price: null, price_unit: 'piece', is_free: false
      }]
    });
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid var(--os-border)', borderRadius: 6, backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)', fontSize: 13, width: '100%' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--os-text-2)', marginBottom: 4, display: 'block' };
  const sets = parsedMenu ? [...new Set(parsedMenu.items.map(i => i.set_name).filter(Boolean))] : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Импорт меню лодки</h1>

      {/* Partner & Boat selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Партнёр</label>
          <select value={selectedPartnerId || ''} onChange={e => setSelectedPartnerId(Number(e.target.value) || null)} style={inputStyle}>
            <option value="">Выберите партнёра</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Лодка</label>
          <div style={{ border: '1px solid var(--os-border)', borderRadius: 6, padding: '8px', maxHeight: 150, overflowY: 'auto', backgroundColor: 'var(--os-card)' }}>
            {boats.length === 0 ? <span style={{ fontSize: 12, color: 'var(--os-text-2)' }}>Выберите партнёра</span> : (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--os-aqua)' }}>
                  <input type="checkbox" checked={selectedBoatIds.length === boats.length && boats.length > 0} onChange={e => setSelectedBoatIds(e.target.checked ? boats.map((b: any) => b.id) : [])} /> Все лодки
                </label>
                {boats.map((b: any) => (
                  <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={selectedBoatIds.includes(b.id)} onChange={e => {
                      if (e.target.checked) setSelectedBoatIds([...selectedBoatIds, b.id]);
                      else setSelectedBoatIds(selectedBoatIds.filter((id: number) => id !== b.id));
                    }} /> {b.name}
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Text input */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Текст меню (вставьте из документа партнёра)</label>
        <textarea
          value={menuText}
          onChange={e => setMenuText(e.target.value)}
          placeholder="Вставьте текст меню сюда...\n\nПример:\nSET 1\nTom Yum Kung\nFried Chicken\n\nSEAFOOD\nShrimp - 850 baht/kg"
          style={{ ...inputStyle, height: 200, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={parseMenu} disabled={parsing || !menuText.trim()}
          style={{ padding: '10px 24px', backgroundColor: 'var(--os-aqua)', color: '#0C1825', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: parsing ? 0.6 : 1 }}>
          {parsing ? 'Парсинг...' : 'Распознать меню'}
        </button>
      </div>

      {message && <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, backgroundColor: message.includes('Ошибка') ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,180,0.15)', color: message.includes('Ошибка') ? '#f87171' : 'var(--os-aqua)' }}>{message}</div>}

      {/* Parsed result */}
      {parsedMenu && (
        <div style={{ border: '1px solid var(--os-border)', borderRadius: 12, padding: 20, marginBottom: 24, backgroundColor: 'var(--os-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Результат парсинга</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: parsedMenu.menu_type === 'sets' ? 'rgba(139,92,246,0.2)' : 'rgba(0,212,180,0.2)', color: parsedMenu.menu_type === 'sets' ? '#a78bfa' : 'var(--os-aqua)' }}>
                {parsedMenu.menu_type === 'sets' ? 'Сеты' : 'А ля карт'}
              </span>
              {parsedMenu.selection_rule === 'pick_one' && <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>Выбор 1 сета</span>}
            </div>
          </div>

          {/* Menu info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div><label style={labelStyle}>Название EN</label><input value={parsedMenu.menu_name} onChange={e => setParsedMenu({...parsedMenu, menu_name: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Название RU</label><input value={parsedMenu.menu_name_ru} onChange={e => setParsedMenu({...parsedMenu, menu_name_ru: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Тип</label>
              <select value={parsedMenu.menu_type} onChange={e => setParsedMenu({...parsedMenu, menu_type: e.target.value as any})} style={inputStyle}>
                <option value="sets">Сеты</option>
                <option value="a_la_carte">А ля карт</option>
              </select>
            </div>
            <div><label style={labelStyle}>Правило выбора</label>
              <select value={parsedMenu.selection_rule} onChange={e => setParsedMenu({...parsedMenu, selection_rule: e.target.value})} style={inputStyle}>
                <option value="pick_one">Выбор 1 сета</option>
                <option value="pick_many">Несколько сетов</option>
                <option value="any">Без ограничений</option>
              </select>
            </div>
            {parsedMenu.price_per_person != null && (
              <div><label style={labelStyle}>Цена/чел (THB)</label><input type="number" value={parsedMenu.price_per_person || ''} onChange={e => setParsedMenu({...parsedMenu, price_per_person: Number(e.target.value) || null})} style={inputStyle} /></div>
            )}
            {parsedMenu.min_persons != null && (
              <div><label style={labelStyle}>Мин. персон</label><input type="number" value={parsedMenu.min_persons || ''} onChange={e => setParsedMenu({...parsedMenu, min_persons: Number(e.target.value) || null})} style={inputStyle} /></div>
            )}
          </div>

          {parsedMenu.notes_ru && <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontSize: 13, marginBottom: 16 }}>{parsedMenu.notes_ru}</div>}

          {/* Items table */}
          <div style={{ overflowX: 'auto' }}>
            {parsedMenu.menu_type === 'sets' && sets.length > 0 ? (
              sets.map(setName => (
                <div key={setName} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>{setName}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--os-border)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>EN</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>TH</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>RU</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>Категория</th>
                        <th style={{ padding: '6px 8px', width: 30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedMenu.items.filter(it => it.set_name === setName).map((item, idx) => {
                        const realIdx = parsedMenu.items.indexOf(item);
                        return (
                          <tr key={realIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '4px 8px' }}><input value={item.name_en} onChange={e => updateItem(realIdx, 'name_en', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                            <td style={{ padding: '4px 8px' }}><input value={item.name_th || ''} onChange={e => updateItem(realIdx, 'name_th', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                            <td style={{ padding: '4px 8px' }}><input value={item.name_ru} onChange={e => updateItem(realIdx, 'name_ru', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                            <td style={{ padding: '4px 8px' }}>
                              <select value={item.category} onChange={e => updateItem(realIdx, 'category', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }}>
                                {['thai','western','seafood','bbq','kids','drinks','dessert','other'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '4px 8px' }}><button onClick={() => removeItem(realIdx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--os-border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>EN</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>TH</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>RU</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>Цена</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>Ед.</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--os-text-2)' }}>Кат.</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--os-text-2)' }}>Free</th>
                    <th style={{ padding: '6px 8px', width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMenu.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 8px' }}><input value={item.name_en} onChange={e => updateItem(idx, 'name_en', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                      <td style={{ padding: '4px 8px' }}><input value={item.name_th || ''} onChange={e => updateItem(idx, 'name_th', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                      <td style={{ padding: '4px 8px' }}><input value={item.name_ru} onChange={e => updateItem(idx, 'name_ru', e.target.value)} style={{ ...inputStyle, padding: '4px 8px' }} /></td>
                      <td style={{ padding: '4px 8px' }}><input type="number" value={item.price || ''} onChange={e => updateItem(idx, 'price', Number(e.target.value) || null)} style={{ ...inputStyle, padding: '4px 8px', width: 80 }} /></td>
                      <td style={{ padding: '4px 8px' }}>
                        <select value={item.price_unit} onChange={e => updateItem(idx, 'price_unit', e.target.value)} style={{ ...inputStyle, padding: '4px 8px', width: 80 }}>
                          {['piece','kg','portion','person','set'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)} style={{ ...inputStyle, padding: '4px 8px', width: 90 }}>
                          {['thai','western','seafood','bbq','kids','drinks','dessert','other'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}><input type="checkbox" checked={item.is_free} onChange={e => updateItem(idx, 'is_free', e.target.checked)} /></td>
                      <td style={{ padding: '4px 8px' }}><button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={addItem} style={{ padding: '8px 16px', border: '1px solid var(--os-border)', borderRadius: 6, backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', cursor: 'pointer', fontSize: 13 }}>+ Добавить блюдо</button>
            <button onClick={saveMenu} disabled={saving || selectedBoatIds.length === 0}
              style={{ padding: '8px 24px', backgroundColor: 'var(--os-green, #22c55e)', color: '#000', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontSize: 13 }}>
              {saving ? 'Сохранение...' : 'Сохранить меню'}
            </button>
          </div>
        </div>
      )}

      {/* Existing menus */}
      {existingMenus.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Сохранённые меню ({existingMenus.length})</h2>
          {existingMenus.map(menu => (
            <div key={menu.id} style={{ border: '1px solid var(--os-border)', borderRadius: 10, padding: 16, marginBottom: 12, backgroundColor: 'var(--os-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{menu.name || menu.name_ru || 'Меню'}</span>
                  <span style={{ marginLeft: 12, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: menu.menu_type === 'sets' ? 'rgba(139,92,246,0.2)' : 'rgba(0,212,180,0.2)', color: menu.menu_type === 'sets' ? '#a78bfa' : 'var(--os-aqua)' }}>
                    {menu.menu_type === 'sets' ? 'Сеты' : 'А ля карт'}
                  </span>
                  {menu.price_per_person && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--os-aqua)' }}>{menu.price_per_person} THB/чел</span>}
                </div>
                <button onClick={() => deleteMenu(menu.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Удалить</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                {menu.boat_menu_items?.length || 0} позиций
                {menu.min_persons ? ' · мин. ' + menu.min_persons + ' чел' : ''}
                {menu.notes_ru ? ' · ' + menu.notes_ru : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
