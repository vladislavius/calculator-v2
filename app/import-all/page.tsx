'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type ImportType = 'boats' | 'catering' | 'watersports' | 'decorations';

export default function UnifiedImportPage() {
  const [activeType, setActiveType] = useState<ImportType>('boats');
  const [viewMode, setViewMode] = useState<'import' | 'view'>('import');
  const [boatPartners, setBoatPartners] = useState<any[]>([]);
  const [cateringPartners, setCateringPartners] = useState<any[]>([]);
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [decorationPartners, setDecorationPartners] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [cateringMenu, setCateringMenu] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  const [decorationCatalog, setDecorationCatalog] = useState<any[]>([]);
  const [contractText, setContractText] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [expandedPartners, setExpandedPartners] = useState<Set<number>>(new Set());
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractRoutes, setContractRoutes] = useState<any[]>([]);
  const [contractOptions, setContractOptions] = useState<any[]>([]);
  const [boatMenu, setBoatMenu] = useState<any[]>([]);
  const [menuMode, setMenuMode] = useState<'import' | 'view'>('view');
  const [selectedBoatForMenu, setSelectedBoatForMenu] = useState<number | null>(null);
  const [menuText, setMenuText] = useState('');
  const [menuForAllBoats, setMenuForAllBoats] = useState(true);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    const { data: bp } = await getSupabase().from('partners').select('*').order('name');
    if (bp) setBoatPartners(bp);
    const { data: b } = await getSupabase().from('boats').select('*').order('name');
    if (b) setBoats(b);
    const { data: cp } = await getSupabase().from('catering_partners').select('*').order('name');
    if (cp) setCateringPartners(cp);
    const { data: cm } = await getSupabase().from('catering_menu').select('*').order('name_en');
    if (cm) setCateringMenu(cm);
    const { data: wp } = await getSupabase().from('watersports_partners').select('*').order('name');
    if (wp) setWatersportsPartners(wp);
    const { data: wc } = await getSupabase().from('watersports_catalog').select('*').order('name_en');
    if (wc) setWatersportsCatalog(wc);
    const { data: dp } = await getSupabase().from('decoration_partners').select('*').order('name');
    if (dp) setDecorationPartners(dp);
    const { data: dc } = await getSupabase().from('decoration_catalog').select('*').order('name_en');
    if (dc) setDecorationCatalog(dc);
    const { data: bm } = await getSupabase().from('boat_menu').select('*').order('name_en');
    if (bm) setBoatMenu(bm);
  };

  const getCurrentPartners = () => {
    if (activeType === 'boats') return boatPartners;
    if (activeType === 'catering') return cateringPartners;
    if (activeType === 'watersports') return watersportsPartners;
    return decorationPartners;
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const createPartner = async () => {
    if (!newPartnerName.trim()) return;
    const table = activeType === 'boats' ? 'partners' : activeType === 'catering' ? 'catering_partners' : activeType === 'watersports' ? 'watersports_partners' : 'decoration_partners';
    const { data, error } = await getSupabase().from(table).insert({ name: newPartnerName.trim() }).select().single();
    if (error) { showMessage('Ошибка: ' + error.message, 'error'); }
    else { showMessage('Партнёр создан!'); setNewPartnerName(''); setSelectedPartnerId(data.id); loadAllData(); }
  };

  const analyzePrice = async () => {
    if (!selectedPartnerId) { showMessage('Выберите партнёра', 'error'); return; }
    if (contractText.length < 20) { showMessage('Текст слишком короткий', 'error'); return; }
    setLoading(true); setParsedItems([]);
    try {
      const response = await fetch('/api/analyze-partner-price', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText, type: activeType })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setParsedItems(result.items || []);
      showMessage('Распознано ' + (result.items?.length || 0) + ' позиций!');
    } catch (error: any) { showMessage('Ошибка: ' + error.message, 'error'); }
    finally { setLoading(false); }
  };

  const parseSimple = () => {
    if (!selectedPartnerId) { showMessage('Выберите партнёра', 'error'); return; }
    const lines = contractText.split('\n').filter(l => l.trim());
    const items: any[] = [];
    for (const line of lines) {
      const priceMatch = line.match(/(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 0;
      const name = line.replace(/\d+/g, '').replace(/THB|฿/gi, '').trim();
      if (name) items.push({ name_en: name, name_ru: name, price });
    }
    if (items.length > 0) { setParsedItems(items); showMessage('Распознано ' + items.length + ' позиций'); }
    else showMessage('Не удалось распознать', 'error');
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...parsedItems]; updated[idx] = { ...updated[idx], [field]: value }; setParsedItems(updated);
  };

  const removeItem = (idx: number) => { setParsedItems(parsedItems.filter((_, i) => i !== idx)); };

  const saveItems = async () => {
    if (!selectedPartnerId || parsedItems.length === 0) return;
    setLoading(true);
    try {
      const table = activeType === 'catering' ? 'catering_menu' : activeType === 'watersports' ? 'watersports_catalog' : 'decoration_catalog';
      const items = parsedItems.map(item => ({
        partner_id: selectedPartnerId,
        name_en: item.name_en || item.name,
        name_ru: item.name_ru || item.name_en,
        ...(activeType === 'catering' ? { price_per_person: item.price || item.price_per_person || 0, category: item.category || 'main' } :
           activeType === 'watersports' ? { price_per_hour: item.price || item.price_per_hour || 0, price_per_day: item.price_per_day || (item.price || 0) * 5 } :
           { price: item.price || 0, category: item.category || 'other' })
      }));
      const { error } = await getSupabase().from(table).insert(items);
      if (error) throw error;
      showMessage('Сохранено ' + items.length + ' позиций!');
      setParsedItems([]); setContractText(''); loadAllData();
    } catch (error: any) { showMessage('Ошибка: ' + error.message, 'error'); }
    finally { setLoading(false); }
  };

  
  
  const parseMenuSimple = () => {
    const lines = menuText.split('\n').filter(l => l.trim());
    const items: any[] = [];
    for (const line of lines) {
      const priceMatch = line.match(/(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 0;
      const name = line.replace(/\d+/g, '').replace(/THB|฿|бат/gi, '').replace(/[-—]/g, '').trim();
      const isIncluded = line.toLowerCase().includes('included') || line.toLowerCase().includes('вкл') || price === 0;
      if (name) items.push({ name_en: name, name_ru: name, price, included: isIncluded, category: 'main' });
    }
    return items;
  };

  const analyzeMenuAI = async (partnerId: number) => {
    if (menuText.length < 20) { showMessage('Текст меню слишком короткий', 'error'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-partner-price', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: menuText, type: 'boat_menu' })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      await saveMenuItems(result.items || [], partnerId);
    } catch (error: any) { 
      // Fallback to simple parsing
      const items = parseMenuSimple();
      if (items.length > 0) await saveMenuItems(items, partnerId);
      else showMessage('Ошибка: ' + error.message, 'error');
    }
    setLoading(false);
  };

  const saveMenuItems = async (items: any[], partnerId: number) => {
    const menuItems = items.map(item => ({
      partner_id: menuForAllBoats ? partnerId : null,
      boat_id: menuForAllBoats ? null : selectedBoatForMenu,
      name_en: item.name_en || item.name,
      name_ru: item.name_ru || item.name_en || item.name,
      price: item.price || 0,
      included: item.included || false,
      category: item.category || 'main',
      description: item.description || ''
    }));
    
    const { error } = await getSupabase().from('boat_menu').insert(menuItems);
    if (error) { showMessage('Ошибка: ' + error.message, 'error'); return; }
    
    showMessage('Сохранено ' + menuItems.length + ' позиций меню!');
    setMenuText('');
    setMenuMode('view');
    loadContractDetails(partnerId);
  };

  const deleteMenuItem = async (id: number, partnerId: number) => {
    await getSupabase().from('boat_menu').delete().eq('id', id);
    showMessage('Удалено');
    loadContractDetails(partnerId);
  };

const loadContractDetails = async (partnerId: number) => {
    // Get boats for this partner
    const { data: partnerBoats } = await getSupabase().from('boats').select('id, name').eq('partner_id', partnerId);
    if (!partnerBoats || partnerBoats.length === 0) return;
    
    const boatIds = partnerBoats.map(b => b.id);
    
    // Get routes and prices
    const { data: prices } = await supabase
      .from('route_prices')
      .select('*, routes(name), boats(name)')
      .in('boat_id', boatIds);
    
    // Get options
    const { data: options } = await supabase
      .from('boat_options')
      .select('*, options_catalog(name_en, name_ru)')
      .in('boat_id', boatIds);
    
    setContractRoutes(prices || []);
    setContractOptions(options || []);
    
    // Load menu for this partner's boats
    const { data: menu } = await supabase
      .from('boat_menu')
      .select('*')
      .or('partner_id.eq.' + partnerId + ',boat_id.in.(' + boatIds.join(',') + ')');
    setBoatMenu(menu || []);
    
    setSelectedContract(partnerId);
  };

  const togglePartner = (id: number) => {
    const s = new Set(expandedPartners);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpandedPartners(s);
  };

  const getGroupedData = () => {
    if (activeType === 'boats') return boatPartners.map(p => ({ partner: p, items: boats.filter(b => b.partner_id === p.id), boatCount: boats.filter(b => b.partner_id === p.id).length })).filter(g => g.items.length > 0);
    if (activeType === 'catering') return cateringPartners.map(p => ({ partner: p, items: cateringMenu.filter(m => m.partner_id === p.id) }));
    if (activeType === 'watersports') return watersportsPartners.map(p => ({ partner: p, items: watersportsCatalog.filter(w => w.partner_id === p.id) }));
    return decorationPartners.map(p => ({ partner: p, items: decorationCatalog.filter(d => d.partner_id === p.id) }));
  };

  const deleteItem = async (table: string, id: number) => {
    await getSupabase().from(table).delete().eq('id', id);
    showMessage('Удалено'); loadAllData();
  };
  const deletePartner = async (id: number) => {
    if (!confirm('Удалить партнёра и все его данные?')) return;
    const table = activeType === 'boats' ? 'partners' : activeType === 'catering' ? 'catering_partners' : activeType === 'watersports' ? 'watersports_partners' : 'decoration_partners';
    const itemsTable = activeType === 'boats' ? 'boats' : activeType === 'catering' ? 'catering_menu' : activeType === 'watersports' ? 'watersports_catalog' : 'decoration_catalog';
    // Delete items first
    await getSupabase().from(itemsTable).delete().eq('partner_id', id);
    // Then delete partner
    await getSupabase().from(table).delete().eq('id', id);
    showMessage('Партнёр удалён');
    loadAllData();
  };


  const tabs = [
    { type: 'boats' as ImportType, icon: '🚢', label: 'Яхты', count: boats.length },
    { type: 'catering' as ImportType, icon: '🍽️', label: 'Кейтеринг', count: cateringMenu.length },
    { type: 'watersports' as ImportType, icon: '🏄', label: 'Водные игрушки', count: watersportsCatalog.length },
    { type: 'decorations' as ImportType, icon: '✨', label: 'Декор', count: decorationCatalog.length }
  ];

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#f8fafc'}}>
      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div>
            <h1 style={{fontSize:'32px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.5px'}}>📦 Центр импорта данных</h1>
            <p style={{color:'#6b7280',marginTop:'4px'}}>Управление партнёрами, яхтами и каталогами</p>
          </div>
          <a href="/" style={{padding:'12px 20px',backgroundColor:'#2563eb',borderRadius:'10px',color:'white',textDecoration:'none',fontWeight:'500',boxShadow:'0 2px 8px rgba(37,99,235,0.3)'}}>← К калькулятору</a>
        </div>

        {/* Stats Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'16px',marginBottom:'24px',padding:'0 4px'}}>
          <div onClick={() => setActiveType('boats')} style={{padding:'20px',backgroundColor:activeType==='boats'?'#eff6ff':'white',borderRadius:'16px',border:activeType==='boats'?'2px solid #2563eb':'1px solid #e5e7eb',cursor:'pointer',transition:'all 0.2s',boxShadow:activeType==='boats'?'0 4px 15px rgba(37,99,235,0.15)':'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <span style={{fontSize:'36px'}}>🚢</span>
              <div>
                <div style={{fontSize:'28px',fontWeight:'700',color:'#2563eb'}}>{boats.length}</div>
                <div style={{fontSize:'13px',color:'#6b7280',fontWeight:'500'}}>Яхты</div>
                <div style={{fontSize:'11px',color:'#9ca3af'}}>{boatPartners.length} партнёров</div>
              </div>
            </div>
          </div>
          <div onClick={() => setActiveType('catering')} style={{padding:'20px',backgroundColor:activeType==='catering'?'#fff7ed':'white',borderRadius:'16px',border:activeType==='catering'?'2px solid #ea580c':'1px solid #e5e7eb',cursor:'pointer',transition:'all 0.2s',boxShadow:activeType==='catering'?'0 4px 15px rgba(234,88,12,0.15)':'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <span style={{fontSize:'36px'}}>🍽️</span>
              <div>
                <div style={{fontSize:'28px',fontWeight:'700',color:'#ea580c'}}>{cateringMenu.length}</div>
                <div style={{fontSize:'13px',color:'#6b7280',fontWeight:'500'}}>Кейтеринг</div>
                <div style={{fontSize:'11px',color:'#9ca3af'}}>{cateringPartners.length} партнёров</div>
              </div>
            </div>
          </div>
          <div onClick={() => setActiveType('watersports')} style={{padding:'20px',backgroundColor:activeType==='watersports'?'#ecfeff':'white',borderRadius:'16px',border:activeType==='watersports'?'2px solid #0891b2':'1px solid #e5e7eb',cursor:'pointer',transition:'all 0.2s',boxShadow:activeType==='watersports'?'0 4px 15px rgba(8,145,178,0.15)':'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <span style={{fontSize:'36px'}}>🏄</span>
              <div>
                <div style={{fontSize:'28px',fontWeight:'700',color:'#0891b2'}}>{watersportsCatalog.length}</div>
                <div style={{fontSize:'13px',color:'#6b7280',fontWeight:'500'}}>Водные игрушки</div>
                <div style={{fontSize:'11px',color:'#9ca3af'}}>{watersportsPartners.length} партнёров</div>
              </div>
            </div>
          </div>
          <div onClick={() => setActiveType('decorations')} style={{padding:'20px',backgroundColor:activeType==='decorations'?'#f5f3ff':'white',borderRadius:'16px',border:activeType==='decorations'?'2px solid #7c3aed':'1px solid #e5e7eb',cursor:'pointer',transition:'all 0.2s',boxShadow:activeType==='decorations'?'0 4px 15px rgba(124,58,237,0.15)':'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
              <span style={{fontSize:'36px'}}>✨</span>
              <div>
                <div style={{fontSize:'28px',fontWeight:'700',color:'#7c3aed'}}>{decorationCatalog.length}</div>
                <div style={{fontSize:'13px',color:'#6b7280',fontWeight:'500'}}>Декор</div>
                <div style={{fontSize:'11px',color:'#9ca3af'}}>{decorationPartners.length} партнёров</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex',backgroundColor:'white',borderRadius:'16px 16px 0 0',boxShadow:'0 -2px 10px rgba(0,0,0,0.03)'}}>
          {tabs.map(tab => (
            <button key={tab.type} onClick={() => { setActiveType(tab.type); setSelectedPartnerId(null); setParsedItems([]); setContractText(''); }}
              style={{flex:1,padding:'18px 16px',border:'none',cursor:'pointer',fontSize:'15px',fontWeight:'600',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',transition:'all 0.2s',
                backgroundColor:activeType===tab.type?'#eff6ff':'white',color:activeType===tab.type?'#2563eb':'#6b7280',borderBottom:activeType===tab.type?'3px solid #2563eb':'3px solid transparent'}}>
              <span>{tab.icon}</span><span>{tab.label}</span>
              <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'12px',backgroundColor:activeType===tab.type?'#dbeafe':'#f3f4f6'}}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div style={{display:'flex',backgroundColor:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
          <button onClick={() => setViewMode('import')} style={{flex:1,padding:'12px',border:'none',cursor:'pointer',backgroundColor:viewMode==='import'?'white':'transparent',color:viewMode==='import'?'#2563eb':'#6b7280',borderBottom:viewMode==='import'?'2px solid #2563eb':'none'}}>📤 Импорт</button>
          <button onClick={() => setViewMode('view')} style={{flex:1,padding:'12px',border:'none',cursor:'pointer',backgroundColor:viewMode==='view'?'white':'transparent',color:viewMode==='view'?'#2563eb':'#6b7280',borderBottom:viewMode==='view'?'2px solid #2563eb':'none'}}>👁️ Просмотр</button>
        </div>

        <div style={{backgroundColor:'white',borderRadius:'0 0 12px 12px',padding:'24px'}}>
          {message && <div style={{padding:'12px 16px',borderRadius:'8px',marginBottom:'20px',backgroundColor:messageType==='success'?'#d1fae5':'#fee2e2',color:messageType==='success'?'#065f46':'#991b1b'}}>{message}</div>}

          {viewMode === 'import' ? (
            <div>
              {activeType !== 'boats' && (
                <div style={{marginBottom:'24px'}}>
                  <label style={{display:'block',fontSize:'14px',fontWeight:'500',marginBottom:'8px'}}>Партнёр</label>
                  <div style={{display:'flex',gap:'12px'}}>
                    <select value={selectedPartnerId||''} onChange={e => setSelectedPartnerId(e.target.value ? Number(e.target.value) : null)}
                      style={{flex:1,padding:'10px',border:'1px solid #d1d5db',borderRadius:'8px'}}>
                      <option value="">Выберите...</option>
                      {getCurrentPartners().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input placeholder="Новый партнёр..." value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} style={{width:'200px',padding:'10px',border:'1px solid #d1d5db',borderRadius:'8px'}} />
                    <button onClick={createPartner} disabled={!newPartnerName.trim()} style={{padding:'10px 20px',backgroundColor:'#10b981',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',opacity:newPartnerName.trim()?1:0.5}}>+ Создать</button>
                  </div>
                </div>
              )}

              {activeType === 'boats' ? (
                <div style={{padding:'20px',backgroundColor:'#fef3c7',borderRadius:'8px',marginBottom:'20px'}}>
                  <p>🚢 Для импорта яхт используйте <a href="/import" style={{color:'#2563eb',fontWeight:'500'}}>полную страницу импорта</a> с AI-анализом контрактов</p>
                </div>
              ) : (
                <>
                  <div style={{marginBottom:'24px'}}>
                    <label style={{display:'block',fontSize:'14px',fontWeight:'500',marginBottom:'8px'}}>Прайс-лист</label>
                    <textarea value={contractText} onChange={e => setContractText(e.target.value)}
                      placeholder="Вставьте прайс:&#10;Том Ям - 350 THB&#10;Пад Тай - 250 THB"
                      style={{width:'100%',padding:'12px',border:'1px solid #d1d5db',borderRadius:'8px',minHeight:'150px',fontFamily:'monospace'}} />
                  </div>
                  <div style={{display:'flex',gap:'12px'}}>
                    <button onClick={analyzePrice} disabled={loading||!selectedPartnerId} style={{padding:'12px 24px',background:'linear-gradient(to right,#2563eb,#7c3aed)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',opacity:loading||!selectedPartnerId?0.5:1}}>
                      {loading ? 'Анализ...' : '🤖 AI-распознавание'}
                    </button>
                    <button onClick={parseSimple} disabled={!selectedPartnerId} style={{padding:'12px 24px',backgroundColor:'#e5e7eb',color:'#374151',border:'none',borderRadius:'8px',cursor:'pointer',opacity:selectedPartnerId?1:0.5}}>📝 Простой парсинг</button>
                  </div>
                </>
              )}

              {parsedItems.length > 0 && (
                <div style={{marginTop:'20px',border:'1px solid #e5e7eb',borderRadius:'8px'}}>
                  <div style={{padding:'12px',backgroundColor:'#f0fdf4',borderBottom:'1px solid #e5e7eb'}}><strong>✅ Распознано {parsedItems.length} позиций:</strong></div>
                  {parsedItems.map((item, idx) => (
                    <div key={idx} style={{display:'flex',alignItems:'center',padding:'10px',borderBottom:'1px solid #e5e7eb',gap:'10px'}}>
                      <input value={item.name_en||''} onChange={e => updateItem(idx,'name_en',e.target.value)} style={{flex:2,padding:'6px',border:'1px solid #d1d5db',borderRadius:'6px'}} placeholder="Название" />
                      <input value={item.name_ru||''} onChange={e => updateItem(idx,'name_ru',e.target.value)} style={{flex:2,padding:'6px',border:'1px solid #d1d5db',borderRadius:'6px'}} placeholder="Название RU" />
                      <input type="number" value={item.price||0} onChange={e => updateItem(idx,'price',Number(e.target.value))} style={{width:'80px',padding:'6px',border:'1px solid #d1d5db',borderRadius:'6px'}} />
                      <span>THB</span>
                      <button onClick={() => removeItem(idx)} style={{padding:'4px 8px',backgroundColor:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'4px',cursor:'pointer'}}>✕</button>
                    </div>
                  ))}
                  <div style={{padding:'12px',display:'flex',justifyContent:'flex-end'}}>
                    <button onClick={saveItems} style={{padding:'12px 24px',backgroundColor:'#10b981',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'500'}}>💾 Сохранить все</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {getGroupedData().length === 0 ? (
                <div style={{textAlign:'center',padding:'40px',color:'#6b7280'}}>Нет данных. Импортируйте контракты.</div>
              ) : getGroupedData().map(group => (
                <div key={group.partner.id} style={{border:'1px solid #e5e7eb',borderRadius:'8px',marginBottom:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'12px 16px',backgroundColor:'#f9fafb'}}>
                    <div onClick={() => { togglePartner(group.partner.id); if(activeType==='boats') loadContractDetails(group.partner.id); }} style={{cursor:'pointer',flex:1,display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontWeight:'600'}}>{activeType==='boats'?'🚢':activeType==='catering'?'🍽️':activeType==='watersports'?'🏄':'✨'} {group.partner.name}</span>
                      <span style={{color:'#6b7280'}}>({activeType==='boats' ? group.items.length + ' яхт' : group.items.length + ' позиций'})</span>
                      <span>{expandedPartners.has(group.partner.id)?'▼':'▶'}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deletePartner(group.partner.id); }} style={{padding:'4px 12px',backgroundColor:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>Удалить</button>
                  </div>
                  {expandedPartners.has(group.partner.id) && (
                    activeType === 'boats' && selectedContract === group.partner.id ? (
                      <div style={{padding:'16px',borderTop:'1px solid #e5e7eb'}}>
                        {/* Boats list */}
                        <div style={{marginBottom:'16px'}}>
                          <h4 style={{fontWeight:'600',marginBottom:'8px',color:'#374151'}}>🚢 Яхты ({group.items.length})</h4>
                          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                            {group.items.map(boat => (
                              <span key={boat.id} style={{padding:'4px 12px',backgroundColor:'#e0e7ff',color:'#3730a3',borderRadius:'16px',fontSize:'13px'}}>{boat.name}</span>
                            ))}
                          </div>
                        </div>
                        {/* Routes and Prices */}
                        {contractRoutes.length > 0 && (
                          <div style={{marginBottom:'16px'}}>
                            <h4 style={{fontWeight:'600',marginBottom:'8px',color:'#374151'}}>📍 Маршруты и цены ({contractRoutes.length})</h4>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                              <thead>
                                <tr style={{backgroundColor:'#f3f4f6'}}>
                                  <th style={{padding:'8px',textAlign:'left',borderBottom:'1px solid #e5e7eb'}}>Яхта</th>
                                  <th style={{padding:'8px',textAlign:'left',borderBottom:'1px solid #e5e7eb'}}>Маршрут</th>
                                  <th style={{padding:'8px',textAlign:'left',borderBottom:'1px solid #e5e7eb'}}>Сезон</th>
                                  <th style={{padding:'8px',textAlign:'right',borderBottom:'1px solid #e5e7eb'}}>Цена</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contractRoutes.map((price, idx) => (
                                  <tr key={idx} style={{borderBottom:'1px solid #e5e7eb'}}>
                                    <td style={{padding:'8px'}}>{price.boats?.name}</td>
                                    <td style={{padding:'8px'}}>{price.routes?.name}</td>
                                    <td style={{padding:'8px'}}><span style={{padding:'2px 8px',backgroundColor:price.season==='high'?'#fef3c7':price.season==='peak'?'#fee2e2':'#d1fae5',borderRadius:'4px',fontSize:'11px'}}>{price.season}</span></td>
                                    <td style={{padding:'8px',textAlign:'right',fontWeight:'500'}}>{price.base_price?.toLocaleString()} THB</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {/* Options */}
                        {/* Menu Section */}
                        <div style={{marginBottom:'16px',padding:'16px',backgroundColor:'#fffbeb',borderRadius:'8px',border:'1px solid #fcd34d'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                            <h4 style={{fontWeight:'600',color:'#92400e'}}>🍽️ Меню яхты</h4>
                            <div style={{display:'flex',gap:'8px'}}>
                              <button onClick={() => setMenuMode(menuMode === 'view' ? 'import' : 'view')} 
                                style={{padding:'6px 12px',backgroundColor:menuMode==='import'?'#fbbf24':'#fef3c7',color:'#92400e',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                                {menuMode === 'view' ? '+ Добавить меню' : 'Отмена'}
                              </button>
                            </div>
                          </div>
                          
                          {menuMode === 'import' ? (
                            <div>
                              <div style={{marginBottom:'12px'}}>
                                <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                                  <input type="checkbox" checked={menuForAllBoats} onChange={e => setMenuForAllBoats(e.target.checked)} />
                                  <span style={{fontSize:'14px'}}>Для всех яхт партнёра</span>
                                </label>
                                {!menuForAllBoats && (
                                  <select value={selectedBoatForMenu || ''} onChange={e => setSelectedBoatForMenu(Number(e.target.value))}
                                    style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',marginTop:'4px'}}>
                                    <option value="">Выберите яхту...</option>
                                    {group.items.map(boat => <option key={boat.id} value={boat.id}>{boat.name}</option>)}
                                  </select>
                                )}
                              </div>
                              <textarea value={menuText} onChange={e => setMenuText(e.target.value)}
                                placeholder="Вставьте меню:&#10;Завтрак - included&#10;Том Ям - 350 THB&#10;Пад Тай - 250 THB&#10;BBQ Seafood - 1500 THB"
                                style={{width:'100%',padding:'10px',border:'1px solid #d1d5db',borderRadius:'6px',minHeight:'120px',fontFamily:'monospace',fontSize:'13px',marginBottom:'12px'}} />
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={() => analyzeMenuAI(group.partner.id)} disabled={loading || menuText.length < 20}
                                  style={{padding:'8px 16px',background:'linear-gradient(to right,#f59e0b,#d97706)',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',opacity:loading||menuText.length<20?0.5:1}}>
                                  {loading ? 'Сохранение...' : '💾 Сохранить меню'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {boatMenu.length > 0 ? (
                                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px'}}>
                                  {boatMenu.map(item => (
                                    <div key={item.id} style={{padding:'8px 12px',backgroundColor:'white',borderRadius:'6px',fontSize:'13px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                      <div>
                                        <span style={{fontWeight:'500'}}>{item.name_en}</span>
                                        {item.boat_id && <span style={{marginLeft:'6px',fontSize:'11px',color:'#6b7280'}}>(яхта #{item.boat_id})</span>}
                                      </div>
                                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <span style={{color:item.included?'#059669':'#92400e'}}>{item.included ? '✓ Вкл' : item.price + ' THB'}</span>
                                        <button onClick={() => deleteMenuItem(item.id, group.partner.id)} style={{color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontSize:'14px'}}>×</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{color:'#92400e',fontSize:'13px',fontStyle:'italic'}}>Меню не добавлено. Нажмите "+ Добавить меню"</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {contractOptions.length > 0 && (
                          <div>
                            <h4 style={{fontWeight:'600',marginBottom:'8px',color:'#374151'}}>⚙️ Опции ({contractOptions.length})</h4>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                              {contractOptions.map((opt, idx) => (
                                <div key={idx} style={{padding:'8px',backgroundColor:'#f9fafb',borderRadius:'6px',fontSize:'13px',display:'flex',justifyContent:'space-between'}}>
                                  <span>{opt.options_catalog?.name_en || opt.options_catalog?.name_ru}</span>
                                  <span style={{color:opt.status==='included'?'#059669':'#6b7280'}}>{opt.status==='included'?'✓ Вкл':opt.price+' THB'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {contractRoutes.length === 0 && contractOptions.length === 0 && (
                          <p style={{color:'#6b7280',fontStyle:'italic'}}>Нет данных о маршрутах и опциях. Импортируйте контракт.</p>
                        )}
                      </div>
                    ) : (
                      group.items.map(item => (
                        <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 16px',borderTop:'1px solid #e5e7eb'}}>
                          <span>{item.name||item.name_en}</span>
                          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                            <span>{activeType==='catering'?item.price_per_person+' THB/чел':activeType==='watersports'?item.price_per_hour+' THB/час':item.price+' THB'}</span>
                            <button onClick={() => deleteItem(activeType==='catering'?'catering_menu':activeType==='watersports'?'watersports_catalog':'decoration_catalog',item.id)}
                              style={{padding:'4px 8px',backgroundColor:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>Удалить</button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginTop:'24px'}}>
          {tabs.map(tab => (
            <div key={tab.type} style={{backgroundColor:'white',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div style={{fontSize:'28px',fontWeight:'bold'}}>{tab.count}</div>
              <div style={{color:'#6b7280'}}>{tab.icon} {tab.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
