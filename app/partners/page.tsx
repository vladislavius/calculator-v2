'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  return _supabase;
};

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<'catering' | 'watersports' | 'boats'>('boats');
  const [cateringPartners, setCateringPartners] = useState<any[]>([]);
  const [cateringMenu, setCateringMenu] = useState<any[]>([]);
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  const [boatPartners, setBoatPartners] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPartners, setExpandedPartners] = useState<Set<number>>(new Set());
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editingOtherPartner, setEditingOtherPartner] = useState<any>(null);
  const [editOtherForm, setEditOtherForm] = useState<any>({});
  const [editingServiceItem, setEditingServiceItem] = useState<any>(null);
  const [editServiceForm, setEditServiceForm] = useState<any>({});

  const [selectedBoat, setSelectedBoat] = useState<any>(null);
  const [boatRoutes, setBoatRoutes] = useState<any[]>([]);
  const [boatPrices, setBoatPrices] = useState<any[]>([]);
  const [boatOptions, setBoatOptions] = useState<any[]>([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [newPriceRoute, setNewPriceRoute] = useState<number | 'new'>(0);
  const [newRouteName, setNewRouteName] = useState('');
  const [newPriceSeason, setNewPriceSeason] = useState('low');
  const [newPriceSlot, setNewPriceSlot] = useState('full_day');
  const [newPriceAgent, setNewPriceAgent] = useState(50000);
  const [newPriceClient, setNewPriceClient] = useState(57500);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Menu editor states
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [menuEditorPartnerId, setMenuEditorPartnerId] = useState<number | null>(null);
  const [partnerMenus, setPartnerMenus] = useState<any[]>([]);
  const [menuSets, setMenuSets] = useState<any[]>([]);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [editingSets, setEditingSets] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Load boat details when selected
  const loadBoatDetails = async (boat: any) => {
    setSelectedBoat(boat);
    setEditMode(false);
    
    // Load all routes for dropdown
    const { data: routes } = await getSupabase()
      .from('routes')
      .select('*')
      .order('name');
    if (routes) setAllRoutes(routes);
    
    // Load prices
    const { data: prices } = await getSupabase()
      .from('route_prices')
      .select('*, routes(*)')
      .eq('boat_id', boat.id)
      .order('season');
    if (prices) setBoatPrices(prices);
    
    // Load boat options
    const { data: options } = await getSupabase()
      .from('boat_options')
      .select('*, options_catalog(*)')
      .eq('boat_id', boat.id);
    if (options) setBoatOptions(options);
  };

  // Save boat changes
  const deleteBoat = async (boatId: number, boatName: string) => {
    if (!confirm(`Удалить лодку "${boatName}"? Это также удалит все её маршруты и цены.`)) return;
    
    try {
      // Delete route prices
      await getSupabase().from('route_prices').delete().eq('boat_id', boatId);
      // Delete boat options
      await getSupabase().from('boat_options').delete().eq('boat_id', boatId);
      // Delete the boat
      const { error } = await getSupabase().from('boats').delete().eq('id', boatId);
      
      if (error) throw error;
      
      // Refresh boats list
      const { data: b } = await getSupabase().from('boats').select('*').order('name');
      if (b) setBoats(b);
      
      setSelectedBoat(null);
      alert('Лодка удалена');
    } catch (err: any) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const saveBoatChanges = async () => {
    if (!selectedBoat) return;
    setSaving(true);
    
    const { error } = await getSupabase()
      .from('boats')
      .update({
        name: selectedBoat.name,
        boat_type: selectedBoat.boat_type,
        length_ft: selectedBoat.length_ft,
        max_pax_day: selectedBoat.max_pax_day,
        cabins: selectedBoat.cabins,
        year_built: selectedBoat.year_built,
        default_pier: selectedBoat.default_pier,
        notes: selectedBoat.notes
      })
      .eq('id', selectedBoat.id);
    
    setSaving(false);
    if (!error) {
      setEditMode(false);
      setMessage('✅ Лодка обновлена!');
      loadData();
    } else {
      setMessage('❌ Ошибка: ' + error.message);
    }
  };

  // Update price
  const updatePrice = async (priceId: number, field: string, value: number | string) => {
    const { error } = await getSupabase()
      .from('route_prices')
      .update({ [field]: value })
      .eq('id', priceId);
    
    if (!error) {
      // Update local state
      setBoatPrices(boatPrices.map(p => 
        p.id === priceId ? { ...p, [field]: value } : p
      ));
    }
  };

  // Open add price modal
  const addBoatPrice = () => {
    if (!selectedBoat) return;
    setNewPriceRoute(allRoutes[0]?.id || 0);
    setNewRouteName('');
    setNewPriceSeason('low');
    setNewPriceSlot('full_day');
    setNewPriceAgent(50000);
    setNewPriceClient(57500);
    setShowAddPriceModal(true);
  };

  // Save new price from modal
  const saveNewPrice = async () => {
    if (!selectedBoat) return;
    
    let routeId: number = typeof newPriceRoute === 'number' ? newPriceRoute : 0;
    
    // If creating new route
    if (newPriceRoute === 'new' && newRouteName.trim()) {
      const { data: newRoute, error: routeError } = await getSupabase()
        .from('routes')
        .insert({ name: newRouteName.trim() })
        .select('id')
        .single();
      
      if (routeError) {
        setMessage('❌ Ошибка создания маршрута: ' + routeError.message);
        return;
      }
      routeId = newRoute.id;
      setAllRoutes([...allRoutes, { id: newRoute.id, name: newRouteName.trim() }]);
    }
    
    const { data: newPrice, error } = await getSupabase()
      .from('route_prices')
      .insert({
        boat_id: selectedBoat.id,
        route_id: routeId,
        season: newPriceSeason,
        time_slot: newPriceSlot,
        base_price: newPriceAgent,
        agent_price: newPriceAgent,
        client_price: newPriceClient,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '2027-12-31'
      })
      .select('*, routes(*)')
      .single();
    
    if (error) {
      setMessage('❌ ' + error.message);
      return;
    }
    
    if (newPrice) {
      setBoatPrices([...boatPrices, newPrice]);
      setMessage('✅ Цена добавлена');
      setShowAddPriceModal(false);
    }
  };

  // Delete price
  const deletePrice = async (priceId: number) => {
    if (!confirm('Удалить эту цену?')) return;
    
    const { error } = await getSupabase()
      .from('route_prices')
      .delete()
      .eq('id', priceId);
    
    if (!error) {
      setBoatPrices(boatPrices.filter(p => p.id !== priceId));
      setMessage('✅ Цена удалена');
    }
  };

  // Toggle boat option (included/paid)
  const toggleBoatOption = async (optionId: number, field: string, value: boolean | number) => {
    const { error } = await getSupabase()
      .from('boat_options')
      .update({ [field]: value })
      .eq('id', optionId);
    
    if (!error) {
      setBoatOptions(boatOptions.map(o => 
        o.id === optionId ? { ...o, [field]: value } : o
      ));
    }
  };

  // Delete boat option
  const deleteBoatOption = async (optionId: number) => {
    const { error } = await getSupabase()
      .from('boat_options')
      .delete()
      .eq('id', optionId);
    
    if (!error) {
      setBoatOptions(boatOptions.filter(o => o.id !== optionId));
    }
  };
  
  const togglePartnerExpand = (id: number) => {
    const newSet = new Set(expandedPartners);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedPartners(newSet);
  };
  
  const filteredBoatPartners = boatPartners.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    boats.some((b: any) => b.partner_id === p.id && b.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // New partner form
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerContact, setNewPartnerContact] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerDescription, setNewPartnerDescription] = useState('');
  const [newPartnerCommission, setNewPartnerCommission] = useState('');
  const [newPartnerBankName, setNewPartnerBankName] = useState('');
  const [newPartnerBankAccount, setNewPartnerBankAccount] = useState('');
  const [newPartnerBankAccountName, setNewPartnerBankAccountName] = useState('');
  const [newPartnerBankBranch, setNewPartnerBankBranch] = useState('');
  const [newPartnerSwift, setNewPartnerSwift] = useState('');
  const [newPartnerTaxId, setNewPartnerTaxId] = useState('');
  const [newPartnerAddress, setNewPartnerAddress] = useState('');
  const [newPartnerWebsite, setNewPartnerWebsite] = useState('');
  
  // Menu import
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [menuText, setMenuText] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: cp } = await getSupabase().from('catering_partners').select('*').order('name');
    if (cp) setCateringPartners(cp);
    
    const { data: cm } = await getSupabase().from('catering_menu').select('*').order('name_en');
    if (cm) setCateringMenu(cm);
    
    const { data: wp } = await getSupabase().from('watersports_partners').select('*').order('name');
    if (wp) setWatersportsPartners(wp);
    
    const { data: wc } = await getSupabase().from('watersports_catalog').select('*').order('name_en');
    if (wc) setWatersportsCatalog(wc);

    const { data: bp } = await getSupabase().from('partners').select('*').order('name');
    if (bp) setBoatPartners(bp);

    const { data: b } = await getSupabase().from('boats').select('*').order('name');
    if (b) setBoats(b);
  };

  const addCateringPartner = async () => {
    if (!newPartnerName) return;
    
    const { error } = await getSupabase().from('catering_partners').insert({
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
    
    const { error } = await getSupabase().from('watersports_partners').insert({
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

  const addBoatPartner = async () => {
    if (!newPartnerName) return;

    const { error } = await getSupabase().from('partners').insert({
      name: newPartnerName,
      contact_name: newPartnerContact || null,
      contact_phone: newPartnerPhone || null,
      contact_email: newPartnerEmail || null,
      commission_percent: newPartnerCommission ? Number(newPartnerCommission) : null,
      notes: newPartnerDescription || null,
      bank_name: newPartnerBankName || null,
      bank_account_number: newPartnerBankAccount || null,
      bank_account_name: newPartnerBankAccountName || null,
      bank_branch: newPartnerBankBranch || null,
      swift_code: newPartnerSwift || null,
      tax_id: newPartnerTaxId || null,
      address: newPartnerAddress || null,
      website: newPartnerWebsite || null,
    });

    if (!error) {
      setMessage('Партнёр добавлен!');
      setNewPartnerName('');
      setNewPartnerContact('');
      setNewPartnerPhone('');
      setNewPartnerEmail('');
      setNewPartnerDescription('');
      setNewPartnerCommission('');
      setNewPartnerBankName('');
      setNewPartnerBankAccount('');
      setNewPartnerBankAccountName('');
      setNewPartnerBankBranch('');
      setNewPartnerSwift('');
      setNewPartnerTaxId('');
      setNewPartnerAddress('');
      setNewPartnerWebsite('');
      loadData();
    } else {
      setMessage('Ошибка: ' + error.message);
    }
  };

  const deleteBoatPartner = async (id: number) => {
    const partnerBoats = boats.filter((b: any) => b.partner_id === id);
    if (partnerBoats.length > 0) {
      if (!confirm('У этого партнёра есть ' + partnerBoats.length + ' лодок. Удалить партнёра и все его данные (лодки, цены, опции)?')) {
        return;
      }
      // Получаем ID всех лодок партнёра
      const boatIds = partnerBoats.map((b: any) => b.id);
      
      // Удаляем в правильном порядке (из-за foreign keys)
      // 1. Удаляем boat_options
      await getSupabase().from('boat_options').delete().in('boat_id', boatIds);
      // 2. Удаляем route_prices
      await getSupabase().from('route_prices').delete().in('boat_id', boatIds);
      // 3. Удаляем лодки
      await getSupabase().from('boats').delete().eq('partner_id', id);
    }
    // 4. Удаляем partner_menus
    await getSupabase().from('partner_menus').delete().eq('partner_id', id);
    // 5. Удаляем партнёра
    const { error } = await getSupabase().from('partners').delete().eq('id', id);
    if (!error) {
      setMessage('Партнёр и все связанные данные удалены');
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
        const { error } = await getSupabase().from('catering_menu').insert(items);
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
        const { error } = await getSupabase().from('watersports_catalog').insert(items);
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
    const { error } = await getSupabase().from(table).delete().eq('id', id);
    if (!error) loadData();
  };

  const deletePartner = async (table: string, id: number) => {
    // First delete related items
    if (table === 'catering_partners') {
      await getSupabase().from('catering_menu').delete().eq('partner_id', id);
    } else {
      await getSupabase().from('watersports_catalog').delete().eq('partner_id', id);
    }
    const { error } = await getSupabase().from(table).delete().eq('id', id);
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

  // ==================== MENU EDITOR FUNCTIONS ====================
  const openMenuEditor = async (partnerId: number) => {
    setMenuEditorPartnerId(partnerId);
    setMenuEditorOpen(true);
    setMenuLoading(true);
    
    try {
      // Load partner menus
      const { data: menus } = await getSupabase()
        .from('partner_menus')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('active', true);
      
      setPartnerMenus(menus || []);
      
      // Load all menu sets for these menus
      if (menus && menus.length > 0) {
        const menuIds = menus.map((m: any) => m.id);
        const { data: sets } = await getSupabase()
          .from('menu_sets')
          .select('*')
          .in('menu_id', menuIds)
          .eq('active', true)
          .order('sort_order');
        
        setMenuSets(sets || []);
      } else {
        setMenuSets([]);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const closeMenuEditor = () => {
    setMenuEditorOpen(false);
    setMenuEditorPartnerId(null);
    setPartnerMenus([]);
    setMenuSets([]);
    setEditingMenu(null);
    setEditingSets([]);
  };

  const startEditMenu = (menu: any) => {
    setEditingMenu({ ...menu });
    setEditingSets(menuSets.filter(s => s.menu_id === menu.id).map(s => ({ ...s })));
  };

  const saveMenuChanges = async () => {
    if (!editingMenu) return;
    setMenuLoading(true);
    
    try {
      // Update menu
      await getSupabase()
        .from('partner_menus')
        .update({
          name: editingMenu.name,
          type: editingMenu.type,
          conditions: editingMenu.conditions,
          conditions_ru: editingMenu.conditions_ru
        })
        .eq('id', editingMenu.id);
      
      // Update/insert sets
      for (const set of editingSets) {
        if (set.id && !set._isNew) {
          await getSupabase().from('menu_sets').update({
            name: set.name,
            name_ru: set.name_ru,
            category: set.category,
            price: set.price,
            dishes: set.dishes,
            dishes_ru: set.dishes_ru
          }).eq('id', set.id);
        } else if (set._isNew) {
          await getSupabase().from('menu_sets').insert({
            menu_id: editingMenu.id,
            name: set.name,
            name_ru: set.name_ru,
            category: set.category,
            price: set.price,
            dishes: set.dishes || [],
            dishes_ru: set.dishes_ru || [],
            sort_order: editingSets.indexOf(set)
          });
        }
      }
      
      // Reload menus
      await openMenuEditor(menuEditorPartnerId!);
      setEditingMenu(null);
      setEditingSets([]);
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('Ошибка сохранения');
    } finally {
      setMenuLoading(false);
    }
  };

  const addNewSet = () => {
    setEditingSets([...editingSets, {
      _isNew: true,
      name: 'New Set',
      name_ru: 'Новый сет',
      category: 'other',
      price: null,
      dishes: [],
      dishes_ru: []
    }]);
  };

  const deleteSet = async (setId: number) => {
    if (!confirm('Удалить этот сет?')) return;
    
    try {
      await getSupabase().from('menu_sets').update({ active: false }).eq('id', setId);
      setMenuSets(menuSets.filter(s => s.id !== setId));
      setEditingSets(editingSets.filter(s => s.id !== setId));
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const createNewMenu = async () => {
    if (!menuEditorPartnerId) return;
    
    try {
      const { data: newMenu } = await getSupabase()
        .from('partner_menus')
        .insert({
          partner_id: menuEditorPartnerId,
          name: 'Новое меню',
          type: 'included'
        })
        .select()
        .single();
      
      if (newMenu) {
        setPartnerMenus([...partnerMenus, newMenu]);
        startEditMenu(newMenu);
      }
    } catch (error) {
      console.error('Error creating menu:', error);
    }
  };

  const deleteMenu = async (menuId: number) => {
    if (!confirm('Удалить это меню и все его сеты?')) return;
    
    try {
      await getSupabase().from('menu_sets').update({ active: false }).eq('menu_id', menuId);
      await getSupabase().from('partner_menus').update({ active: false }).eq('id', menuId);
      setPartnerMenus(partnerMenus.filter(m => m.id !== menuId));
      setMenuSets(menuSets.filter(s => s.menu_id !== menuId));
    } catch (error) {
      console.error('Error deleting menu:', error);
    }
  };



  const startEditOtherPartner = async (partner: any) => {
    const table = activeTab === 'catering' ? 'catering_partners' : 'watersports_partners';
    const { data } = await getSupabase().from(table).select('*').eq('id', partner.id).single();
    setEditOtherForm(data || partner);
    setEditingOtherPartner(partner.id);
  };

  const saveOtherPartner = async () => {
    if (!editingOtherPartner) return;
    const table = activeTab === 'catering' ? 'catering_partners' : 'watersports_partners';
    const { error } = await getSupabase().from(table).update({
      name: editOtherForm.name,
      contact_person: editOtherForm.contact_person || null,
      phone: editOtherForm.phone || null,
      email: editOtherForm.email || null,
      website: editOtherForm.website || null,
      address: editOtherForm.address || null,
      bank_name: editOtherForm.bank_name || null,
      bank_account_name: editOtherForm.bank_account_name || null,
      bank_account_number: editOtherForm.bank_account_number || null,
      bank_branch: editOtherForm.bank_branch || null,
      swift_code: editOtherForm.swift_code || null,
      tax_id: editOtherForm.tax_id || null,
      notes: editOtherForm.notes || null,
    }).eq('id', editingOtherPartner);
    if (error) { alert('Ошибка: ' + error.message); return; }
    setEditingOtherPartner(null);
    loadData();
  };

  const startEditServiceItem = (item: any) => {
    setEditServiceForm({...item});
    setEditingServiceItem(item.id);
  };

  const saveServiceItem = async () => {
    if (!editingServiceItem) return;
    const table = activeTab === 'catering' ? 'catering_menu' : 'watersports_catalog';
    const updateData: any = { name_en: editServiceForm.name_en, name_ru: editServiceForm.name_ru };
    if (activeTab === 'catering') {
      updateData.price_per_person = editServiceForm.price_per_person;
      updateData.category = editServiceForm.category;
    } else {
      updateData.price_per_hour = editServiceForm.price_per_hour;
      updateData.price_per_day = editServiceForm.price_per_day;
    }
    const { error } = await getSupabase().from(table).update(updateData).eq('id', editingServiceItem);
    if (error) { alert('Ошибка: ' + error.message); return; }
    setEditingServiceItem(null);
    loadData();
  };

  const startEditPartner = async (partner: any) => {
    const { data } = await getSupabase().from('partners').select('*').eq('id', partner.id).single();
    setEditForm(data || partner);
    setEditingPartner(partner.id);
  };

  const savePartner = async () => {
    if (!editingPartner) return;
    const { error } = await getSupabase().from('partners').update({
      name: editForm.name,
      contact_name: editForm.contact_name || null,
      contact_phone: editForm.contact_phone || null,
      contact_email: editForm.contact_email || null,
      website: editForm.website || null,
      address: editForm.address || null,
      commission_percent: editForm.commission_percent || null,
      tax_id: editForm.tax_id || null,
      bank_name: editForm.bank_name || null,
      bank_account_name: editForm.bank_account_name || null,
      bank_account_number: editForm.bank_account_number || null,
      bank_branch: editForm.bank_branch || null,
      swift_code: editForm.swift_code || null,
      contract_valid_from: editForm.contract_valid_from || null,
      contract_valid_until: editForm.contract_valid_until || null,
      notes: editForm.notes || null,
    }).eq('id', editingPartner);
    if (error) { alert('Ошибка: ' + error.message); return; }
    setEditingPartner(null);
    loadData();
  };

  return (
    <div style={styles.page}>
      
      {/* Boat Detail Modal */}
      {selectedBoat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setSelectedBoat(null)}>
          <div 
            style={{
              backgroundColor: 'white', borderRadius: '16px', 
              maxWidth: '900px', width: '100%', maxHeight: '90vh',
              overflow: 'auto', padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🚤 {selectedBoat.name}</h2>
                <p style={{ color: '#666', margin: '4px 0 0' }}>
                  {boatPartners.find((p: any) => p.id === selectedBoat.partner_id)?.name || 'Партнёр не указан'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!editMode ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setEditMode(true)}
                      style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      ✏️ Редактировать
                    </button>
                    <button 
                      onClick={() => deleteBoat(selectedBoat.id, selectedBoat.name)}
                      style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={saveBoatChanges}
                      disabled={saving}
                      style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      {saving ? '💾 Сохранение...' : '💾 Сохранить'}
                    </button>
                    <button 
                      onClick={() => setEditMode(false)}
                      style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Отмена
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedBoat(null)}
                  style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Boat Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Тип</div>
                {editMode ? (
                  <input 
                    value={selectedBoat.boat_type || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, boat_type: e.target.value})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.boat_type || '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Длина</div>
                {editMode ? (
                  <input 
                    type="number"
                    value={selectedBoat.length_ft || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, length_ft: Number(e.target.value)})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.length_ft ? selectedBoat.length_ft + ' ft' : '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Макс. гостей</div>
                {editMode ? (
                  <input 
                    type="number"
                    value={selectedBoat.max_pax_day || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, max_pax_day: Number(e.target.value)})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.max_pax_day || '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Каюты</div>
                {editMode ? (
                  <input 
                    type="number"
                    value={selectedBoat.cabins || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, cabins: Number(e.target.value)})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.cabins || '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Год постройки</div>
                {editMode ? (
                  <input 
                    value={selectedBoat.year_built || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, year_built: e.target.value})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.year_built || '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Пирс</div>
                {editMode ? (
                  <input 
                    value={selectedBoat.default_pier || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, default_pier: e.target.value})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{selectedBoat.default_pier || '-'}</div>
                )}
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Заметки</div>
                {editMode ? (
                  <textarea 
                    value={selectedBoat.notes || ''} 
                    onChange={(e) => setSelectedBoat({...selectedBoat, notes: e.target.value})}
                    style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '60px' }}
                  />
                ) : (
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{selectedBoat.notes || '-'}</div>
                )}
              </div>
            </div>
            
            {/* Prices Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>💰 Цены по маршрутам</h3>
                {editMode && (
                  <button 
                    onClick={addBoatPrice}
                    style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Добавить цену
                  </button>
                )}
              </div>
              {boatPrices.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Маршрут</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Сезон</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Слот</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Агент (THB)</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Клиент (THB)</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {boatPrices.map((price: any) => (
                      <tr key={price.id}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                          {editMode ? (
                            <select 
                              value={price.route_id}
                              onChange={(e) => updatePrice(price.id, 'route_id', Number(e.target.value))}
                              style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', maxWidth: '150px' }}
                            >
                              {allRoutes.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{price.routes?.name || allRoutes.find((r: any) => r.id === price.route_id)?.name || 'Маршрут ' + price.route_id}</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                          {editMode ? (
                            <select 
                              value={price.season || 'low'}
                              onChange={(e) => updatePrice(price.id, 'season', e.target.value)}
                              style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                            >
                              <option value="all">All Seasons</option>
                              <option value="low">Low</option>
                              <option value="high">High</option>
                              <option value="peak">Peak</option>
                            </select>
                          ) : (
                            <span>{price.season}</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                          {editMode ? (
                            <select 
                              value={price.time_slot || 'full_day'}
                              onChange={(e) => updatePrice(price.id, 'time_slot', e.target.value)}
                              style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                            >
                              <option value="half_day">Полдня</option>
                              <option value="full_day">Полный день</option>
                              <option value="sunset">Закат</option>
                              <option value="overnight">Ночёвка</option>
                            </select>
                          ) : (
                            <span>{price.time_slot === 'full_day' ? 'Полный день' : price.time_slot === 'half_day' ? 'Полдня' : price.time_slot === 'sunset' ? 'Закат' : price.time_slot === 'overnight' ? 'Ночёвка' : price.time_slot}</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                          {editMode ? (
                            <input 
                              type="number"
                              value={price.agent_price || 0}
                              onChange={(e) => updatePrice(price.id, 'agent_price', Number(e.target.value))}
                              style={{ width: '90px', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'right', color: '#059669' }}
                            />
                          ) : (
                            <span style={{ color: '#059669' }}>{price.agent_price?.toLocaleString()}</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                          {editMode ? (
                            <input 
                              type="number"
                              value={price.client_price || 0}
                              onChange={(e) => updatePrice(price.id, 'client_price', Number(e.target.value))}
                              style={{ width: '90px', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'right', fontWeight: '600' }}
                            />
                          ) : (
                            <span style={{ fontWeight: '600' }}>{price.client_price?.toLocaleString()}</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                          {editMode && (
                            <button 
                              onClick={() => deletePrice(price.id)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}
                              title="Удалить"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Цены не загружены. Нажмите "+ Добавить цену"</p>
              )}
            </div>
            
            {/* Options Section */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>✅ Опции лодки</h3>
              {boatOptions.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {boatOptions.map((opt: any) => (
                    <div 
                      key={opt.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: opt.included ? '#dcfce7' : '#fef3c7',
                        color: opt.included ? '#166534' : '#92400e',
                        borderRadius: '16px',
                        fontSize: '12px'
                      }}
                    >
                      {editMode ? (
                        <span 
                          onClick={() => toggleBoatOption(opt.id, 'included', !opt.included)}
                          style={{ cursor: 'pointer' }}
                          title={opt.included ? 'Сделать платным' : 'Сделать включённым'}
                        >
                          {opt.included ? '✓' : '💰'}
                        </span>
                      ) : (
                        <span>{opt.included ? '✓' : '💰'}</span>
                      )}
                      <span>{opt.options_catalog?.name_en || opt.option_id}</span>
                      {!opt.included && (
                        editMode ? (
                          <input 
                            type="number"
                            value={opt.price || 0}
                            onChange={(e) => toggleBoatOption(opt.id, 'price', Number(e.target.value))}
                            style={{ width: '60px', padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '11px' }}
                            placeholder="THB"
                          />
                        ) : (
                          <span>+{opt.price || 0} THB</span>
                        )
                      )}
                      {editMode && (
                        <button 
                          onClick={() => deleteBoatOption(opt.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Опции не загружены</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Price Modal */}
      {showAddPriceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowAddPriceModal(false)}>
          <div 
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '450px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>➕ Добавить цену</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Маршрут</label>
              <select 
                value={newPriceRoute}
                onChange={(e) => setNewPriceRoute(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                {allRoutes.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                <option value="new">➕ Создать новый маршрут...</option>
              </select>
            </div>
            
            {newPriceRoute === 'new' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Название нового маршрута</label>
                <input 
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="Например: Coral Island + Racha"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Сезон</label>
                <select 
                  value={newPriceSeason}
                  onChange={(e) => setNewPriceSeason(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                >
                  <option value="all">All Seasons (круглый год)</option>
                  <option value="low">Low Season</option>
                  <option value="high">High Season</option>
                  <option value="peak">Peak Season</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Слот</label>
                <select 
                  value={newPriceSlot}
                  onChange={(e) => setNewPriceSlot(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                >
                  <option value="half_day">Полдня (4-5 ч)</option>
                  <option value="full_day">Полный день (8 ч)</option>
                  <option value="sunset">Закат (3-4 ч)</option>
                  <option value="overnight">Ночёвка</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Цена агента (THB)</label>
                <input 
                  type="number"
                  value={newPriceAgent}
                  onChange={(e) => setNewPriceAgent(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Цена клиента (THB)</label>
                <input 
                  type="number"
                  value={newPriceClient}
                  onChange={(e) => setNewPriceClient(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowAddPriceModal(false)}
                style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button 
                onClick={saveNewPrice}
                style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>👥 Управление партнёрами</h1>
        <div style={{display:'flex',gap:'8px'}}>
          <a href="/import-all" style={{padding:'8px 16px',backgroundColor:'#eff6ff',borderRadius:'8px',color:'#2563eb',textDecoration:'none',fontWeight:'500',border:'1px solid #bfdbfe'}}>📦 Центр импорта</a>
          <a href="/import" style={{padding:'8px 16px',backgroundColor:'#f5f3ff',borderRadius:'8px',color:'#7c3aed',textDecoration:'none',fontWeight:'500',border:'1px solid #ddd6fe'}}>🤖 AI-парсер яхт</a>
          <a href="/" style={{padding:'8px 16px',backgroundColor:'#2563eb',borderRadius:'8px',color:'white',textDecoration:'none',fontWeight:'500'}}>← Калькулятор</a>
        </div>
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
        <button
          style={{ ...styles.tab, ...(activeTab === 'boats' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('boats')}
        >
          🚤 Владельцы яхт ({boatPartners.length})
        </button>
      </div>

      {message && <div style={{ ...styles.message, maxWidth: '1200px', margin: '0 auto 20px' }}>{message}</div>}

      <div style={styles.content}>
        {/* Left: Add Partner & Import */}
        {(activeTab === 'catering' || activeTab === 'watersports') && (
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
              onClick={activeTab === 'catering' ? addCateringPartner : activeTab === 'watersports' ? addWatersportsPartner : addBoatPartner}
            >
              Добавить партнёра
            </button>
          </div>

          {(activeTab === 'catering' || activeTab === 'watersports') && (
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
          )}
        </div>
        )}

        {/* Right: Current Partners & Items */}
        {(activeTab === 'catering' || activeTab === 'watersports') && (
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              {activeTab === 'catering' ? '🍽️ Партнёры по кейтерингу' : '🏄 Партнёры по водным игрушкам'}
            </h3>
            <div style={styles.list}>
              {(activeTab === 'catering' ? cateringPartners : watersportsPartners).map(partner => (
                <div key={partner.id}>
                  <div style={{ ...styles.listItem, backgroundColor: '#f9fafb', fontWeight: '600' }}>
                    <div style={{ flex: 1 }}>
                      <span>{partner.name}</span>
                      {partner.phone && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6b7280' }}>📞 {partner.phone}</span>}
                      {partner.email && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6b7280' }}>✉️ {partner.email}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => startEditOtherPartner(partner)}
                      >
                        ✏️ Редактировать
                      </button>
                      <button 
                        style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => deletePartner(activeTab === 'catering' ? 'catering_partners' : 'watersports_partners', partner.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  {/* Show items for this partner */}
                  {(activeTab === 'catering' 
                    ? cateringMenu.filter(m => m.partner_id === partner.id)
                    : watersportsCatalog.filter(w => w.partner_id === partner.id)
                  ).map(item => (
                    <div key={item.id} style={{ ...styles.listItem, paddingLeft: '20px', fontSize: '13px' }}>
                      {editingServiceItem === item.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
                          <input value={editServiceForm.name_en || ''} onChange={e => setEditServiceForm({...editServiceForm, name_en: e.target.value})}
                            style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                          {activeTab === 'catering' ? (
                            <input type="number" value={editServiceForm.price_per_person || 0} onChange={e => setEditServiceForm({...editServiceForm, price_per_person: Number(e.target.value)})}
                              style={{ width: '80px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                          ) : (
                            <>
                              <input type="number" value={editServiceForm.price_per_hour || 0} onChange={e => setEditServiceForm({...editServiceForm, price_per_hour: Number(e.target.value)})}
                                style={{ width: '70px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} placeholder="час" />
                              <input type="number" value={editServiceForm.price_per_day || 0} onChange={e => setEditServiceForm({...editServiceForm, price_per_day: Number(e.target.value)})}
                                style={{ width: '70px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} placeholder="день" />
                            </>
                          )}
                          <button onClick={saveServiceItem} style={{ padding: '4px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                          <button onClick={() => setEditingServiceItem(null)} style={{ padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ flex: 1 }}>
                            {item.name_en} — 
                            {activeTab === 'catering' 
                              ? ` ${item.price_per_person} THB/чел`
                              : ` ${item.price_per_hour || 0} THB/час, ${item.price_per_day || 0} THB/день`
                            }
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => startEditServiceItem(item)}
                              style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                            <button 
                              style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              onClick={() => deleteMenuItem(activeTab === 'catering' ? 'catering_menu' : 'watersports_catalog', item.id)}
                            >✕</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Boats Tab Content */}
        {activeTab === 'boats' && (
          <>
            <div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>➕ Добавить владельца яхт</h3>
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
                <input
                  placeholder="Комиссия %"
                  type="number"
                  value={newPartnerCommission}
                  onChange={e => setNewPartnerCommission(e.target.value)}
                  style={styles.input}
                />
                <input
                  placeholder="Адрес"
                  value={newPartnerAddress}
                  onChange={e => setNewPartnerAddress(e.target.value)}
                  style={styles.input}
                />
                <input
                  placeholder="Вебсайт"
                  value={newPartnerWebsite}
                  onChange={e => setNewPartnerWebsite(e.target.value)}
                  style={styles.input}
                />
                <input
                  placeholder="Tax ID"
                  value={newPartnerTaxId}
                  onChange={e => setNewPartnerTaxId(e.target.value)}
                  style={styles.input}
                />
                <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: "600", fontSize: "13px", color: "#0369a1" }}>🏦 Банковские реквизиты</p>
                  <input placeholder="Название банка (напр. Bangkok Bank)" value={newPartnerBankName} onChange={e => setNewPartnerBankName(e.target.value)} style={styles.input} />
                  <input placeholder="Имя владельца счёта" value={newPartnerBankAccountName} onChange={e => setNewPartnerBankAccountName(e.target.value)} style={styles.input} />
                  <input placeholder="Номер счёта" value={newPartnerBankAccount} onChange={e => setNewPartnerBankAccount(e.target.value)} style={styles.input} />
                  <input placeholder="Отделение банка (Branch)" value={newPartnerBankBranch} onChange={e => setNewPartnerBankBranch(e.target.value)} style={styles.input} />
                  <input placeholder="SWIFT код" value={newPartnerSwift} onChange={e => setNewPartnerSwift(e.target.value)} style={styles.input} />
                </div>
                <button style={styles.btn} onClick={addBoatPartner}>
                  Добавить партнёра
                </button>
              </div>
            </div>
            
            <div>
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>🚤 Владельцы яхт ({boatPartners.length})</h3>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Лодок: {boats.length}</span>
                </div>
                
                {/* Search */}
                <input
                  placeholder="🔍 Поиск по партнёру или лодке..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...styles.input, marginBottom: '15px' }}
                />
                
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredBoatPartners.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                      {searchQuery ? 'Ничего не найдено' : 'Нет партнёров'}
                    </p>
                  ) : (
                    filteredBoatPartners.map((partner: any) => {
                      const partnerBoats = boats.filter((b: any) => b.partner_id === partner.id);
                      const isExpanded = expandedPartners.has(partner.id);
                      return (
                        <div key={partner.id} style={{ marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Partner Header - Clickable */}
                          <div 
                            onClick={() => togglePartnerExpand(partner.id)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '12px',
                              backgroundColor: isExpanded ? '#f0f9ff' : '#f9fafb',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '16px' }}>{isExpanded ? '▼' : '▶'}</span>
                              <div>
                                <strong style={{ fontSize: '14px' }}>{partner.name}</strong>
                                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6b7280' }}>
                                  🚢 {partnerBoats.length} лодок • {partner.commission_percent ? partner.commission_percent + '%' : ''}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                              <button
                                style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
                                onClick={(e) => { e.stopPropagation(); startEditPartner(partner); }}
                              >
                                ✏️ Редактировать
                              </button>
                              <button
                                style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
                                onClick={(e) => { e.stopPropagation(); deleteBoatPartner(partner.id); }}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          {/* Expanded Content */}
                          {isExpanded && (
                            <div style={{ padding: '12px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
                              {/* Contact Info */}
                              <div style={{ marginBottom: '10px', fontSize: '13px', color: '#6b7280' }}>
                                {partner.contact_phone && <span style={{ marginRight: '15px' }}>📞 {partner.contact_phone}</span>}
                                {partner.contact_email && <span>✉️ {partner.contact_email}</span>}
                              </div>
                              
                              {/* Menu Button */}
                              <div style={{ marginBottom: '12px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openMenuEditor(partner.id); }}
                                  style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                >
                                  🍽️ Меню партнёра
                                </button>
                              </div>
                              
                              {/* Boats List */}
                              {partnerBoats.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                                  {partnerBoats.map((boat: any) => (
                                    <div 
                                      key={boat.id} 
                                      onClick={() => loadBoatDetails(boat)}
                                      style={{ 
                                        fontSize: '13px', 
                                        padding: '8px 10px', 
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                    >
                                      <strong>{boat.name}</strong>
                                      {boat.length_ft && <span style={{ color: '#6b7280' }}> ({boat.length_ft}ft)</span>}
                                      {boat.boat_type && <span style={{ color: '#9ca3af' }}> - {boat.boat_type}</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Нет лодок</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Menu Editor Modal */}
      {menuEditorOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>🍽️ Меню партнёра</h2>
              <button onClick={closeMenuEditor} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {menuLoading ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>Загрузка...</p>
              ) : editingMenu ? (
                /* Edit Mode */
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Редактирование: {editingMenu.name}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingMenu(null); setEditingSets([]); }} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                      <button onClick={saveMenuChanges} style={{ padding: '8px 16px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>💾 Сохранить</button>
                    </div>
                  </div>
                  
                  {/* Menu Info */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Название</label>
                        <input value={editingMenu.name || ''} onChange={(e) => setEditingMenu({...editingMenu, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Тип</label>
                        <select value={editingMenu.type || 'included'} onChange={(e) => setEditingMenu({...editingMenu, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                          <option value="included">Включено в стоимость</option>
                          <option value="paid">Платное</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Условия (EN)</label>
                      <textarea value={editingMenu.conditions || ''} onChange={(e) => setEditingMenu({...editingMenu, conditions: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '60px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Условия (RU)</label>
                      <textarea value={editingMenu.conditions_ru || ''} onChange={(e) => setEditingMenu({...editingMenu, conditions_ru: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '60px' }} />
                    </div>
                  </div>
                  
                  {/* Sets */}
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>Сеты ({editingSets.length})</h4>
                    <button onClick={addNewSet} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>+ Добавить сет</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {editingSets.map((set, idx) => (
                      <div key={set.id || idx} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                          <input placeholder="Name" value={set.name || ''} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].name = e.target.value; setEditingSets(newSets); }} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                          <input placeholder="Название (RU)" value={set.name_ru || ''} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].name_ru = e.target.value; setEditingSets(newSets); }} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                          <select value={set.category || 'other'} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].category = e.target.value; setEditingSets(newSets); }} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}>
                            <option value="thai">🇹🇭 Thai</option>
                            <option value="western">🍝 Western</option>
                            <option value="vegetarian">🥗 Vegetarian</option>
                            <option value="kids">👶 Kids</option>
                            <option value="seafood">🦐 Seafood</option>
                            <option value="bbq">🍖 BBQ</option>
                            <option value="other">🍽️ Other</option>
                          </select>
                          {!set._isNew && <button onClick={() => deleteSet(set.id)} style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '11px', color: '#6b7280' }}>Блюда (через запятую)</label>
                          <input value={(set.dishes || []).join(', ')} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].dishes = e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d); setEditingSets(newSets); }} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280' }}>Блюда RU (через запятую)</label>
                          <input value={(set.dishes_ru || []).join(', ')} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].dishes_ru = e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d); setEditingSets(newSets); }} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} />
                        </div>
                        {editingMenu.type === 'paid' && (
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ fontSize: '11px', color: '#6b7280' }}>Цена (THB)</label>
                            <input type="number" value={set.price || ''} onChange={(e) => { const newSets = [...editingSets]; newSets[idx].price = e.target.value ? Number(e.target.value) : null; setEditingSets(newSets); }} style={{ width: '100px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Меню ({partnerMenus.length})</h3>
                    <button onClick={createNewMenu} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Создать меню</button>
                  </div>
                  
                  {partnerMenus.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>У этого партнёра пока нет меню. Создайте новое или импортируйте через /menu-import</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {partnerMenus.map(menu => (
                        <div key={menu.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ margin: 0 }}>{menu.name}</h4>
                              <span style={{ fontSize: '12px', color: menu.type === 'included' ? '#22c55e' : '#f59e0b' }}>{menu.type === 'included' ? '✅ Включено' : '💰 Платное'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => startEditMenu(menu)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✏️ Редактировать</button>
                              <button onClick={() => deleteMenu(menu.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                            </div>
                          </div>
                          
                          {menu.conditions_ru && (
                            <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e' }}>
                              <strong>⚠️ Условия:</strong> {menu.conditions_ru}
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {menuSets.filter(s => s.menu_id === menu.id).map(set => (
                              <span key={set.id} style={{ padding: '4px 10px', backgroundColor: menu.type === 'paid' ? '#fef3c7' : '#e0f2fe', borderRadius: '4px', fontSize: '12px' }}>
                                {set.name} {set.name_ru && `(${set.name_ru})`}
                                {menu.type === 'paid' && set.price && <strong style={{ marginLeft: '6px', color: '#d97706' }}>{set.price} THB</strong>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Partner Edit Modal */}
        {editingPartner && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>✏️ Редактировать партнёра</h2>
                <button onClick={() => setEditingPartner(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Название компании *</label>
                  <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Контактное лицо</label>
                  <input value={editForm.contact_name || ''} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Телефон</label>
                  <input value={editForm.contact_phone || ''} onChange={e => setEditForm({...editForm, contact_phone: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input value={editForm.contact_email || ''} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Вебсайт</label>
                  <input value={editForm.website || ''} onChange={e => setEditForm({...editForm, website: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Комиссия %</label>
                  <input type="number" value={editForm.commission_percent || ""} onChange={e => setEditForm({...editForm, commission_percent: Number(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Адрес</label>
                  <input value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tax ID</label>
                  <input value={editForm.tax_id || ''} onChange={e => setEditForm({...editForm, tax_id: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#1e40af' }}>🏦 Банковские реквизиты</h3>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Банк</label>
                  <input value={editForm.bank_name || ''} onChange={e => setEditForm({...editForm, bank_name: e.target.value})} placeholder="Bangkok Bank, Kasikorn, SCB..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Имя на счёте</label>
                  <input value={editForm.bank_account_name || ''} onChange={e => setEditForm({...editForm, bank_account_name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Номер счёта</label>
                  <input value={editForm.bank_account_number || ''} onChange={e => setEditForm({...editForm, bank_account_number: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Отделение</label>
                  <input value={editForm.bank_branch || ''} onChange={e => setEditForm({...editForm, bank_branch: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>SWIFT код</label>
                  <input value={editForm.swift_code || ''} onChange={e => setEditForm({...editForm, swift_code: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#1e40af' }}>📋 Контракт</h3>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Контракт с</label>
                  <input type="date" value={editForm.contract_valid_from || ''} onChange={e => setEditForm({...editForm, contract_valid_from: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Контракт до</label>
                  <input type="date" value={editForm.contract_valid_until || ''} onChange={e => setEditForm({...editForm, contract_valid_until: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Заметки</label>
                  <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setEditingPartner(null)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' }}>Отмена</button>
                <button onClick={savePartner} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>💾 Сохранить</button>
              </div>
            </div>
          </div>
        )}


      {/* Edit Other Partner Modal */}
      {editingOtherPartner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>✏️ Редактировать партнёра</h2>
              <button onClick={() => setEditingOtherPartner(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Название</label>
              <input value={editOtherForm.name || ''} onChange={e => setEditOtherForm({...editOtherForm, name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Контактное лицо</label>
              <input value={editOtherForm.contact_person || ''} onChange={e => setEditOtherForm({...editOtherForm, contact_person: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Телефон</label>
              <input value={editOtherForm.phone || ''} onChange={e => setEditOtherForm({...editOtherForm, phone: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Email</label>
              <input value={editOtherForm.email || ''} onChange={e => setEditOtherForm({...editOtherForm, email: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Вебсайт</label>
              <input value={editOtherForm.website || ''} onChange={e => setEditOtherForm({...editOtherForm, website: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Адрес</label>
              <input value={editOtherForm.address || ''} onChange={e => setEditOtherForm({...editOtherForm, address: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Tax ID</label>
              <input value={editOtherForm.tax_id || ''} onChange={e => setEditOtherForm({...editOtherForm, tax_id: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} /></div>
              <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '13px', color: '#0369a1' }}>🏦 Банковские реквизиты</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input placeholder="Название банка" value={editOtherForm.bank_name || ''} onChange={e => setEditOtherForm({...editOtherForm, bank_name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  <input placeholder="Имя владельца счёта" value={editOtherForm.bank_account_name || ''} onChange={e => setEditOtherForm({...editOtherForm, bank_account_name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  <input placeholder="Номер счёта" value={editOtherForm.bank_account_number || ''} onChange={e => setEditOtherForm({...editOtherForm, bank_account_number: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  <input placeholder="Отделение (Branch)" value={editOtherForm.bank_branch || ''} onChange={e => setEditOtherForm({...editOtherForm, bank_branch: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                  <input placeholder="SWIFT код" value={editOtherForm.swift_code || ''} onChange={e => setEditOtherForm({...editOtherForm, swift_code: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>
              <div><label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Заметки</label>
              <textarea value={editOtherForm.notes || ''} onChange={e => setEditOtherForm({...editOtherForm, notes: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '60px' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setEditingOtherPartner(null)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' }}>Отмена</button>
              <button onClick={saveOtherPartner} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>💾 Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
