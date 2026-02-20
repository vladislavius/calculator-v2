'use client';
import AdminGuard from '../components/AdminGuard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


type ImportType = 'boats' | 'catering' | 'watersports' | 'decorations';

export default function UnifiedImportPage() {
  const [activeType, setActiveType] = useState<ImportType>('boats');
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
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    const [bp, b, cp, cm, wp, wc, dp, dc] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('boats').select('*').order('name'),
      supabase.from('catering_partners').select('*').order('name'),
      supabase.from('catering_menu').select('*').order('name_en'),
      supabase.from('watersports_partners').select('*').order('name'),
      supabase.from('watersports_catalog').select('*').order('name_en'),
      supabase.from('decoration_partners').select('*').order('name'),
      supabase.from('decoration_catalog').select('*').order('name_en'),
    ]);
    if (bp.data) setBoatPartners(bp.data);
    if (b.data) setBoats(b.data);
    if (cp.data) setCateringPartners(cp.data);
    if (cm.data) setCateringMenu(cm.data);
    if (wp.data) setWatersportsPartners(wp.data);
    if (wc.data) setWatersportsCatalog(wc.data);
    if (dp.data) setDecorationPartners(dp.data);
    if (dc.data) setDecorationCatalog(dc.data);
  };

  const getCurrentPartners = () => {
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
    const table = activeType === 'catering' ? 'catering_partners' : activeType === 'watersports' ? 'watersports_partners' : 'decoration_partners';
    const { data, error } = await supabase.from(table).insert({ name: newPartnerName.trim() }).select().single();
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
      const priceMatch = line.match(/(\d[\d,]*)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      const name = line.replace(/[\d,]+/g, '').replace(/THB|฿|бат/gi, '').replace(/[-—]/g, '').trim();
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
      const { error } = await supabase.from(table).insert(items);
      if (error) throw error;
      showMessage('Сохранено ' + items.length + ' позиций!');
      setParsedItems([]); setContractText(''); loadAllData();
    } catch (error: any) { showMessage('Ошибка: ' + error.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteItem = async (table: string, id: number) => {
    await supabase.from(table).delete().eq('id', id);
    showMessage('Удалено'); loadAllData();
  };

  const saveEditItem = async () => {
    if (!editingItem) return;
    const table = activeType === 'catering' ? 'catering_menu' : activeType === 'watersports' ? 'watersports_catalog' : 'decoration_catalog';
    const updateData: any = { name_en: editingItem.name_en, name_ru: editingItem.name_ru };
    if (activeType === 'catering') updateData.price_per_person = editingItem.price_per_person;
    else if (activeType === 'watersports') { updateData.price_per_hour = editingItem.price_per_hour; updateData.price_per_day = editingItem.price_per_day; }
    else updateData.price = editingItem.price;
    const { error } = await supabase.from(table).update(updateData).eq('id', editingItem.id);
    if (error) { showMessage('Ошибка: ' + error.message, 'error'); }
    else { showMessage('Сохранено!'); setEditingItem(null); loadAllData(); }
  };

  const tabs = [
    { type: 'boats' as ImportType, icon: '🚢', label: 'Яхты', count: boats.length, color: '#60a5fa', bg: '#eff6ff', border: '#2563eb', partners: boatPartners.length },
    { type: 'catering' as ImportType, icon: '🍽️', label: 'Кейтеринг', count: cateringMenu.length, color: '#ea580c', bg: '#fff7ed', border: '#ea580c', partners: cateringPartners.length },
    { type: 'watersports' as ImportType, icon: '🏄', label: 'Водные игрушки', count: watersportsCatalog.length, color: '#0891b2', bg: '#ecfeff', border: '#0891b2', partners: watersportsPartners.length },
    { type: 'decorations' as ImportType, icon: '✨', label: 'Декор', count: decorationCatalog.length, color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed', partners: decorationPartners.length },
  ];

  const activeTab = tabs.find(t => t.type === activeType)!;

  const getItemsForPartner = (partnerId: number) => {
    if (activeType === 'catering') return cateringMenu.filter(m => m.partner_id === partnerId);
    if (activeType === 'watersports') return watersportsCatalog.filter(w => w.partner_id === partnerId);
    if (activeType === 'decorations') return decorationCatalog.filter(d => d.partner_id === partnerId);
    return boats.filter(b => b.partner_id === partnerId);
  };

  const getItemPrice = (item: any) => {
    if (activeType === 'catering') return item.price_per_person + ' THB/чел';
    if (activeType === 'watersports') return item.price_per_hour + ' THB/час';
    return item.price + ' THB';
  };

  const getTableName = () => {
    if (activeType === 'catering') return 'catering_menu';
    if (activeType === 'watersports') return 'watersports_catalog';
    return 'decoration_catalog';
  };

  return (
    <AdminGuard>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'var(--os-card, #112233)',
        borderBottom: '1px solid var(--os-border, rgba(255,255,255,0.08))',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a href="/admin" style={{
          color: 'var(--os-aqua, #00D4B4)',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
        }}>⚙️ ← Назад в админку</a>
      </div>
      <div style={{minHeight:'100vh',backgroundColor:'#0C1825'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px'}}>
          <div>
            <h1 style={{fontSize:'28px',fontWeight:'800',color:'#0f172a',margin:0}}>📦 Центр импорта</h1>
            <p style={{color:'#6b7280',margin:'4px 0 0',fontSize:'14px'}}>Импорт прайсов и каталогов партнёров</p>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <a href="/partners" style={{padding:'10px 18px',backgroundColor:'#132840',borderRadius:'10px',color:'#cbd5e1',textDecoration:'none',fontWeight:'500',border:'1px solid rgba(255,255,255,0.08)',fontSize:'14px'}}>👥 Партнёры</a>
            <a href="/" style={{padding:'10px 18px',backgroundColor:'#2563eb',borderRadius:'10px',color:'white',textDecoration:'none',fontWeight:'500',fontSize:'14px',boxShadow:'0 2px 8px rgba(37,99,235,0.3)'}}>← Калькулятор</a>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'12px',marginBottom:'24px'}}>
          {tabs.map(tab => (
            <button key={tab.type}
              onClick={() => { setActiveType(tab.type); setSelectedPartnerId(null); setParsedItems([]); setContractText(''); }}
              style={{
                display:'flex',alignItems:'center',gap:'12px',padding:'16px 20px',
                backgroundColor: activeType===tab.type ? tab.bg : '#132840',
                border: activeType===tab.type ? '2px solid '+tab.border : '1px solid #e5e7eb',
                borderRadius:'14px',cursor:'pointer',transition:'all 0.2s',
                boxShadow: activeType===tab.type ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
              <span style={{fontSize:'28px'}}>{tab.icon}</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:'22px',fontWeight:'700',color:tab.color}}>{tab.count}</div>
                <div style={{fontSize:'13px',color:'#6b7280',fontWeight:'500'}}>{tab.label}</div>
                <div style={{fontSize:'11px',color:'#9ca3af'}}>{tab.partners} партнёров</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{backgroundColor:'#132840',borderRadius:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',overflow:'hidden'}}>

          {/* Content Header */}
          <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'24px'}}>{activeTab.icon}</span>
            <h2 style={{margin:0,fontSize:'18px',fontWeight:'700',color:'#0f172a'}}>
              {activeType === 'boats' ? 'Импорт яхт' : 'Импорт: ' + activeTab.label}
            </h2>
          </div>

          <div style={{padding:'24px'}}>
            {message && (
              <div style={{padding:'12px 16px',borderRadius:'10px',marginBottom:'20px',
                backgroundColor:messageType==='success'?'#0e3a2a':'#2a0e0e',
                color:messageType==='success'?'#065f46':'#991b1b',fontSize:'14px'}}>
                {message}
              </div>
            )}

            {/* BOATS — redirect to /import */}
            {activeType === 'boats' && (
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:'48px',marginBottom:'16px'}}>🚢</div>
                <h3 style={{fontSize:'20px',fontWeight:'700',color:'#1e40af',margin:'0 0 12px'}}>AI-импорт контрактов яхт</h3>
                <p style={{color:'#6b7280',marginBottom:'24px',maxWidth:'400px',margin:'0 auto 24px'}}>
                  Вставьте контракт партнёра и AI автоматически распознает лодки, маршруты, цены и опции
                </p>
                <a href="/import" style={{
                  display:'inline-block',padding:'14px 32px',
                  background:'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color:'white',borderRadius:'12px',textDecoration:'none',fontWeight:'600',fontSize:'16px',
                  boxShadow:'0 4px 15px rgba(37,99,235,0.3)',transition:'transform 0.2s'
                }}>
                  🤖 Открыть AI-парсер контрактов
                </a>
              </div>
            )}

            {/* CATERING / WATERSPORTS / DECORATIONS — import form */}
            {activeType !== 'boats' && (
              <div>
                {/* Partner Selection */}
                <div style={{marginBottom:'20px'}}>
                  <label style={{display:'block',fontSize:'14px',fontWeight:'600',marginBottom:'8px',color:'#cbd5e1'}}>Партнёр</label>
                  <div style={{display:'flex',gap:'10px'}}>
                    <select value={selectedPartnerId||''} onChange={e => setSelectedPartnerId(e.target.value ? Number(e.target.value) : null)}
                      style={{flex:1,padding:'10px 14px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',fontSize:'14px',backgroundColor:'#0f2337'}}>
                      <option value="">Выберите партнёра...</option>
                      {getCurrentPartners().map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input placeholder="Новый партнёр..." value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)}
                      style={{width:'200px',padding:'10px 14px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',fontSize:'14px'}} />
                    <button onClick={createPartner} disabled={!newPartnerName.trim()}
                      style={{padding:'10px 20px',backgroundColor:'#10b981',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'600',opacity:newPartnerName.trim()?1:0.5,whiteSpace:'nowrap'}}>
                      + Создать
                    </button>
                  </div>
                </div>

                {/* Price Text */}
                <div style={{marginBottom:'20px'}}>
                  <label style={{display:'block',fontSize:'14px',fontWeight:'600',marginBottom:'8px',color:'#cbd5e1'}}>Прайс-лист</label>
                  <textarea value={contractText} onChange={e => setContractText(e.target.value)}
                    placeholder={'Вставьте прайс партнёра:\nТом Ям — 350 THB\nПад Тай — 250 THB\nBBQ Seafood — 1500 THB'}
                    style={{width:'100%',padding:'14px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',minHeight:'140px',fontFamily:'monospace',fontSize:'13px',backgroundColor:'#0f2337',resize:'vertical'}} />
                </div>

                {/* Action Buttons */}
                <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
                  <button onClick={analyzePrice} disabled={loading||!selectedPartnerId||contractText.length<20}
                    style={{padding:'12px 24px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'14px',opacity:loading||!selectedPartnerId||contractText.length<20?0.5:1}}>
                    {loading ? '⏳ Анализ...' : '🤖 AI-распознавание'}
                  </button>
                  <button onClick={parseSimple} disabled={!selectedPartnerId||contractText.length<10}
                    style={{padding:'12px 24px',backgroundColor:'#132840',color:'#cbd5e1',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',cursor:'pointer',fontWeight:'500',fontSize:'14px',opacity:selectedPartnerId&&contractText.length>=10?1:0.5}}>
                    📝 Простой парсинг
                  </button>
                </div>

                {/* Parsed Items */}
                {parsedItems.length > 0 && (
                  <div style={{border:'1px solid #d1fae5',borderRadius:'12px',overflow:'hidden',marginBottom:'24px'}}>
                    <div style={{padding:'14px 20px',backgroundColor:'#0d2137',borderBottom:'1px solid rgba(46,204,113,0.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <strong style={{color:'#065f46'}}>✅ Распознано {parsedItems.length} позиций</strong>
                      <button onClick={saveItems} disabled={loading}
                        style={{padding:'8px 20px',backgroundColor:'#10b981',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>
                        💾 Сохранить все
                      </button>
                    </div>
                    {parsedItems.map((item: any, idx: number) => (
                      <div key={idx} style={{display:'flex',alignItems:'center',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',gap:'10px',backgroundColor:idx%2===0?'#132840':'#0f2337'}}>
                        <span style={{color:'#9ca3af',fontSize:'12px',width:'24px'}}>{idx+1}</span>
                        <input value={item.name_en||''} onChange={e => updateItem(idx,'name_en',e.target.value)}
                          style={{flex:2,padding:'8px 10px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'13px'}} placeholder="Name EN" />
                        <input value={item.name_ru||''} onChange={e => updateItem(idx,'name_ru',e.target.value)}
                          style={{flex:2,padding:'8px 10px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'13px'}} placeholder="Название RU" />
                        <input type="number" value={item.price||0} onChange={e => updateItem(idx,'price',Number(e.target.value))}
                          style={{width:'90px',padding:'8px 10px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'13px',textAlign:'right'}} />
                        <span style={{fontSize:'12px',color:'#6b7280'}}>THB</span>
                        <button onClick={() => removeItem(idx)}
                          style={{padding:'6px 10px',backgroundColor:'#2a0e0e',color:'#f87171',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Items by Partner */}
                {selectedPartnerId && (
                  <div>
                    <h3 style={{fontSize:'16px',fontWeight:'600',color:'#cbd5e1',marginBottom:'12px'}}>
                      📋 Текущие позиции ({getItemsForPartner(selectedPartnerId).length})
                    </h3>
                    {getItemsForPartner(selectedPartnerId).length === 0 ? (
                      <p style={{color:'#9ca3af',fontStyle:'italic',fontSize:'14px'}}>Нет позиций. Импортируйте прайс выше.</p>
                    ) : (
                      <div style={{border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden'}}>
                        {getItemsForPartner(selectedPartnerId).map((item: any, idx: number) => (
                          <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)',backgroundColor:idx%2===0?'#132840':'#0f2337'}}>
                            {editingItem?.id === item.id ? (
                              <>
                                <input value={editingItem.name_en||''} onChange={e => setEditingItem({...editingItem, name_en: e.target.value})}
                                  style={{flex:1,padding:'6px 8px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',fontSize:'13px',marginRight:'8px'}} />
                                <input value={editingItem.name_ru||''} onChange={e => setEditingItem({...editingItem, name_ru: e.target.value})}
                                  style={{flex:1,padding:'6px 8px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',fontSize:'13px',marginRight:'8px'}} />
                                <input type="number" value={activeType==='catering'?editingItem.price_per_person:activeType==='watersports'?editingItem.price_per_hour:editingItem.price}
                                  onChange={e => {
                                    const v = Number(e.target.value);
                                    if (activeType==='catering') setEditingItem({...editingItem, price_per_person: v});
                                    else if (activeType==='watersports') setEditingItem({...editingItem, price_per_hour: v});
                                    else setEditingItem({...editingItem, price: v});
                                  }}
                                  style={{width:'80px',padding:'6px 8px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',fontSize:'13px',textAlign:'right',marginRight:'8px'}} />
                                <button onClick={saveEditItem} style={{padding:'4px 12px',backgroundColor:'#10b981',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginRight:'4px'}}>✓</button>
                                <button onClick={() => setEditingItem(null)} style={{padding:'4px 12px',backgroundColor:'#132840',color:'#cbd5e1',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>✕</button>
                              </>
                            ) : (
                              <>
                                <div style={{flex:1}}>
                                  <span style={{fontWeight:'500',fontSize:'14px'}}>{item.name_en || item.name}</span>
                                  {item.name_ru && item.name_ru !== item.name_en && (
                                    <span style={{marginLeft:'8px',fontSize:'12px',color:'#9ca3af'}}>{item.name_ru}</span>
                                  )}
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                  <span style={{fontWeight:'600',fontSize:'14px',color:activeTab.color}}>{getItemPrice(item)}</span>
                                  <button onClick={() => setEditingItem({...item})}
                                    style={{padding:'4px 10px',backgroundColor:'#0d2137',color:'#60a5fa',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                                  <button onClick={() => deleteItem(getTableName(), item.id)}
                                    style={{padding:'4px 10px',backgroundColor:'#2a0e0e',color:'#f87171',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>🗑️</button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && activeType === 'boats' && null}
    </div>
    </AdminGuard>
  );
}
