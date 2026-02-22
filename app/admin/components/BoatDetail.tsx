'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';

type Route = { id: number; name: string; name_ru: string; duration_hours: number; code: string };
type RoutePrice = {
  id: number; boat_id: number; route_id: number; time_slot: string; season: string;
  base_price: number; base_pax: number; extra_pax_price: number;
  fuel_surcharge: number; agent_price: number; client_price: number;
  valid_from: string; valid_to: string;
};
type BoatOption = {
  id: number; option_id: number; status: string; price: number; available: boolean;
  options_catalog: { name_en: string; name_ru: string } | null;
};
type CatalogItem = { id: number; name_en: string; name_ru: string };

const inp: React.CSSProperties = {
  padding: '6px 10px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 4,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none', width: '100%',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 12px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});
const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--os-border)', fontSize: 12, color: 'var(--os-text-1)' };
const hcell: React.CSSProperties = { ...cell, fontWeight: 700, fontSize: 11, color: 'var(--os-text-3)', textTransform: 'uppercase', backgroundColor: 'var(--os-surface)' };
const STATUS_COLOR: Record<string, string> = {
  included: 'var(--os-green)', paid_optional: 'var(--os-gold)', excluded: 'var(--os-red)',
};

function MenuTab({ boatId, partnerId, boatMenus, setBoatMenus, menuText, setMenuText, parsingMenu, setParsingMenu, parsedMenu, setParsedMenu, savingMenu, setSavingMenu, msg, setMsg }: any) {
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [editMenu, setEditMenu] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadMenus = async () => {
    const { data } = await sb.from('boat_menus').select('*, boat_menu_items(*)').eq('boat_id', boatId).order('created_at', { ascending: false });
    setBoatMenus(data || []);
  };

  useEffect(() => { loadMenus(); }, [boatId]);

  const parseMenu = async () => {
    if (!menuText.trim()) return;
    setParsingMenu(true);
    try {
      const res = await fetch('/api/parse-boat-menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: menuText }) });
      const result = await res.json();
      if (result.success) { setParsedMenu(result.data); setMsg('✅ Меню распознано'); }
      else setMsg('❌ ' + result.error);
    } catch (e: any) { setMsg('❌ ' + e.message); }
    setParsingMenu(false);
  };

  const saveNewMenu = async () => {
    if (!parsedMenu) return;
    setSavingMenu(true);
    try {
      const { data: menu, error: menuErr } = await sb.from('boat_menus').insert({
        boat_id: boatId, partner_id: partnerId,
        menu_type: parsedMenu.menu_type, name: parsedMenu.menu_name, name_ru: parsedMenu.menu_name_ru,
        price_per_person: parsedMenu.price_per_person, min_persons: parsedMenu.min_persons,
        selection_rule: parsedMenu.selection_rule, notes: parsedMenu.notes, notes_ru: parsedMenu.notes_ru,
      }).select().single();
      if (menuErr) throw menuErr;
      const items = parsedMenu.items.map((item: any, i: number) => ({
        menu_id: menu.id, set_name: item.set_name, set_name_ru: item.set_name_ru,
        name_en: item.name_en, name_th: item.name_th, name_ru: item.name_ru,
        category: item.category, price: item.price, price_unit: item.price_unit,
        is_free: item.is_free, sort_order: i,
      }));
      await sb.from('boat_menu_items').insert(items);
      setMsg('✅ Сохранено ' + items.length + ' позиций');
      setParsedMenu(null); setMenuText(''); loadMenus();
    } catch (e: any) { setMsg('❌ ' + e.message); }
    setSavingMenu(false);
  };

  const deleteMenu = async (menuId: number) => {
    if (!confirm('Удалить это меню со всеми блюдами?')) return;
    await sb.from('boat_menu_items').delete().eq('menu_id', menuId);
    await sb.from('boat_menus').delete().eq('id', menuId);
    if (editingMenuId === menuId) { setEditingMenuId(null); setEditMenu(null); setEditItems([]); }
    loadMenus(); setMsg('✅ Меню удалено');
  };

  const startEdit = (menu: any) => {
    setEditingMenuId(menu.id);
    setEditMenu({ name: menu.name || '', name_ru: menu.name_ru || '', menu_type: menu.menu_type, price_per_person: menu.price_per_person, min_persons: menu.min_persons, selection_rule: menu.selection_rule || 'any', notes: menu.notes || '', notes_ru: menu.notes_ru || '' });
    setEditItems((menu.boat_menu_items || []).map((i: any) => ({ ...i })).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
  };

  const cancelEdit = () => { setEditingMenuId(null); setEditMenu(null); setEditItems([]); };

  const saveEdit = async () => {
    if (!editMenu || !editingMenuId) return;
    setSavingEdit(true);
    try {
      await sb.from('boat_menus').update({
        name: editMenu.name, name_ru: editMenu.name_ru, menu_type: editMenu.menu_type,
        price_per_person: editMenu.price_per_person, min_persons: editMenu.min_persons,
        selection_rule: editMenu.selection_rule, notes: editMenu.notes, notes_ru: editMenu.notes_ru,
      }).eq('id', editingMenuId);

      // Delete all old items and re-insert
      await sb.from('boat_menu_items').delete().eq('menu_id', editingMenuId);
      if (editItems.length > 0) {
        const items = editItems.map((item: any, i: number) => ({
          menu_id: editingMenuId, set_name: item.set_name || null, set_name_ru: item.set_name_ru || null,
          name_en: item.name_en, name_th: item.name_th || null, name_ru: item.name_ru || null,
          category: item.category || 'other', price: item.price || null, price_unit: item.price_unit || 'piece',
          is_free: item.is_free || false, sort_order: i,
        }));
        await sb.from('boat_menu_items').insert(items);
      }
      setMsg('✅ Меню обновлено'); cancelEdit(); loadMenus();
    } catch (e: any) { setMsg('❌ ' + e.message); }
    setSavingEdit(false);
  };

  const updateEditItem = (idx: number, field: string, value: any) => {
    const items = [...editItems];
    items[idx] = { ...items[idx], [field]: value };
    setEditItems(items);
  };

  const removeEditItem = (idx: number) => setEditItems(editItems.filter((_: any, i: number) => i !== idx));

  const addEditItem = () => setEditItems([...editItems, { set_name: '', set_name_ru: '', name_en: '', name_th: '', name_ru: '', category: 'other', price: null, price_unit: 'piece', is_free: false }]);

  const moveItem = (idx: number, dir: number) => {
    const items = [...editItems];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    setEditItems(items);
  };

  const inp: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--os-border)', borderRadius: 4, backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)', fontSize: 12, width: '100%', outline: 'none' };
  const catOpts = ['thai','western','seafood','bbq','kids','drinks','dessert','other'];
  const unitOpts = ['piece','kg','portion','person','set'];
  const catColors: Record<string,string> = { thai:'#f59e0b', western:'#3b82f6', seafood:'#06b6d4', bbq:'#ef4444', kids:'#ec4899', drinks:'#8b5cf6', dessert:'#f472b6', other:'#6b7280' };

  return (
    <div>
      {/* ══ Parse new menu ══ */}
      <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--os-border)', borderRadius: 8, backgroundColor: 'var(--os-surface)' }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--os-aqua)' }}>🤖 Парсинг нового меню</h4>
        <textarea value={menuText} onChange={e => setMenuText(e.target.value)} placeholder="Вставьте текст меню..."
          style={{ width: '100%', height: 100, padding: 10, border: '1px solid var(--os-border)', borderRadius: 6, backgroundColor: 'var(--os-card)', color: 'var(--os-text-1)', fontSize: 13, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={parseMenu} disabled={parsingMenu || !menuText.trim()}
            style={{ padding: '6px 16px', backgroundColor: 'var(--os-aqua)', color: '#0C1825', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12, opacity: parsingMenu ? 0.5 : 1 }}>
            {parsingMenu ? '⏳ Парсинг...' : '🤖 Распознать'}
          </button>
          {parsedMenu && <button onClick={saveNewMenu} disabled={savingMenu}
            style={{ padding: '6px 16px', backgroundColor: 'var(--os-green)', color: '#000', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
            💾 Сохранить новое меню
          </button>}
        </div>

        {/* Parsed preview */}
        {parsedMenu && (
          <div style={{ marginTop: 12, border: '1px solid var(--os-aqua)', borderRadius: 6, padding: 12, backgroundColor: 'rgba(0,201,255,0.04)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={parsedMenu.menu_name} onChange={e => setParsedMenu({...parsedMenu, menu_name: e.target.value})} style={{...inp, width: 200, fontWeight: 600}} placeholder="Название EN" />
              <input value={parsedMenu.menu_name_ru || ''} onChange={e => setParsedMenu({...parsedMenu, menu_name_ru: e.target.value})} style={{...inp, width: 200}} placeholder="Название RU" />
              <select value={parsedMenu.menu_type} onChange={e => setParsedMenu({...parsedMenu, menu_type: e.target.value})} style={{...inp, width: 100}}>
                <option value="sets">Сеты</option><option value="a_la_carte">А ля карт</option>
              </select>
              <select value={parsedMenu.selection_rule || 'any'} onChange={e => setParsedMenu({...parsedMenu, selection_rule: e.target.value})} style={{...inp, width: 100}}>
                <option value="pick_one">1 сет</option><option value="pick_many">Несколько</option><option value="any">Любой</option>
              </select>
              <input type="number" value={parsedMenu.price_per_person || ''} onChange={e => setParsedMenu({...parsedMenu, price_per_person: Number(e.target.value)||null})} style={{...inp, width: 80}} placeholder="THB/чел" />
              <input type="number" value={parsedMenu.min_persons || ''} onChange={e => setParsedMenu({...parsedMenu, min_persons: Number(e.target.value)||null})} style={{...inp, width: 70}} placeholder="Мин.чел" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={parsedMenu.notes || ''} onChange={e => setParsedMenu({...parsedMenu, notes: e.target.value})} style={{...inp, flex: 1}} placeholder="Notes EN" />
              <input value={parsedMenu.notes_ru || ''} onChange={e => setParsedMenu({...parsedMenu, notes_ru: e.target.value})} style={{...inp, flex: 1}} placeholder="Примечания RU" />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--os-border)' }}>
                {parsedMenu.menu_type === 'sets' && <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Сет</th>}
                <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>EN</th>
                <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>TH</th>
                <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>RU</th>
                <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Кат</th>
                {parsedMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Цена</th>}
                {parsedMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Ед</th>}
                {parsedMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Free</th>}
                <th style={{ width: 20 }}></th>
              </tr></thead>
              <tbody>
                {parsedMenu.items.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {parsedMenu.menu_type === 'sets' && <td style={{ padding: '2px 4px' }}><input value={item.set_name||''} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],set_name:e.target.value};setParsedMenu({...parsedMenu,items});}} style={{...inp,width:70,color:'#a78bfa'}} /></td>}
                    <td style={{ padding: '2px 4px' }}><input value={item.name_en} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],name_en:e.target.value};setParsedMenu({...parsedMenu,items});}} style={inp} /></td>
                    <td style={{ padding: '2px 4px' }}><input value={item.name_th||''} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],name_th:e.target.value};setParsedMenu({...parsedMenu,items});}} style={{...inp,color:'var(--os-text-3)'}} /></td>
                    <td style={{ padding: '2px 4px' }}><input value={item.name_ru||''} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],name_ru:e.target.value};setParsedMenu({...parsedMenu,items});}} style={inp} /></td>
                    <td style={{ padding: '2px 4px' }}><select value={item.category} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],category:e.target.value};setParsedMenu({...parsedMenu,items});}} style={{...inp,width:75}}>{catOpts.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                    {parsedMenu.menu_type !== 'sets' && <td style={{padding:'2px 4px'}}><input type="number" value={item.price||''} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],price:Number(e.target.value)||null};setParsedMenu({...parsedMenu,items});}} style={{...inp,width:60,textAlign:'right'}} /></td>}
                    {parsedMenu.menu_type !== 'sets' && <td style={{padding:'2px 4px'}}><select value={item.price_unit||'piece'} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],price_unit:e.target.value};setParsedMenu({...parsedMenu,items});}} style={{...inp,width:65}}>{unitOpts.map(u=><option key={u} value={u}>{u}</option>)}</select></td>}
                    {parsedMenu.menu_type !== 'sets' && <td style={{padding:'2px 4px',textAlign:'center'}}><input type="checkbox" checked={item.is_free||false} onChange={e=>{const items=[...parsedMenu.items];items[idx]={...items[idx],is_free:e.target.checked};setParsedMenu({...parsedMenu,items});}} /></td>}
                    <td style={{padding:'2px 4px'}}><button onClick={()=>{setParsedMenu({...parsedMenu,items:parsedMenu.items.filter((_:any,i:number)=>i!==idx)});}} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:13}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={()=>setParsedMenu({...parsedMenu,items:[...parsedMenu.items,{set_name:'',name_en:'',name_th:'',name_ru:'',category:'other',price:null,price_unit:'piece',is_free:false}]})} style={{marginTop:6,fontSize:11,color:'var(--os-aqua)',background:'none',border:'none',cursor:'pointer'}}>+ Добавить блюдо</button>
          </div>
        )}
      </div>

      {/* ══ Existing menus ══ */}
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--os-text-1)' }}>Сохранённые меню ({boatMenus.length})</h4>
      {boatMenus.length === 0 && <p style={{ color: 'var(--os-text-3)', fontSize: 13 }}>Нет меню. Вставьте текст выше и распознайте.</p>}

      {boatMenus.map((menu: any) => {
        const isEditing = editingMenuId === menu.id;
        const items = isEditing ? editItems : (menu.boat_menu_items || []).sort((a:any,b:any) => (a.sort_order||0)-(b.sort_order||0));
        const sets = [...new Set(items.map((i: any) => i.set_name).filter(Boolean))];
        const mData = isEditing ? editMenu : menu;

        return (
          <div key={menu.id} style={{ border: '1px solid ' + (isEditing ? 'var(--os-aqua)' : 'var(--os-border)'), borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: isEditing ? 'rgba(0,201,255,0.03)' : 'var(--os-surface)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={editMenu.name} onChange={e => setEditMenu({...editMenu, name: e.target.value})} style={{...inp, width: 180, fontWeight: 600}} placeholder="Название EN" />
                  <input value={editMenu.name_ru} onChange={e => setEditMenu({...editMenu, name_ru: e.target.value})} style={{...inp, width: 180}} placeholder="Название RU" />
                  <select value={editMenu.menu_type} onChange={e => setEditMenu({...editMenu, menu_type: e.target.value})} style={{...inp, width: 95}}>
                    <option value="sets">Сеты</option><option value="a_la_carte">А ля карт</option>
                  </select>
                  <select value={editMenu.selection_rule} onChange={e => setEditMenu({...editMenu, selection_rule: e.target.value})} style={{...inp, width: 90}}>
                    <option value="pick_one">1 сет</option><option value="pick_many">Несколько</option><option value="any">Любой</option>
                  </select>
                  <input type="number" value={editMenu.price_per_person || ''} onChange={e => setEditMenu({...editMenu, price_per_person: Number(e.target.value)||null})} style={{...inp, width: 75}} placeholder="THB/чел" />
                  <input type="number" value={editMenu.min_persons || ''} onChange={e => setEditMenu({...editMenu, min_persons: Number(e.target.value)||null})} style={{...inp, width: 65}} placeholder="Мин" />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{menu.name || menu.name_ru || 'Меню'}</strong>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, backgroundColor: menu.menu_type==='sets'?'rgba(139,92,246,0.2)':'rgba(0,212,180,0.2)', color: menu.menu_type==='sets'?'#a78bfa':'var(--os-aqua)' }}>
                    {menu.menu_type==='sets'?'Сеты':'А ля карт'}
                  </span>
                  {menu.price_per_person > 0 && <span style={{ fontSize: 11, color: 'var(--os-gold)' }}>{menu.price_per_person} THB/чел</span>}
                  {menu.min_persons > 0 && <span style={{ fontSize: 11, color: 'var(--os-text-2)' }}>мин {menu.min_persons}</span>}
                  {menu.selection_rule === 'pick_one' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>выбор 1</span>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {isEditing ? (
                  <>
                    <button onClick={saveEdit} disabled={savingEdit} style={{ padding: '4px 12px', backgroundColor: 'var(--os-green)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: 11 }}>{savingEdit ? '⏳' : '💾 Сохранить'}</button>
                    <button onClick={cancelEdit} style={{ padding: '4px 12px', backgroundColor: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--os-text-1)' }}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(menu)} style={{ padding: '4px 12px', backgroundColor: 'rgba(0,201,255,0.1)', border: '1px solid rgba(0,201,255,0.3)', color: 'var(--os-aqua)', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✏️ Редактировать</button>
                    <button onClick={() => deleteMenu(menu.id)} style={{ padding: '4px 12px', background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>🗑️</button>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {isEditing ? (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input value={editMenu.notes} onChange={e => setEditMenu({...editMenu, notes: e.target.value})} style={{...inp, flex: 1}} placeholder="Notes EN" />
                <input value={editMenu.notes_ru} onChange={e => setEditMenu({...editMenu, notes_ru: e.target.value})} style={{...inp, flex: 1}} placeholder="Примечания RU" />
              </div>
            ) : (
              (menu.notes_ru || menu.notes) && <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 8, padding: '4px 8px', backgroundColor: 'rgba(251,191,36,0.06)', borderRadius: 4 }}>{menu.notes_ru || menu.notes}</div>
            )}

            {/* Items table */}
            {isEditing ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--os-border)' }}>
                    <th style={{ width: 30, padding: '3px 2px', color: 'var(--os-text-3)', fontSize: 10 }}>#</th>
                    {editMenu.menu_type === 'sets' && <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Сет</th>}
                    {editMenu.menu_type === 'sets' && <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Сет RU</th>}
                    <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>EN</th>
                    <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>TH</th>
                    <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>RU</th>
                    <th style={{ textAlign: 'left', padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Кат</th>
                    {editMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Цена</th>}
                    {editMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Ед</th>}
                    {editMenu.menu_type !== 'sets' && <th style={{ padding: '3px 4px', color: 'var(--os-text-3)', fontSize: 10 }}>Free</th>}
                    <th style={{ width: 50 }}></th>
                  </tr></thead>
                  <tbody>
                    {editItems.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <button onClick={() => moveItem(idx, -1)} disabled={idx===0} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--os-text-3)', opacity: idx===0?0.3:1 }}>▲</button>
                            <button onClick={() => moveItem(idx, 1)} disabled={idx===editItems.length-1} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--os-text-3)', opacity: idx===editItems.length-1?0.3:1 }}>▼</button>
                          </div>
                        </td>
                        {editMenu.menu_type === 'sets' && <td style={{ padding: '2px 4px' }}><input value={item.set_name||''} onChange={e => updateEditItem(idx, 'set_name', e.target.value)} style={{...inp, width: 70, color: '#a78bfa'}} /></td>}
                        {editMenu.menu_type === 'sets' && <td style={{ padding: '2px 4px' }}><input value={item.set_name_ru||''} onChange={e => updateEditItem(idx, 'set_name_ru', e.target.value)} style={{...inp, width: 70}} /></td>}
                        <td style={{ padding: '2px 4px' }}><input value={item.name_en||''} onChange={e => updateEditItem(idx, 'name_en', e.target.value)} style={inp} /></td>
                        <td style={{ padding: '2px 4px' }}><input value={item.name_th||''} onChange={e => updateEditItem(idx, 'name_th', e.target.value)} style={{...inp, color: 'var(--os-text-3)'}} /></td>
                        <td style={{ padding: '2px 4px' }}><input value={item.name_ru||''} onChange={e => updateEditItem(idx, 'name_ru', e.target.value)} style={inp} /></td>
                        <td style={{ padding: '2px 4px' }}><select value={item.category||'other'} onChange={e => updateEditItem(idx, 'category', e.target.value)} style={{...inp, width: 75}}>{catOpts.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                        {editMenu.menu_type !== 'sets' && <td style={{ padding: '2px 4px' }}><input type="number" value={item.price||''} onChange={e => updateEditItem(idx, 'price', Number(e.target.value)||null)} style={{...inp, width: 55, textAlign: 'right'}} /></td>}
                        {editMenu.menu_type !== 'sets' && <td style={{ padding: '2px 4px' }}><select value={item.price_unit||'piece'} onChange={e => updateEditItem(idx, 'price_unit', e.target.value)} style={{...inp, width: 60}}>{unitOpts.map(u => <option key={u} value={u}>{u}</option>)}</select></td>}
                        {editMenu.menu_type !== 'sets' && <td style={{ padding: '2px 4px', textAlign: 'center' }}><input type="checkbox" checked={item.is_free||false} onChange={e => updateEditItem(idx, 'is_free', e.target.checked)} /></td>}
                        <td style={{ padding: '2px 4px' }}><button onClick={() => removeEditItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addEditItem} style={{ marginTop: 6, fontSize: 11, color: 'var(--os-aqua)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Добавить блюдо</button>
              </div>
            ) : (
              /* Read-only view */
              mData.menu_type === 'sets' && sets.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {sets.map((setName: unknown) => {
                    const setItems = items.filter((i: any) => i.set_name === String(setName));
                    return (
                      <div key={String(setName)} style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, backgroundColor: 'var(--os-card)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>{String(setName)} {setItems[0]?.set_name_ru && <span style={{fontWeight:400,color:'var(--os-text-3)'}}>({setItems[0].set_name_ru})</span>}</div>
                        {setItems.map((item: any, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--os-text-2)', padding: '1px 0' }}>
                            {item.name_en} {item.name_ru && <span style={{ color: 'var(--os-text-3)' }}>({item.name_ru})</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 4 }}>
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--os-text-2)', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name_en} {item.name_ru && <span style={{ color: 'var(--os-text-3)' }}>({item.name_ru})</span>}</span>
                      <span style={{ color: item.is_free ? 'var(--os-green)' : 'var(--os-gold)', fontWeight: 600, marginLeft: 8 }}>
                        {item.is_free ? 'FREE' : (item.price ? item.price + '/' + item.price_unit : '')}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}


export default function BoatDetail({ boatId, boatName, onBack }: {
  boatId: number; boatName: string; onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'prices' | 'options' | 'info' | 'menu'>('prices');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routePrices, setRoutePrices] = useState<RoutePrice[]>([]);
  const [options, setOptions] = useState<BoatOption[]>([]);
  const [boatMenus, setBoatMenus] = useState<any[]>([]);
  const [menuText, setMenuText] = useState('');
  const [parsingMenu, setParsingMenu] = useState(false);
  const [parsedMenu, setParsedMenu] = useState<any>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [boat, setBoat] = useState<any>(null);
  const partnerId = boat?.partner_id || null;
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editingPrice, setEditingPrice] = useState<Partial<RoutePrice> | null>(null);

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('*').eq('id', boatId).single(),
      sb.from('routes').select('*').order('name'),
      sb.from('route_prices').select('*').eq('boat_id', boatId).order('route_id'),
      sb.from('boat_options').select('id,option_id,status,price,available,options_catalog(name_en,name_ru)').eq('boat_id', boatId),
      sb.from('options_catalog').select('id,name_en,name_ru').order('name_en'),
    ]).then(([b, r, rp, bo, cat]) => {
      setBoat(b.data);
      setRoutes(r.data || []);
      setRoutePrices(rp.data || []);
      setOptions((bo.data as unknown as BoatOption[]) || []);
      setCatalog(cat.data || []);
      setLoading(false);
    });
  }, [boatId]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const savePrice = async () => {
    if (!editingPrice) return;
    const { id, ...fields } = editingPrice;
    const payload = { ...fields, boat_id: boatId };
    const { error } = id
      ? await sb.from('route_prices').update(payload).eq('id', id)
      : await sb.from('route_prices').insert(payload);
    if (error) { flash('❌ ' + error.message); return; }
    flash('✅ Сохранено');
    const { data } = await sb.from('route_prices').select('*').eq('boat_id', boatId).order('route_id');
    setRoutePrices(data || []);
    setEditingPrice(null);
  };

  const deletePrice = async (id: number) => {
    if (!confirm('Удалить цену маршрута?')) return;
    await sb.from('route_prices').delete().eq('id', id);
    setRoutePrices(rp => rp.filter(r => r.id !== id));
    flash('✅ Удалено');
  };

  const updateOption = async (id: number, field: string, value: unknown) => {
    await sb.from('boat_options').update({ [field]: value }).eq('id', id);
    setOptions(opts => opts.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addOption = async () => {
    const { data, error } = await sb.from('boat_options')
      .insert({ boat_id: boatId, option_id: catalog[0]?.id, status: 'included', price: 0, available: true })
      .select('id,option_id,status,price,available,options_catalog(name_en,name_ru)');
    if (!error && data) setOptions(o => [...o, ...(data as unknown as BoatOption[])]);
  };

  const deleteOption = async (id: number) => {
    await sb.from('boat_options').delete().eq('id', id);
    setOptions(o => o.filter(x => x.id !== id));
    flash('✅ Удалено');
  };

  const saveBoatInfo = async () => {
    const { error } = await sb.from('boats').update(boat).eq('id', boatId);
    flash(error ? '❌ ' + error.message : '✅ Сохранено');
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;

  const SUBTABS = [
    { id: 'prices', label: '💰 Маршруты & Цены' },
    { id: 'options', label: '⚙️ Опции' },
    { id: 'info', label: '📋 Данные лодки' },
    { id: 'menu', label: '🍽️ Меню' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--os-aqua)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Назад к лодкам</button>
        <span style={{ color: 'var(--os-text-3)' }}>/</span>
        <span style={{ fontWeight: 700 }}>{boatName}</span>
        {msg && <span style={{ marginLeft: 'auto', fontSize: 12, color: msg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)' }}>{msg}</span>}
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--os-border)' }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            backgroundColor: 'transparent',
            color: activeTab === t.id ? 'var(--os-aqua)' : 'var(--os-text-2)',
            borderBottom: activeTab === t.id ? '2px solid var(--os-aqua)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* PRICES */}
      {activeTab === 'prices' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setEditingPrice({ time_slot: 'full_day', season: 'regular', base_price: 0 })}
              style={btn('var(--os-aqua)')}>+ Добавить маршрут/цену</button>
          </div>
          {editingPrice && (
            <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>
                {editingPrice.id ? '✏️ Редактировать' : '➕ Новый маршрут'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Маршрут</div>
                  <select value={editingPrice.route_id || ''} onChange={e => setEditingPrice({ ...editingPrice, route_id: +e.target.value })} style={inp}>
                    <option value="">— выбрать маршрут —</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Тайм-слот</div>
                  <select value={editingPrice.time_slot || 'full_day'} onChange={e => setEditingPrice({ ...editingPrice, time_slot: e.target.value })} style={inp}>
                    <option value="full_day">full_day</option>
                    <option value="half_day">half_day</option>
                    <option value="overnight">overnight</option>
                    <option value="multi_day">multi_day</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Сезон</div>
                  <select value={editingPrice.season || 'regular'} onChange={e => setEditingPrice({ ...editingPrice, season: e.target.value })} style={inp}>
                    <option value="regular">Обычный</option>
                    <option value="high">Высокий</option>
                    <option value="peak">Пиковый</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
                {([
                  ['Базовая цена (THB)', 'base_price'], ['Цена агента', 'agent_price'],
                  ['Цена клиента', 'client_price'], ['Базовых гостей', 'base_pax'],
                  ['Доп. гость', 'extra_pax_price'], ['Топливный сбор', 'fuel_surcharge'],
                ] as [string, string][]).map(([label, field]) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                    <input type="number" value={(editingPrice as any)[field] || 0}
                      onChange={e => setEditingPrice({ ...editingPrice, [field]: +e.target.value })} style={inp} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Действует от</div>
                  <input type="date" value={editingPrice.valid_from || ''} onChange={e => setEditingPrice({ ...editingPrice, valid_from: e.target.value })} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Действует до</div>
                  <input type="date" value={editingPrice.valid_to || ''} onChange={e => setEditingPrice({ ...editingPrice, valid_to: e.target.value })} style={inp} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={savePrice} style={btn('var(--os-green)')}>💾 Сохранить</button>
                <button onClick={() => setEditingPrice(null)} style={btn('#666')}>Отмена</button>
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Маршрут', 'Слот', 'База', 'Агент', 'Клиент', '+Гость', 'Сезон', 'Действует до', ''].map(h =>
                <th key={h} style={hcell}>{h}</th>)}</tr></thead>
              <tbody>
                {routePrices.map(rp => {
                  const route = routes.find(r => r.id === rp.route_id);
                  return (
                    <tr key={rp.id}>
                      <td style={{ ...cell, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={route?.name}>{route?.name || `#${rp.route_id}`}</td>
                      <td style={cell}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--os-surface)' }}>{rp.time_slot}</span></td>
                      <td style={{ ...cell, fontWeight: 700, color: 'var(--os-aqua)' }}>{rp.base_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.agent_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.client_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.extra_pax_price || '—'}</td>
                      <td style={cell}>{rp.season}</td>
                      <td style={cell}>{rp.valid_to ? rp.valid_to.slice(0,10) : '—'}</td>
                      <td style={cell}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setEditingPrice(rp)} style={btn('var(--os-aqua)')}>✏️</button>
                          <button onClick={() => deletePrice(rp.id)} style={btn('var(--os-red)')}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {routePrices.length === 0 && (
              <div style={{ padding: 20, color: 'var(--os-text-3)', textAlign: 'center', fontSize: 13 }}>
                Нет маршрутов. Нажмите «+ Добавить».
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPTIONS */}
      {activeTab === 'options' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={addOption} style={btn('var(--os-aqua)')}>+ Добавить опцию</button>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Опция (EN)', 'RU', 'Статус', 'Цена', 'Доступно', ''].map(h =>
                <th key={h} style={hcell}>{h}</th>)}</tr></thead>
              <tbody>
                {options.map(opt => (
                  <tr key={opt.id}>
                    <td style={cell}>
                      <select value={opt.option_id} onChange={e => updateOption(opt.id, 'option_id', +e.target.value)}
                        style={{ ...inp, width: 210 }}>
                        {catalog.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                      </select>
                    </td>
                    <td style={{ ...cell, color: 'var(--os-text-3)', fontSize: 11 }}>{opt.options_catalog?.name_ru || '—'}</td>
                    <td style={cell}>
                      <select value={opt.status} onChange={e => updateOption(opt.id, 'status', e.target.value)}
                        style={{ ...inp, width: 140, color: STATUS_COLOR[opt.status] }}>
                        <option value="included">included</option>
                        <option value="paid_optional">paid_optional</option>
                        <option value="excluded">excluded</option>
                      </select>
                    </td>
                    <td style={cell}>
                      <input type="number" value={opt.price || 0}
                        onChange={e => updateOption(opt.id, 'price', +e.target.value)}
                        style={{ ...inp, width: 80 }} />
                    </td>
                    <td style={cell}>
                      <input type="checkbox" checked={!!opt.available}
                        onChange={e => updateOption(opt.id, 'available', e.target.checked)} />
                    </td>
                    <td style={cell}><button onClick={() => deleteOption(opt.id)} style={btn('var(--os-red)')}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {options.length === 0 && <div style={{ padding: 20, color: 'var(--os-text-3)', textAlign: 'center', fontSize: 13 }}>Нет опций.</div>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginTop: 8 }}>Опций: {options.length}</div>
        </div>
      )}

      {/* INFO */}
      {activeTab === 'info' && boat && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            {([
              ['Название', 'name', 'text'], ['Тип', 'boat_type', 'text'], ['Модель', 'model', 'text'],
              ['Длина (ft)', 'length_ft', 'number'], ['Год постройки', 'year_built', 'number'], ['Каюты', 'cabins', 'number'],
              ['Туалеты', 'toilets', 'number'], ['Макс/день', 'max_pax_day', 'number'], ['Скорость (узлы)', 'speed_knots', 'number'],
              ['Причал', 'default_pier', 'text'], ['Фото (URL)', 'main_photo_url', 'text'], ['Сайт (URL)', 'website_url', 'text'],
            ] as [string, string, string][]).map(([label, field, type]) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                <input type={type} value={boat[field] || ''}
                  onChange={e => setBoat({ ...boat, [field]: type === 'number' ? +e.target.value : e.target.value })}
                  style={inp} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 20 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.has_flybridge} onChange={e => setBoat({ ...boat, has_flybridge: e.target.checked })} />
                Флайбридж
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.has_jacuzzi} onChange={e => setBoat({ ...boat, has_jacuzzi: e.target.checked })} />
                Джакузи
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.active} onChange={e => setBoat({ ...boat, active: e.target.checked })} />
                Активна
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Примечания</div>
            <textarea value={boat.notes || ''} onChange={e => setBoat({ ...boat, notes: e.target.value })}
              rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
          {boat.main_photo_url && (
            <div style={{ marginBottom: 16 }}>
              <img src={boat.main_photo_url} alt={boat.name}
                style={{ maxHeight: 160, borderRadius: 8, border: '1px solid var(--os-border)' }} />
            </div>
          )}
          <button onClick={saveBoatInfo} style={btn('var(--os-green)')}>💾 Сохранить данные лодки</button>
        </div>
      )}

      {/* MENU */}
      {activeTab === 'menu' && (
        <MenuTab boatId={boatId} partnerId={partnerId} boatMenus={boatMenus} setBoatMenus={setBoatMenus}
          menuText={menuText} setMenuText={setMenuText} parsingMenu={parsingMenu} setParsingMenu={setParsingMenu}
          parsedMenu={parsedMenu} setParsedMenu={setParsedMenu} savingMenu={savingMenu} setSavingMenu={setSavingMenu}
          msg={msg} setMsg={setMsg} />
      )}
    </div>
  );
}
