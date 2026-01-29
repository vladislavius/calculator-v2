'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<'catering' | 'watersports'>('catering');
  const [cateringPartners, setCateringPartners] = useState<any[]>([]);
  const [cateringMenu, setCateringMenu] = useState<any[]>([]);
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  
  // New partner form
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerContact, setNewPartnerContact] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerDescription, setNewPartnerDescription] = useState('');
  
  // Menu import
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [menuText, setMenuText] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: cp } = await supabase.from('catering_partners').select('*').order('name');
    if (cp) setCateringPartners(cp);
    
    const { data: cm } = await supabase.from('catering_menu').select('*').order('name_en');
    if (cm) setCateringMenu(cm);
    
    const { data: wp } = await supabase.from('watersports_partners').select('*').order('name');
    if (wp) setWatersportsPartners(wp);
    
    const { data: wc } = await supabase.from('watersports_catalog').select('*').order('name_en');
    if (wc) setWatersportsCatalog(wc);
  };

  const addCateringPartner = async () => {
    if (!newPartnerName) return;
    
    const { error } = await supabase.from('catering_partners').insert({
      name: newPartnerName,
      contact_person: newPartnerContact,
      phone: newPartnerPhone,
      email: newPartnerEmail,
      description: newPartnerDescription
    });
    
    if (!error) {
      setMessage('Партнёр добавлен!');
      setNewPartnerName('');
      setNewPartnerContact('');
      setNewPartnerPhone('');
      setNewPartnerEmail('');
      setNewPartnerDescription('');
      loadData();
    } else {
      setMessage('Ошибка: ' + error.message);
    }
  };

  const addWatersportsPartner = async () => {
    if (!newPartnerName) return;
    
    const { error } = await supabase.from('watersports_partners').insert({
      name: newPartnerName,
      contact_person: newPartnerContact,
      phone: newPartnerPhone,
      email: newPartnerEmail
    });
    
    if (!error) {
      setMessage('Партнёр добавлен!');
      setNewPartnerName('');
      setNewPartnerContact('');
      setNewPartnerPhone('');
      setNewPartnerEmail('');
      loadData();
    } else {
      setMessage('Ошибка: ' + error.message);
    }
  };

  const importCateringMenu = async () => {
    if (!selectedPartnerId || !menuText.trim()) return;
    setImporting(true);
    setMessage('');
    
    try {
      // Parse menu text - expecting format: "Name | Name RU | Price per person | Min persons | Category"
      // Or simple: "Name - Price THB"
      const lines = menuText.split('\n').filter(l => l.trim());
      const items: any[] = [];
      
      for (const line of lines) {
        // Try format: Name | Price | Min | Category
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            items.push({
              partner_id: selectedPartnerId,
              name_en: parts[0],
              name_ru: parts[1] || parts[0],
              price_per_person: parseFloat(parts[2]?.replace(/[^\d.]/g, '')) || 0,
              min_persons: parseInt(parts[3]) || 1,
              category: parts[4] || 'main'
            });
          }
        } 
        // Try format: Name - Price THB
        else if (line.includes(' - ') || line.includes(' — ')) {
          const parts = line.split(/\s[-—]\s/);
          if (parts.length >= 2) {
            const price = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0;
            items.push({
              partner_id: selectedPartnerId,
              name_en: parts[0].trim(),
              name_ru: parts[0].trim(),
              price_per_person: price,
              min_persons: 1,
              category: 'main'
            });
          }
        }
        // Simple format: just name and try to extract price
        else {
          const priceMatch = line.match(/(\d+(?:,\d+)?)\s*(?:THB|฿|бат)?/i);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
          const name = line.replace(/(\d+(?:,\d+)?)\s*(?:THB|฿|бат)?/gi, '').trim();
          if (name) {
            items.push({
              partner_id: selectedPartnerId,
              name_en: name,
              name_ru: name,
              price_per_person: price,
              min_persons: 1,
              category: 'main'
            });
          }
        }
      }
      
      if (items.length > 0) {
        const { error } = await supabase.from('catering_menu').insert(items);
        if (!error) {
          setMessage(`Импортировано ${items.length} позиций!`);
          setMenuText('');
          loadData();
        } else {
          setMessage('Ошибка: ' + error.message);
        }
      } else {
        setMessage('Не удалось распознать позиции меню');
      }
    } catch (e: any) {
      setMessage('Ошибка парсинга: ' + e.message);
    }
    setImporting(false);
  };

  const importWatersportsCatalog = async () => {
    if (!selectedPartnerId || !menuText.trim()) return;
    setImporting(true);
    setMessage('');
    
    try {
      // Parse format: "Name | Price/hour | Price/day" or "Name - Price THB"
      const lines = menuText.split('\n').filter(l => l.trim());
      const items: any[] = [];
      
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            items.push({
              partner_id: selectedPartnerId,
              name_en: parts[0],
              name_ru: parts[1] || parts[0],
              price_per_hour: parseFloat(parts[2]?.replace(/[^\d.]/g, '')) || 0,
              price_per_day: parseFloat(parts[3]?.replace(/[^\d.]/g, '')) || 0,
              description: parts[4] || ''
            });
          }
        } else {
          const priceMatch = line.match(/(\d+(?:,\d+)?)\s*(?:THB|฿)?/i);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
          const name = line.replace(/(\d+(?:,\d+)?)\s*(?:THB|฿)?/gi, '').replace(/[-—]/g, '').trim();
          if (name) {
            items.push({
              partner_id: selectedPartnerId,
              name_en: name,
              name_ru: name,
              price_per_hour: price,
              price_per_day: price * 5,
              description: ''
            });
          }
        }
      }
      
      if (items.length > 0) {
        const { error } = await supabase.from('watersports_catalog').insert(items);
        if (!error) {
          setMessage(`Импортировано ${items.length} позиций!`);
          setMenuText('');
          loadData();
        } else {
          setMessage('Ошибка: ' + error.message);
        }
      } else {
        setMessage('Не удалось распознать позиции');
      }
    } catch (e: any) {
      setMessage('Ошибка парсинга: ' + e.message);
    }
    setImporting(false);
  };

  const deleteMenuItem = async (table: string, id: number) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) loadData();
  };

  const deletePartner = async (table: string, id: number) => {
    // First delete related items
    if (table === 'catering_partners') {
      await supabase.from('catering_menu').delete().eq('partner_id', id);
    } else {
      await supabase.from('watersports_catalog').delete().eq('partner_id', id);
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) loadData();
  };

  const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' },
    header: { maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    backLink: { color: '#2563eb', textDecoration: 'none', fontSize: '14px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '1200px', margin: '0 auto 20px' },
    tab: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    tabActive: { backgroundColor: '#2563eb', color: 'white' },
    tabInactive: { backgroundColor: 'white', color: '#6b7280' },
    content: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    cardTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' },
    input: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', fontSize: '14px' },
    textarea: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', fontSize: '13px', minHeight: '150px', fontFamily: 'monospace' },
    btn: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    btnDanger: { padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
    select: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', fontSize: '14px' },
    list: { maxHeight: '300px', overflowY: 'auto' as const },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' },
    message: { padding: '10px', backgroundColor: '#d1fae5', borderRadius: '6px', marginBottom: '15px', color: '#065f46' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Управление партнёрами</h1>
        <a href="/" style={styles.backLink}>← Назад к калькулятору</a>
      </div>

      <div style={styles.tabs}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'catering' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('catering')}
        >
          🍽️ Кейтеринг ({cateringPartners.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'watersports' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('watersports')}
        >
          🏄 Водные игрушки ({watersportsPartners.length})
        </button>
      </div>

      {message && <div style={{ ...styles.message, maxWidth: '1200px', margin: '0 auto 20px' }}>{message}</div>}

      <div style={styles.content}>
        {/* Left: Add Partner & Import */}
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>➕ Добавить партнёра</h3>
            <input 
              placeholder="Название компании *" 
              value={newPartnerName} 
              onChange={e => setNewPartnerName(e.target.value)} 
              style={styles.input} 
            />
            <input 
              placeholder="Контактное лицо" 
              value={newPartnerContact} 
              onChange={e => setNewPartnerContact(e.target.value)} 
              style={styles.input} 
            />
            <input 
              placeholder="Телефон" 
              value={newPartnerPhone} 
              onChange={e => setNewPartnerPhone(e.target.value)} 
              style={styles.input} 
            />
            <input 
              placeholder="Email" 
              value={newPartnerEmail} 
              onChange={e => setNewPartnerEmail(e.target.value)} 
              style={styles.input} 
            />
            {activeTab === 'catering' && (
              <input 
                placeholder="Описание" 
                value={newPartnerDescription} 
                onChange={e => setNewPartnerDescription(e.target.value)} 
                style={styles.input} 
              />
            )}
            <button 
              style={styles.btn} 
              onClick={activeTab === 'catering' ? addCateringPartner : addWatersportsPartner}
            >
              Добавить партнёра
            </button>
          </div>

          <div style={{ ...styles.card, marginTop: '20px' }}>
            <h3 style={styles.cardTitle}>📄 Импорт прайса</h3>
            <select 
              value={selectedPartnerId || ''} 
              onChange={e => setSelectedPartnerId(Number(e.target.value))} 
              style={styles.select}
            >
              <option value="">Выберите партнёра</option>
              {(activeTab === 'catering' ? cateringPartners : watersportsPartners).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <textarea 
              placeholder={activeTab === 'catering' 
                ? "Вставьте меню в формате:\nНазвание | Название RU | Цена | Мин. чел | Категория\n\nИли просто:\nТом Ям - 350 THB\nПад Тай - 250 THB"
                : "Вставьте прайс в формате:\nНазвание | Название RU | Цена/час | Цена/день\n\nИли просто:\nSeabob - 3000 THB\nJet Ski - 2500 THB"
              }
              value={menuText}
              onChange={e => setMenuText(e.target.value)}
              style={styles.textarea}
            />
            
            <button 
              style={{ ...styles.btn, opacity: importing || !selectedPartnerId ? 0.6 : 1 }}
              onClick={activeTab === 'catering' ? importCateringMenu : importWatersportsCatalog}
              disabled={importing || !selectedPartnerId}
            >
              {importing ? 'Импорт...' : 'Импортировать'}
            </button>
          </div>
        </div>

        {/* Right: Current Partners & Items */}
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              {activeTab === 'catering' ? '🍽️ Партнёры по кейтерингу' : '🏄 Партнёры по водным игрушкам'}
            </h3>
            <div style={styles.list}>
              {(activeTab === 'catering' ? cateringPartners : watersportsPartners).map(partner => (
                <div key={partner.id}>
                  <div style={{ ...styles.listItem, backgroundColor: '#f9fafb', fontWeight: '600' }}>
                    <span>{partner.name}</span>
                    <button 
                      style={styles.btnDanger}
                      onClick={() => deletePartner(activeTab === 'catering' ? 'catering_partners' : 'watersports_partners', partner.id)}
                    >
                      Удалить
                    </button>
                  </div>
                  {/* Show items for this partner */}
                  {(activeTab === 'catering' 
                    ? cateringMenu.filter(m => m.partner_id === partner.id)
                    : watersportsCatalog.filter(w => w.partner_id === partner.id)
                  ).map(item => (
                    <div key={item.id} style={{ ...styles.listItem, paddingLeft: '20px', fontSize: '13px' }}>
                      <span>
                        {item.name_en} — 
                        {activeTab === 'catering' 
                          ? ` ${item.price_per_person} THB/чел`
                          : ` ${item.price_per_hour || 0} THB/час, ${item.price_per_day || 0} THB/день`
                        }
                      </span>
                      <button 
                        style={styles.btnDanger}
                        onClick={() => deleteMenuItem(activeTab === 'catering' ? 'catering_menu' : 'watersports_catalog', item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
