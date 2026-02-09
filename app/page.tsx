'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder } from './lib/types';
import { t, Lang } from "./lib/i18n";import { inputStyle, labelStyle, cardStyle, tabStyle } from './lib/styles';

let _supabase: ReturnType<typeof createClient> | null = null;
const getSupabase = (): any => {
  if (!_supabase) {
    _supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _supabase;
};

// ==================== MOCK DATA ====================
// CATERING_PACKAGES moved to database (catering_menu table)

// DRINKS moved to boat_drinks table in DB

// TRANSFER_OPTIONS moved to transfer_options table in DB

// SPECIAL_SERVICES moved to staff_services table in DB

// WATER_TOYS moved to watersports_catalog table in DB

// FEES moved to route_fees table in DB

// ==================== COMPONENT ====================

const seasonLabel = (s: string) => {
  const map: Record<string, string> = {
    'peak': '🔥 Пик',
    'high': '☀️ Высокий',
    'low': '🌧️ Низкий',
    'all': '📅 Все сезоны',
    'nov_dec': '📅 Ноя-Дек',
    'dec_feb': '📅 Дек-Фев',
    'jan_feb': '📅 Янв-Фев',
    'mar_apr': '📅 Мар-Апр',
    'may_jun': '📅 Май-Июн',
    'jul_aug': '📅 Июл-Авг',
    'sep_oct': '📅 Сен-Окт',
    'chinese_new_year': '🏮 Кит. Новый год',
    'chinese_national_day': '🏮 Нац. день Китая',
    'international_labour_day': '📅 День труда',
  };
  return map[s] || s;
};

export default function Home() {
  // Search state
  const [searchDate, setSearchDate] = useState('');

  const [adults, setAdults] = useState(2);
  const [extraAdults, setExtraAdults] = useState(0);
  const [children3to11, setChildren3to11] = useState(0);
  const [childrenUnder3, setChildrenUnder3] = useState(0);
  const [customAdultPrice, setCustomAdultPrice] = useState<number | null>(null);
  const [customChildPrice, setCustomChildPrice] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [boatType, setBoatType] = useState('');
  const [destination, setDestination] = useState('');
  const [boatNameSearch, setBoatNameSearch] = useState('');
  const [boatPartners, setBoatPartners] = useState<any[]>([]);
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('');
  const [allBoats, setAllBoats] = useState<any[]>([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [showBoatSuggestions, setShowBoatSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [timeSlot, setTimeSlot] = useState('full_day');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [season, setSeason] = useState('auto');

  // Results state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedBoat, setSelectedBoat] = useState<SearchResult | null>(null);
  const [boatOptions, setBoatOptions] = useState<BoatOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Agent mode
  const [showAgentPrice, setShowAgentPrice] = useState(true);
  const [markupPercent, setMarkupPercent] = useState(0);

  // Selected extras
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);

  // Catering
  const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);
  
  // New: Catering partners from DB
  const [cateringPartners, setCateringPartners] = useState<any[]>([]);
  const [cateringMenu, setCateringMenu] = useState<any[]>([]);
  const [partnerMenus, setPartnerMenus] = useState<any[]>([]);
  const [partnerMenuSets, setPartnerMenuSets] = useState<any[]>([]);
  
  // New: Watersports partners from DB  
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  const [selectedPartnerWatersports, setSelectedPartnerWatersports] = useState<any[]>([]);
  
  // New: Transfer options from DB
  const [transferOptionsDB, setTransferOptionsDB] = useState<any[]>([]);
  
  // DB data
  const [boatDrinks, setBoatDrinks] = useState<any[]>([]);
  const [routeFees, setRouteFees] = useState<any[]>([]);
  const [landingFee, setLandingFee] = useState<number>(0);
  const [landingEnabled, setLandingEnabled] = useState<boolean>(false);
  const [defaultParkFee, setDefaultParkFee] = useState<number>(0);
  const [defaultParkFeeEnabled, setDefaultParkFeeEnabled] = useState<boolean>(false);
  const [defaultParkFeeAdults, setDefaultParkFeeAdults] = useState<number>(2);
  const [defaultParkFeeChildren, setDefaultParkFeeChildren] = useState<number>(0);
  const [staffServices, setStaffServices] = useState<any[]>([]);
  const [boatMenu, setBoatMenu] = useState<any[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});
  
  // New: Boat markup slider
  const [boatMarkup, setBoatMarkup] = useState(0);
  
  const [markupMode, setMarkupMode] = useState<"percent" | "fixed">("fixed");
  const [lang, setLang] = useState<Lang>("ru");  const [fixedMarkup, setFixedMarkup] = useState(0);  // Partner markups
  const [partnerMarkups, setPartnerMarkups] = useState<{[key: string]: number}>({});
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    boatFood: true,
    boatDrinks: true,
    boatToys: true,
    partnerCatering: false,
    partnerWatersports: false,
    partnerDecor: false
  });
  
  // Toggle section expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
  };
  
  // Get/Set partner markup
  const getPartnerMarkup = (partnerId: number | string) => partnerMarkups[partnerId] || 15;
  const setPartnerMarkup = (partnerId: number | string, value: number) => {
    setPartnerMarkups(prev => ({...prev, [partnerId]: value}));
  };
  
  // Calculate price with markup
  const withMarkup = (price: number, partnerId?: number | string) => {
    const markup = partnerId ? getPartnerMarkup(partnerId) : boatMarkup;
    return Math.round(price * (1 + markup / 100));
  };

  // Drinks
  const [drinkOrders, setDrinkOrders] = useState<DrinkOrder[]>([]);
  const [byobAllowed, setByobAllowed] = useState(false);
  const [corkageFee, setCorkageFee] = useState(0);

  // Transfer
  const [transferPickup, setTransferPickup] = useState<TransferOrder>({
    type: 'none', pickup: '', dropoff: 'Marina', price: 0, notes: ''
  });
  const [transferDropoff, setTransferDropoff] = useState<TransferOrder>({
    type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: ''
  });
  
  // Transfer customization
  const [transferDirection, setTransferDirection] = useState<'round_trip' | 'one_way'>('round_trip');
  const [customTransferPrice, setCustomTransferPrice] = useState<number | null>(null);
  const [customPrices, setCustomPrices] = useState<{[key: string]: number}>({});
  
  // Helper to get custom price or original
  const getPrice = (itemId: string, originalPrice: number | null): number => {
    return customPrices[itemId] !== undefined ? customPrices[itemId] : (originalPrice || 0);
  };
  
  // Helper to set custom price
  const setPrice = (itemId: string, price: number) => {
    setCustomPrices(prev => ({...prev, [itemId]: price}));
  };
  const [useOwnTransfer, setUseOwnTransfer] = useState(false);
  const [ownTransferPriceOneWay, setOwnTransferPriceOneWay] = useState(1000);
  const [ownTransferPriceRoundTrip, setOwnTransferPriceRoundTrip] = useState(2000);
  const [ownTransferVipPriceRoundTrip, setOwnTransferVipPriceRoundTrip] = useState(4000);
  const [ownTransferVipPriceOneWay, setOwnTransferVipPriceOneWay] = useState(2000);
  const [useOwnTransferVip, setUseOwnTransferVip] = useState(false);
  const [transferPrice, setTransferPrice] = useState(0);
  const [transferMarkup, setTransferMarkup] = useState(15);

  // Special services
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  // Water toys
  const [selectedToys, setSelectedToys] = useState<any[]>([]);

  // Fees
  const [selectedFees, setSelectedFees] = useState<any[]>([]);

  // Special requests
  const [specialOccasion, setSpecialOccasion] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Active tab in modal
  const [activeTab, setActiveTab] = useState<'included' | 'food' | 'drinks' | 'toys' | 'services' | 'transfer' | 'fees' | 'summary'>('included');
  const totalGuests = adults + extraAdults + children3to11 + childrenUnder3;

  const boatTypes = [
    { value: '', label: 'Любой тип' },
    { value: 'catamaran', label: 'Катамаран' },
    { value: 'sailing_catamaran', label: 'Парусный катамаран' },
    { value: 'speedboat', label: 'Спидбот' },
    { value: 'yacht', label: 'Яхта' },
  ];

  const timeSlots = [
    { value: 'full_day', label: 'Полный день (8ч)', hours: 8 },
    { value: 'half_day', label: 'Полдня (4ч)', hours: 4 },
    { value: 'morning', label: 'Утро (4ч)', hours: 4 },
    { value: 'afternoon', label: 'После обеда (4ч)', hours: 4 },
    { value: 'sunset', label: 'Закат (3ч)', hours: 3 },
    { value: 'overnight', label: 'С ночёвкой', hours: 24 },
  ];

  const seasons = [
    { value: 'auto', label: '📅 Авто (по дате)' },
    { value: 'all_seasons', label: '🌍 Все сезоны' },
    { value: 'high', label: '🔴 Высокий (Ноя-Апр)' },
    { value: 'low', label: '🟢 Низкий (Май-Окт)' },
    { value: 'peak', label: '🔥 Пик (15Дек-15Янв)' },
    { value: 'dec_feb', label: 'Дек-Фев' },
    { value: 'nov_dec', label: 'Ноя-Дек' },
    { value: 'jan_feb', label: 'Янв-Фев' },
    { value: 'mar_apr', label: 'Мар-Апр' },
    { value: 'may_jun', label: 'Май-Июн' },
    { value: 'jul_aug', label: 'Июл-Авг' },
    { value: 'sep_oct', label: 'Сен-Окт' },
    { value: 'chinese_new_year', label: '🧧 Китайский НГ' },
    { value: 'chinese_national_day', label: '🇨🇳 Нац. день Китая' },
    { value: 'international_labour_day', label: '👷 День труда' },
  ];
  const occasions = [
    '', 'Birthday', 'Anniversary', 'Wedding', 'Proposal', 
    'Corporate Event', 'Bachelor/Bachelorette', 'Family Reunion', 'Other'
  ];

  // ==================== SEARCH ====================
  // Load partners data on mount

  // Set date on client side to avoid hydration mismatch
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchDate(tomorrow.toISOString().split('T')[0]);
  }, []);
  useEffect(() => {
    const loadPartnersData = async () => {
      try {
      // Load catering partners & menu
      const { data: cpData } = await getSupabase().from('catering_partners').select('*');
      if (cpData) setCateringPartners(cpData);
      
      const { data: cmData } = await getSupabase().from('catering_menu').select('*');
      if (cmData) setCateringMenu(cmData);
      
      // Load watersports partners & catalog
      const { data: wpData } = await getSupabase().from('watersports_partners').select('*');
      if (wpData) setWatersportsPartners(wpData);
      
      const { data: wcData } = await getSupabase().from('watersports_catalog').select('*');
      if (wcData) setWatersportsCatalog(wcData);
      
      // Load transfer options
      const { data: toData } = await getSupabase().from('transfer_options').select('*');
      if (toData) setTransferOptionsDB(toData);
      
      // Load staff services
      const { data: ssData } = await getSupabase().from('staff_services').select('*');
      if (ssData) setStaffServices(ssData);
      
      // Load boat partners
      const { data: bpData } = await getSupabase().from('partners').select('*').order('name');
      if (bpData) setBoatPartners(bpData);

      // Load all boats for autocomplete
      const { data: boatsData } = await getSupabase().from('boats').select('id, name, partner_id').eq('active', true).order('name');
      if (boatsData) setAllBoats(boatsData);

      // Load all routes for autocomplete
      const { data: routesData } = await getSupabase().from('routes').select('id, name_en, name_ru').order('name_en');
      if (routesData) setAllRoutes(routesData);

      // Load partner menus (new system)
      const { data: pmData } = await getSupabase().from('partner_menus').select('*').eq('active', true);
      if (pmData) setPartnerMenus(pmData);
      
      const { data: msData } = await getSupabase().from('menu_sets').select('*').eq('active', true);
      if (msData) setPartnerMenuSets(msData);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      }
    };

    loadPartnersData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase().rpc('search_available_boats', {
        p_date: searchDate,
        p_guests: totalGuests,
        p_time_slot: timeSlot,
        p_boat_type: boatType || null,
        p_destination: destination || null,
        p_max_budget: maxBudget ? Number(maxBudget) : null,
        p_season: season === 'auto' ? null : season,
      });

      if (error) throw error;

      let filtered = data || [];
      
      if (minBudget) {
        filtered = filtered.filter((r: SearchResult) => r.calculated_total >= Number(minBudget));
      }

      // Filter by boat name
      if (boatNameSearch) {
        const searchLower = boatNameSearch.toLowerCase();
        filtered = filtered.filter((r: SearchResult) => 
          r.boat_name.toLowerCase().includes(searchLower)
        );
      }

      // Filter by partner
      if (selectedPartnerFilter) {
        filtered = filtered.filter((r: SearchResult) => 
          r.partner_id === Number(selectedPartnerFilter)
        );
      }

      // Sort
      if (sortBy === 'price_asc') {
        filtered.sort((a: SearchResult, b: SearchResult) => a.calculated_total - b.calculated_total);
      } else if (sortBy === 'price_desc') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.calculated_total - a.calculated_total);
      } else if (sortBy === 'size') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.length_ft - a.length_ft);
      } else if (sortBy === 'capacity') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.max_guests - a.max_guests);
      }

      setResults(filtered);
    } catch (err: any) {
      console.error('Search error:', err);
      alert('Ошибка поиска: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== OPEN BOAT DETAILS ====================
  const openBoatDetails = async (boat: SearchResult) => {
    setSelectedBoat(boat);
    setLoadingOptions(true);
    resetSelections();

    try {
      // Load boat drinks from partner
      const { data: drinksData } = await getSupabase()
        .from('boat_drinks')
        .select('*')
        .eq('partner_id', boat.partner_id);
      setBoatDrinks(drinksData || []);
      
      // Load route fees for this route
      const { data: routeData } = await getSupabase()
        .from('routes')
        .select('id')
        .ilike('name', '%' + boat.route_name.split(' ')[0] + '%')
        .limit(1)
        .single();
      
      if (routeData) {
        const { data: feesData } = await getSupabase()
          .from('route_fees')
          .select('*')
          .eq('route_id', routeData.id);
        setRouteFees(feesData || []);
        
        // Don't auto-add fees - let user select them
        // Fees are now optional, user can add them manually
        setSelectedFees([]);
      }
      
      // Load boat menu (old system)
      const { data: menuData } = await getSupabase()
        .from('boat_menu')
        .select('*')
        .or('partner_id.eq.' + boat.partner_id + ',boat_id.eq.' + boat.boat_id);
      setBoatMenu(menuData || []);
      
      // Load partner menu sets (new system)
      const partnerMenuIds = partnerMenus
        .filter(pm => pm.partner_id === boat.partner_id && (pm.boat_id === null || pm.boat_id === boat.boat_id))
        .map(pm => pm.id);
      
      if (partnerMenuIds.length > 0) {
        const relevantSets = partnerMenuSets.filter(ms => partnerMenuIds.includes(ms.menu_id));
        setBoatMenu(prev => [...prev, ...relevantSets.map(s => ({
          id: 'set_' + s.id,
          name_en: s.name,
          name_ru: s.name_ru,
          category: s.category,
          price: s.price,
          price_per_person: s.price,
          included: s.price === null || s.price === 0,
          dishes: s.dishes,
          dishes_ru: s.dishes_ru,
          from_partner_menu: true
        }))]);
      }

      const { data, error } = await getSupabase()
        .from('boat_options')
        .select(`
          id,
          status,
          price,
          price_per,
          quantity_included,
          notes,
          available,
          options_catalog (
            name_en,
            name_ru,
            code,
            category_id
          )
        `)
        .eq('boat_id', boat.boat_id)
        .eq('available', true);
      
      // Transform data to expected format
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        option_name: item.options_catalog?.name_en || 'Unknown',
        option_name_ru: item.options_catalog?.name_ru || '',
        option_category: item.options_catalog?.code?.split('_')[0] || 'other',
        category_code: item.options_catalog?.code || 'other',
        status: item.status || 'paid_optional',
        price: Number(item.price) || 0,
        price_per: item.price_per || 'day',
        quantity_included: item.quantity_included || 0,
        notes: item.notes || ''
      }));
      
      
      if (error) throw error;
      setBoatOptions(transformed);
      return;
      // Already set above
    } catch (err) {
      console.error('Error loading options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const resetSelections = () => {
    setSelectedExtras([]);
    setCateringOrders([]);
    setDrinkOrders([]);
    setTransferPickup({ type: 'none', pickup: '', dropoff: 'Marina', price: 0, notes: '' });
    setTransferDropoff({ type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: '' });
    setSelectedServices([]);
    setSelectedToys([]);
    setSelectedFees([]);
    setSpecialOccasion('');
    setDietaryRequirements('');
    setSpecialRequests('');
    setActiveTab('included');
    setExtraAdults(0);
    setChildren3to11(0);
    setChildrenUnder3(0);
    setCustomNotes("");
    setSelectedPartnerWatersports([]);
    setSelectedDishes({});
    setCustomPrices({});
    setCorkageFee(0);  };

  const closeModal = () => {
    setSelectedBoat(null);
    resetSelections();
  };

  // ==================== CALCULATIONS ====================
  const calculateTotals = () => {
    if (!selectedBoat) return { agent: 0, client: 0, extras: 0, catering: 0, drinks: 0, toys: 0, services: 0, transfer: 0, fees: 0, total: 0 };

    const baseAgent = Number(selectedBoat.calculated_agent_total) || Number(selectedBoat.base_price) || 0;
    const baseClient = Number(selectedBoat.calculated_total) || Number(selectedBoat.base_price) || 0;

    // Extras from boat options
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);

    // Catering
    const cateringTotal = cateringOrders.reduce((sum, c) => sum + (c.pricePerPerson * c.persons), 0);

    // Drinks (from boat_drinks DB)
    const drinksTotal = drinkOrders.reduce((sum, d: any) => sum + ((d.price || 0) * (d.quantity || 1)), 0) + corkageFee;

    // Water toys (from watersports_catalog DB)
    const toysTotal = selectedToys.reduce((sum, t: any) => {
      return sum + ((t.pricePerHour || 0) * (t.hours || 1) + (t.pricePerDay || 0) * (t.days || 0)) * (t.quantity || 1);
    }, 0);

    // Services (from staff_services DB)
    const servicesTotal = selectedServices.reduce((sum, s: any) => {
      return sum + ((s.price || 0) * (s.quantity || 1));
    }, 0);

    // Transfer (include DB transfer with markup)
    let transferTotal = transferPickup.price + transferDropoff.price;
    if (transferPrice > 0) {
      transferTotal += Math.round(transferPrice * (1 + transferMarkup / 100));
    }
    
    // Partner watersports (with individual markup)
    // Partner watersports - NO markup, added at base price
    const partnerWatersportsTotal = selectedPartnerWatersports.reduce((sum, w) => {
      const pricePerHour = Number(w.pricePerHour) || 0;
      const pricePerDay = Number(w.pricePerDay) || 0;
      const hours = Number(w.hours) || 0;
      const days = Number(w.days) || 0;
      const base = (pricePerHour * hours) + (pricePerDay * days);
      return sum + base;
    }, 0);

    // Park fees (from DB) + landing fee + default park fee
    const feesTotal = selectedFees.reduce((sum, f: any) => {
      return sum + ((f.pricePerPerson || 0) * (f.adults + f.children));
    }, 0) + (landingEnabled ? landingFee : 0) + (defaultParkFeeEnabled ? defaultParkFee * (defaultParkFeeAdults + defaultParkFeeChildren) : 0);

    // Children discount removed: child pricing already handled via childPriceToUse (default 50% of extra_pax_price)

    const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal + partnerWatersportsTotal;

    

    // Apply boat markup to base price for client
    // Extra guests surcharge (use custom prices if set)
    const adultPriceToUse = customAdultPrice !== null ? customAdultPrice : (selectedBoat?.extra_pax_price || 0);
    const childPriceToUse = customChildPrice !== null ? customChildPrice : (selectedBoat?.child_price_3_11 || Math.round((selectedBoat?.extra_pax_price || 0) * 0.5));
    const extraAdultsSurcharge = extraAdults * adultPriceToUse;
    const children3to11Surcharge = children3to11 * childPriceToUse;
    const extraGuestsSurcharge = extraAdultsSurcharge + children3to11Surcharge;
    // Markup ONLY on boat base price, extra guests added without markup
    const boatPriceWithMarkup = markupMode === "fixed" ? baseClient + fixedMarkup : Math.round(baseClient * (1 + boatMarkup / 100));
    const totalBeforeMarkup = boatPriceWithMarkup + extraGuestsSurcharge + allExtras ;
    const markupAmount = markupPercent > 0 ? Math.round(totalBeforeMarkup * markupPercent / 100) : 0;
    
    return {
      agent: baseAgent,
      client: baseClient,
      childrenDiscount: 0,
      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      partnerWatersports: partnerWatersportsTotal,
      markup: markupAmount,
      totalAgent: baseAgent + allExtras ,
      totalClient: totalBeforeMarkup + markupAmount
    };
  };

  const totals = calculateTotals();

  
  // ==================== PDF GENERATION ====================
  const generatePDF = () => {
    if (!selectedBoat) return;
    const totals = calculateTotals();
    console.log("PDF lang:", lang, "t test:", t("total.boatBase", lang));    console.log("PDF lang:", lang, "t test:", t("total.boatBase", lang));    console.log("PDF lang:", lang, "t test:", t("total.boatBase", lang));    const baseBoatPrice = Number(selectedBoat?.calculated_total) || Number(selectedBoat?.base_price) || 0; const boatPriceForClient = markupMode === "fixed" ? baseBoatPrice + fixedMarkup : Math.round(baseBoatPrice * (1 + boatMarkup / 100));
    
    // Extra guests surcharge for PDF
    const pdfAdultPrice = customAdultPrice !== null ? customAdultPrice : (selectedBoat?.extra_pax_price || 0);
    const pdfChildPrice = customChildPrice !== null ? customChildPrice : (selectedBoat?.child_price_3_11 || Math.round((selectedBoat?.extra_pax_price || 0) * 0.5));
    const pdfExtraAdultsSurcharge = extraAdults * pdfAdultPrice;
    const pdfChildren3to11Surcharge = children3to11 * pdfChildPrice;
    const pdfExtraGuestsSurcharge = pdfExtraAdultsSurcharge + pdfChildren3to11Surcharge;
    
    const finalTotal = boatPriceForClient + pdfExtraGuestsSurcharge + (totals.extras || 0) + totals.catering + totals.drinks + totals.toys + totals.services + totals.fees + totals.transfer + (totals.partnerWatersports || 0);
    
    const includedOptions = boatOptions
      .filter(opt => opt.status === 'included')
      .map(opt => lang === 'en' ? (opt.option_name || opt.option_name_ru || '') : (opt.option_name_ru || opt.option_name || ''))
      .filter(Boolean);
    
    const cateringItems = cateringOrders.map(order => {
      const price = Math.round((order.pricePerPerson || 0) * (order.persons || 1) * (1 + boatMarkup / 100));
      return '<tr><td>' + order.packageName + '</td><td>' + order.persons + ' чел</td><td>' + price.toLocaleString() + ' THB</td></tr>';
    }).join('');
    
    const drinkItems = drinkOrders.map(order => {
      const drink = boatDrinks.find(d => d.id === order.drinkId);
      const price = (customPrices['drink_' + order.drinkId] || order.price || 0) * order.quantity;
      return '<tr><td>' + (lang === 'en' ? (drink?.name_en || drink?.name_ru || 'Drink') : (drink?.name_ru || drink?.name_en || 'Напиток')) + '</td><td>' + order.quantity + ' шт</td><td>' + price.toLocaleString() + ' THB</td></tr>';
    }).join('');
    
    const toysItems = selectedToys.map((toy: any) => {
      const hours = toy.hours || 1;
      const basePrice = customPrices['toy_' + toy.id] || toy.pricePerHour || toy.pricePerDay || 0;
      const total = basePrice * hours;
      return '<tr><td>' + (lang === 'en' ? toy.name : (toy.nameRu || toy.name)) + '</td><td>' + hours + ' ч</td><td>' + total.toLocaleString() + ' THB</td></tr>';
    }).join('');

    // Partner watersports items for PDF - NO markup
    const partnerWatersportsItems = selectedPartnerWatersports.map(w => {
      const pricePerHour = Number(w.pricePerHour) || 0;
      const pricePerDay = Number(w.pricePerDay) || 0;
      const hours = Number(w.hours) || 0;
      const days = Number(w.days) || 0;
      const total = (pricePerHour * hours) + (pricePerDay * days);
      const timeStr = hours > 0 ? hours + ' ч' : days + ' дн';
      return '<tr><td>' + (lang === 'en' ? (w.name || 'Water sport') : (w.nameRu || w.name || 'Водная услуга')) + ' (' + (w.partnerName || '') + ')</td><td>' + timeStr + '</td><td>' + total.toLocaleString() + ' THB</td></tr>';
    }).join('');
    
    const allToysItems = toysItems + partnerWatersportsItems;
    
    const serviceItems = selectedServices.map((s: any) => {
      const price = customPrices['service_' + s.id] || s.price || 0;
      return '<tr><td>' + (lang === 'en' ? s.name : (s.nameRu || s.name)) + '</td><td>' + (s.quantity || 1) + '</td><td>' + price.toLocaleString() + ' THB</td></tr>';
    }).join('');
    
    const feeItems = selectedFees.map((fee: any) => {
      const price = (customPrices['fee_' + fee.id] || fee.pricePerPerson || 0) * (fee.adults + fee.children);
      return '<tr><td>' + (lang === 'en' ? fee.name : (fee.nameRu || fee.name)) + '</td><td>' + (fee.adults + fee.children) + ' чел</td><td>' + price.toLocaleString() + ' THB</td></tr>';
    }).join('');
    
    const transferHtml = transferPickup.type !== 'none' && transferPickup.price > 0 
      ? '<tr><td>' + t('total.transfer', lang) + ' ' + (transferDirection === 'round_trip' ? '(' + t('transfer.roundTrip', lang) + ')' : '(' + t('transfer.oneWay', lang) + ')') + '</td><td>' + (transferPickup.pickup || '-') + '</td><td>' + transferPickup.price.toLocaleString() + ' THB</td></tr>'
      : '';

    const printContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Расчёт - ' + selectedBoat.boat_name + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px 30px;color:#333;max-width:550px;margin:0 auto;font-size:11px;line-height:1.4}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #2563eb}.logo{font-size:24px;font-weight:bold;color:#2563eb;margin-bottom:4px}.subtitle{color:#666;font-size:11px}.date{color:#888;font-size:10px;margin-top:8px}.yacht-info{background:#1e40af;color:white;padding:12px 15px;border-radius:6px;margin-bottom:15px}.yacht-name{font-size:16px;font-weight:bold;margin-bottom:8px}.yacht-details{display:flex;gap:20px;font-size:10px}.yacht-detail{display:flex;flex-direction:column}.yacht-detail-label{opacity:0.8;margin-bottom:2px}.yacht-detail-value{font-weight:600}.section{margin-bottom:12px}.section-title{font-size:11px;font-weight:bold;color:#2563eb;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;text-transform:uppercase}.included-list{display:flex;flex-wrap:wrap;gap:6px}.included-item{background:#f3f4f6;color:#374151;padding:4px 10px;border-radius:4px;font-size:10px;border:1px solid #e5e7eb}table{width:100%;border-collapse:collapse;margin-top:6px;table-layout:fixed}th,td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:10px}th{text-align:left;font-weight:600;color:#6b7280;background:#f9fafb}th:first-child,td:first-child{width:auto}th:nth-child(2),td:nth-child(2){width:70px;text-align:center}th:last-child,td:last-child{width:90px;text-align:right}.total-section{background:#2563eb;color:white;padding:12px 15px;border-radius:6px;margin-top:15px}.total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px}.total-row.final{font-size:13px;font-weight:bold;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.3)}.footer{margin-top:20px;text-align:center;color:#666;font-size:9px;padding-top:15px;border-top:1px solid #e5e7eb}@media print{body{padding:15px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style></head><body>' +
      '<div class="header"><div class="logo">' + t('pdf.company', lang) + '</div><div class="subtitle">' + t('pdf.footer', lang) + '</div><div class="date">' + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) + '</div></div>' +
      '<div class="yacht-info"><div class="yacht-name">' + (selectedBoat.boat_name || 'Яхта') + '</div><div class="yacht-details"><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.route', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.route_name || 'По запросу') + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.duration', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.duration || ((lang === 'en' ? '8 hours' : '8 часов'))) + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.guestsLabel', lang) + '</div><div class="yacht-detail-value">' + totalGuests + ' (' + t('pdf.adults', lang) + ': ' + (adults + extraAdults) + ', ' + (lang === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + children3to11 + ', ' + t('wa.under3', lang) + ': ' + childrenUnder3 + ')</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.boatPrice', lang) + '</div><div class="yacht-detail-value">' + boatPriceForClient.toLocaleString() + ' THB</div></div></div></div>' +
      (includedOptions.length > 0 ? '<div class="section"><div class="section-title">' + t('pdf.included', lang) + '</div><div class="included-list">' + includedOptions.map(opt => '<span class="included-item">' + opt + '</span>').join('') + '</div></div>' : '') +
      // Selected extras section
      (selectedExtras.length > 0 ? '<div class="section"><div class="section-title">' + t('pdf.extras', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + selectedExtras.map(e => '<tr><td>' + (lang === 'en' ? e.name : (e.nameRu || e.name)) + '</td><td>' + e.quantity + ' шт</td><td>' + Math.round(e.price * e.quantity * (1 + boatMarkup / 100)).toLocaleString() + ' THB</td></tr>').join('') + '</table></div>' : '') +
      // Selected dishes section
      ((() => { const dishEntries = Object.entries(selectedDishes).filter(([, v]) => v > 0); if (dishEntries.length === 0) return ''; let html = '<div class="section"><div class="section-title">' + t('pdf.dishes', lang) + '</div><table><tr><th>' + t('pdf.dish', lang) + '</th><th>' + t('pdf.qty', lang) + '</th></tr>'; dishEntries.forEach(([key, count]) => { const parts = key.split('_'); const setId = parts.slice(0, -2).join('_'); const dishIdx = parseInt(parts[parts.length - 2]); const optIdx = parseInt(parts[parts.length - 1]); const menuSet = boatMenu.find((m: any) => String(m.id) === setId); if (menuSet && menuSet.dishes && menuSet.dishes[dishIdx]) { const opts = menuSet.dishes[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim()); const optsRu = menuSet.dishes_ru && menuSet.dishes_ru[dishIdx] ? menuSet.dishes_ru[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim()) : []; if (opts[optIdx]) html += '<tr><td>' + (optsRu[optIdx] || opts[optIdx]) + '</td><td>' + count + ' чел</td></tr>'; } }); return html + '</table></div>'; })()) +
      (cateringItems ? '<div class="section"><div class="section-title">' + t('pdf.catering', lang) + '</div>' + 
      ((() => { const menu = partnerMenus.find(pm => pm.partner_id === selectedBoat?.partner_id); return menu?.conditions_ru || menu?.conditions ? '<div style="margin-bottom:10px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e"><strong>⚠️ ' + t('pdf.conditions', lang) + '</strong> ' + (menu.conditions_ru || menu.conditions) + '</div>' : ''; })()) +
      '<table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + cateringItems + '</table></div>' : '') +
      (drinkItems ? '<div class="section"><div class="section-title">' + t('pdf.drinks', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + drinkItems + '</table></div>' : '') +
      (allToysItems ? '<div class="section"><div class="section-title">' + t('pdf.waterToys', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.time', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + allToysItems + '</table></div>' : '') +
      (serviceItems ? '<div class="section"><div class="section-title">' + t('pdf.services', lang) + '</div><table><tr><th>' + t('pdf.service', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + serviceItems + '</table></div>' : '') +
      (feeItems ? '<div class="section"><div class="section-title">' + t('pdf.fees', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.guestsLabel', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + feeItems + '</table></div>' : '') +
      (transferHtml ? '<div class="section"><div class="section-title">' + t('pdf.transfer', lang) + '</div><table><tr><th>' + t('pdf.type', lang) + '</th><th>' + t('pdf.address', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + transferHtml + '</table></div>' : '') +
      '<div class="total-section"><div class="total-row"><span>' + t('total.boatBase', lang) + '</span><span>' + boatPriceForClient.toLocaleString() + ' THB</span></div>' + (pdfExtraGuestsSurcharge > 0 ? '<div class="total-row"><span>' + t('total.extraGuests', lang) + ' (' + extraAdults + ' ' + t('pdf.adults', lang) + ' + ' + children3to11 + ' ' + t('pdf.children', lang) + ')</span><span>+' + pdfExtraGuestsSurcharge.toLocaleString() + ' THB</span></div>' : '') +
      ((totals.extras || 0) > 0 ? '<div class="total-row"><span>' + t('total.extras', lang) + '</span><span>+' + (totals.extras || 0).toLocaleString() + ' THB</span></div>' : '') +      (totals.catering > 0 ? '<div class="total-row"><span>' + t('total.catering', lang) + '</span><span>+' + totals.catering.toLocaleString() + ' THB</span></div>' : '') +
      (totals.drinks > 0 ? '<div class="total-row"><span>' + t('total.drinks', lang) + '</span><span>+' + totals.drinks.toLocaleString() + ' THB</span></div>' : '') +
      (totals.toys > 0 ? '<div class="total-row"><span>' + t('total.waterToys', lang) + '</span><span>+' + totals.toys.toLocaleString() + ' THB</span></div>' : '') +
      (totals.services > 0 ? '<div class="total-row"><span>' + t('total.services', lang) + '</span><span>+' + totals.services.toLocaleString() + ' THB</span></div>' : '') +
      (totals.fees > 0 ? '<div class="total-row"><span>' + t('total.fees', lang) + '</span><span>+' + totals.fees.toLocaleString() + ' THB</span></div>' : '') +
      (totals.transfer > 0 ? '<div class="total-row"><span>' + t('total.transfer', lang) + '</span><span>+' + totals.transfer.toLocaleString() + ' THB</span></div>' : '') + (totals.partnerWatersports > 0 ? '<div class="total-row"><span>' + t('total.watersports', lang) + '</span><span>+' + totals.partnerWatersports.toLocaleString() + ' THB</span></div>' : '') +
      '<div class="total-row final"><span>' + t('pdf.totalToPay', lang) + '</span><span>' + finalTotal.toLocaleString() + ' THB</span></div></div>' +
      (customNotes ? '<div class="section" style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border:1px solid #ffc107"><div class="section-title" style="color:#856404">' + t('pdf.notes', lang) + '</div><p style="margin:10px 0 0;color:#856404">' + customNotes.replace(/\n/g, '<br>') + '</p></div>' : '') +
      '<div class="footer"><p><strong>' + t('pdf.company', lang) + '</strong> — ' + t('pdf.footer', lang) + '</p><p>WhatsApp: +66 810507171 • Email: tratatobookings@gmail.com</p></div></body></html>';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = function() { printWindow.print(); };
    }
  };



  // WhatsApp message generation
  const generateWhatsApp = () => {
    if (!selectedBoat) return;
    const totals = calculateTotals();
    const baseBoatPrice = Number(selectedBoat?.calculated_total) || Number(selectedBoat?.base_price) || 0;
    const boatPriceForClient = markupMode === "fixed" ? baseBoatPrice + fixedMarkup : Math.round(baseBoatPrice * (1 + boatMarkup / 100));
    const adultPriceToUse = customAdultPrice !== null ? customAdultPrice : (selectedBoat?.extra_pax_price || 0);
    const childPriceToUse = customChildPrice !== null ? customChildPrice : (selectedBoat?.child_price_3_11 || Math.round((selectedBoat?.extra_pax_price || 0) * 0.5));
    const extraAdultsSurch = extraAdults * adultPriceToUse;
    const children3to11Surch = children3to11 * childPriceToUse;

    const L = lang;
    let message = '*' + t('wa.title', L) + '*\n\n';
    message += '*' + t('wa.yacht', L) + '* ' + selectedBoat.boat_name + '\n';
    message += '*' + t('wa.route', L) + '* ' + (selectedBoat.route_name || (L === 'en' ? 'On request' : 'По запросу')) + '\n';
    message += '*' + t('wa.duration', L) + '* ' + (selectedBoat.duration_hours || 8) + ' ' + t('wa.hours', L) + '\n';
    message += '*' + t('wa.guests', L) + '* ' + totalGuests + ' (' + t('wa.adultsShort', L) + ': ' + (adults + extraAdults) + ', ' + (L === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + children3to11 + ', ' + t('wa.under3', L) + ': ' + childrenUnder3 + ')\n\n';

    message += '*' + t('wa.boatPrice', L) + '* ' + boatPriceForClient.toLocaleString() + ' THB\n';
    if (extraAdultsSurch + children3to11Surch > 0) {
      message += '*' + t('wa.extraGuests', L) + ' (' + extraAdults + ' ' + t('wa.adultsShort', L) + ' + ' + children3to11 + ' ' + t('wa.childrenShort', L) + '):* +' + (extraAdultsSurch + children3to11Surch).toLocaleString() + ' THB\n';
    }

    if (selectedExtras.length > 0) {
      message += '\n*' + t('wa.extras', L) + '*\n';
      selectedExtras.forEach(e => {
        message += '  - ' + (L === 'en' ? e.name : (e.nameRu || e.name)) + ' x' + e.quantity + ' - ' + (e.price * e.quantity).toLocaleString() + ' THB\n';
      });
    }

    const dishEntries = Object.entries(selectedDishes).filter(([, v]) => v > 0);
    if (dishEntries.length > 0) {
      message += '\n*' + t('wa.dishes', L) + '*\n';
      dishEntries.forEach(([key, count]) => {
        const parts = key.split('_');
        const setId = parts.slice(0, -2).join('_');
        const dishIdx = parseInt(parts[parts.length - 2]);
        const optIdx = parseInt(parts[parts.length - 1]);
        const menuSet = boatMenu.find((m: any) => String(m.id) === setId);
        if (menuSet && menuSet.dishes && menuSet.dishes[dishIdx]) {
          const opts = menuSet.dishes[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim());
          if (opts[optIdx]) message += '  - ' + opts[optIdx] + ' x' + count + '\n';
        }
      });
    }

    if (cateringOrders.length > 0) {
      message += '\n*' + t('wa.catering', L) + '*\n';
      cateringOrders.forEach(order => {
        const priceWithMarkup = Math.round(order.pricePerPerson * (1 + boatMarkup / 100));
        message += '  - ' + order.packageName + ' (' + order.persons + ' ' + t('wa.persons', L) + ') - ' + (priceWithMarkup * order.persons).toLocaleString() + ' THB\n';
      });
    }

    if (drinkOrders.length > 0) {
      message += '\n*' + t('wa.drinks', L) + '*\n';
      drinkOrders.forEach(order => {
        const price = customPrices['drink_' + order.drinkId] || order.price;
        message += '  - ' + order.name + ' x' + order.quantity + ' - ' + (price * order.quantity).toLocaleString() + ' THB\n';
      });
    }

    if (selectedToys.length > 0) {
      message += '\n*' + t('wa.toys', L) + '*\n';
      selectedToys.forEach((t2: any) => {
        const cost = ((t2.pricePerHour || 0) * (t2.hours || 1) + (t2.pricePerDay || 0) * (t2.days || 0)) * (t2.quantity || 1);
        message += '  - ' + (L === 'en' ? t2.name : (t2.nameRu || t2.name)) + ' - ' + cost.toLocaleString() + ' THB\n';
      });
    }

    if (selectedServices.length > 0) {
      message += '\n*' + t('wa.services', L) + '*\n';
      selectedServices.forEach((s: any) => {
        message += '  - ' + (L === 'en' ? s.name : (s.nameRu || s.name)) + ' x' + (s.quantity || 1) + ' - ' + ((s.price || 0) * (s.quantity || 1)).toLocaleString() + ' THB\n';
      });
    }

    if (selectedPartnerWatersports.length > 0) {
      message += '\n*' + t('wa.watersports', L) + '*\n';
      selectedPartnerWatersports.forEach((w: any) => {
        const cost = (Number(w.pricePerHour) || 0) * (Number(w.hours) || 0) + (Number(w.pricePerDay) || 0) * (Number(w.days) || 0);
        message += '  - ' + (L === 'en' ? w.name : (w.nameRu || w.name)) + ' - ' + cost.toLocaleString() + ' THB\n';
      });
    }

    if (selectedFees.length > 0) {
      message += '\n*' + t('wa.fees', L) + '*\n';
      selectedFees.forEach((fee: any) => {
        const price = customPrices['fee_' + fee.id] || fee.pricePerPerson;
        message += '  - ' + (L === 'en' ? fee.name : (fee.nameRu || fee.name)) + ' - ' + (price * (fee.adults + fee.children)).toLocaleString() + ' THB\n';
      });
    }

    if (transferPickup.type !== 'none' && transferPickup.price > 0) {
      message += '\n*' + t('wa.transfer', L) + '* ' + transferPickup.price.toLocaleString() + ' THB\n';
      if (transferPickup.pickup) message += '  ' + t('wa.address', L) + ' ' + transferPickup.pickup + '\n';
    }

    const finalTotal = totals.totalClient || 0;
    message += '\n--- ' + (L === 'en' ? 'SUMMARY' : 'СВОДКА') + ' ---\n';
    message += '*' + (L === 'en' ? 'Yacht:' : 'Яхта:') + '* ' + boatPriceForClient.toLocaleString() + ' THB\n';
    if (extraAdultsSurch + children3to11Surch > 0) {
      message += '*' + t('wa.extraGuests', L) + ':* +' + (extraAdultsSurch + children3to11Surch).toLocaleString() + ' THB\n';
    }
    if ((totals.extras || 0) > 0) message += '*' + t('wa.extras', L) + '* +' + (totals.extras || 0).toLocaleString() + ' THB\n';
    if (totals.catering > 0) message += '*' + t('wa.catering', L) + '* +' + totals.catering.toLocaleString() + ' THB\n';
    if (totals.drinks > 0) message += '*' + t('wa.drinks', L) + '* +' + totals.drinks.toLocaleString() + ' THB\n';
    if (totals.toys > 0) message += '*' + t('wa.toys', L) + '* +' + totals.toys.toLocaleString() + ' THB\n';
    if (totals.services > 0) message += '*' + t('wa.services', L) + '* +' + totals.services.toLocaleString() + ' THB\n';
    if ((totals.partnerWatersports || 0) > 0) message += '*' + t('wa.watersports', L) + '* +' + (totals.partnerWatersports || 0).toLocaleString() + ' THB\n';
    if (totals.fees > 0) message += '*' + t('wa.fees', L) + '* +' + totals.fees.toLocaleString() + ' THB\n';
    if (totals.transfer > 0) message += '*' + t('wa.transfer', L) + '* +' + totals.transfer.toLocaleString() + ' THB\n';
    message += '\n*' + t('wa.total', L) + ' ' + finalTotal.toLocaleString() + ' THB*';
    if (customNotes) message += '\n\n*' + t('wa.notes', L) + '*\n' + customNotes;
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
  };
  // ==================== TOGGLE FUNCTIONS ====================
  const toggleExtra = (option: BoatOption) => {
    const exists = selectedExtras.find(e => e.optionId === option.id);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.optionId !== option.id));
    } else {
      setSelectedExtras([...selectedExtras, {
        optionId: option.id,
        name: option.option_name,
        nameRu: option.option_name_ru,
        quantity: 1,
        price: option.price || 0,
        pricePer: option.price_per || 'day',
        category: option.category_code
      }]);
    }
  };

  const updateExtraQuantity = (optionId: number, delta: number) => {
    setSelectedExtras(selectedExtras.map(e => 
      e.optionId === optionId ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e
    ));
  };

  const addCatering = (pkg: any) => {
    setCateringOrders([...cateringOrders, {
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerPerson: pkg.price,
      persons: Math.max(adults, pkg.minPersons),
      notes: ''
    }]);
  };

  const removeCatering = (index: number) => {
    setCateringOrders(cateringOrders.filter((_, i) => i !== index));
  };
  // Add menu item from boat_menu
  const addMenuItem = (item: any) => {
    if (item.included) return; // Don't add included items
    setCateringOrders([...cateringOrders, {
      packageId: 'menu_' + item.id,
      packageName: item.name_en + ' (с яхты)',
      pricePerPerson: item.price || 0,
      persons: adults,
      minPersons: 1,
      notes: item.description || ''
    }]);
  };


  
  // Update catering persons count
  const updateCateringPersons = (index: number, persons: number) => {
    setCateringOrders(cateringOrders.map((order, i) => 
      i === index ? { ...order, persons: Math.max(order.minPersons || 1, persons) } : order
    ));
  };
  
  // Add catering from DB partner
  const addCateringFromDB = (item: any, partner: any) => {
    setCateringOrders([...cateringOrders, {
      packageId: `db_${item.id}`,
      packageName: `${item.name_en} (${partner.name})`,
      pricePerPerson: item.price_per_person,
      persons: Math.max(adults, item.min_persons),
      minPersons: item.min_persons,
      notes: ''
    }]);
  };
  
  // Add watersport from partner with markup
  const addPartnerWatersport = (item: any, partner: any) => {
    // Priority: if price_per_hour exists, use hours; otherwise use days
    const useHours = (item.price_per_hour || 0) > 0;
    setSelectedPartnerWatersports([...selectedPartnerWatersports, {
      id: item.id,
      name: item.name_en,
      partnerName: partner.name,
      pricePerHour: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_hour > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_hour || 0),
      pricePerDay: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_day > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_day || 0),
      hours: useHours ? 1 : 0,
      days: useHours ? 0 : 1
    }]);
  };
  
  const removePartnerWatersport = (id: number) => {
    setSelectedPartnerWatersports(selectedPartnerWatersports.filter(w => w.id !== id));
  };
  
  const updatePartnerWatersport = (id: number, field: string, value: number) => {
    setSelectedPartnerWatersports(selectedPartnerWatersports.map(w =>
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const addDrink = (drink: any) => {
    const exists = drinkOrders.find(d => d.drinkId === drink.id);
    if (exists) {
      setDrinkOrders(drinkOrders.map(d => 
        d.drinkId === drink.id ? { ...d, quantity: d.quantity + 1 } : d
      ));
    } else {
      setDrinkOrders([...drinkOrders, {
        drinkId: drink.id,
        name: drink.name_en || drink.name,
        nameRu: drink.name_ru || drink.name,
        price: drink.price || 0,
        quantity: 1,
        unit: drink.unit || 'piece',
        included: drink.included || false
      }]);
    }
  };

  const removeDrink = (drinkId: string) => {
    setDrinkOrders(drinkOrders.filter(d => d.drinkId !== drinkId));
  };

  const toggleService = (service: any) => {
    const exists = selectedServices.find((s: any) => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s: any) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, { 
        id: service.id, 
        name: service.name_en || service.name,
        nameRu: service.name_ru,
        price: service.price || 0,
        pricePer: service.price_per || 'day',
        quantity: 1 
      }]);
    }
  };

  const toggleToy = (toy: any) => {
    const exists = selectedToys.find((t: any) => t.id === toy.id);
    if (exists) {
      setSelectedToys(selectedToys.filter((t: any) => t.id !== toy.id));
    } else {
      setSelectedToys([...selectedToys, { 
        id: toy.id, 
        name: toy.name_en || toy.name,
        nameRu: toy.name_ru,
        pricePerHour: toy.price_per_hour || 0,
        pricePerDay: toy.price_per_day || 0,
        quantity: 1, 
        hours: 1,
        days: 0
      }]);
    }
  };

  const toggleFee = (fee: any) => {
    const exists = selectedFees.find((f: any) => f.id === fee.id);
    if (exists) {
      setSelectedFees(selectedFees.filter((f: any) => f.id !== fee.id));
    } else {
      setSelectedFees([...selectedFees, { 
        id: fee.id, 
        name: fee.name_en,
        nameRu: fee.name_ru,
        pricePerPerson: fee.price_per_person || 0,
        adults: adults, 
        children: children3to11,
        mandatory: fee.mandatory || false
      }]);
    }
  };

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', color: 'white', padding: '20px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🚤 Phuket Charter Pro</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>Профессиональный калькулятор чартеров</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }} className="import-dropdown">
              <a href="/import-all" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📦 Импорт
              </a>
            </div>
            <a href="/partners" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
              👥 Партнёры
            </a>
            <div style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "2px" }}>
              <button onClick={() => setLang("ru")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: lang === "ru" ? "white" : "transparent", color: lang === "ru" ? "#1e40af" : "rgba(255,255,255,0.7)" }}>RU</button>
              <button onClick={() => setLang("en")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: lang === "en" ? "white" : "transparent", color: lang === "en" ? "#1e40af" : "rgba(255,255,255,0.7)" }}>EN</button>
            </div>          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Search Panel - Modern UI */}
        <div style={{ marginBottom: '24px', padding: '24px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            {/* Date */}
            <div style={{ flex: '0.9', minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>📅 Дата чартера</label>
              <input 
                type="date" 
                value={searchDate} 
                onChange={(e) => setSearchDate(e.target.value)} 
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', outline: 'none', transition: 'all 0.2s' }}
              />
            </div>

            {/* Destination with Autocomplete */}
            <div style={{ flex: '2', minWidth: '200px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>🗺️ Направление</label>
              <input 
                placeholder="Phi Phi, Phang Nga, James Bond..." 
                value={destination} 
                onChange={(e) => { setDestination(e.target.value); setShowDestinationSuggestions(true); }}
                onFocus={() => setShowDestinationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', outline: 'none', transition: 'all 0.2s' }}
              />
              {showDestinationSuggestions && destination && allRoutes.filter(r => {
                    const search = destination.toLowerCase().replace(/\s+/g, '');
                    const nameEn = (r.name_en || '').toLowerCase();
                    const nameRu = (r.name_ru || '').toLowerCase();
                    const nameEnNoSpace = nameEn.replace(/\s+/g, '');
                    // Search by exact match, no-space match, or partial words
                    return nameEn.includes(destination.toLowerCase()) || 
                           nameRu.includes(destination.toLowerCase()) ||
                           nameEnNoSpace.includes(search) ||
                           destination.toLowerCase().split(' ').every(word => nameEn.includes(word) || nameRu.includes(word));
                  }).length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {allRoutes.filter(r => {
                    const search = destination.toLowerCase().replace(/\s+/g, '');
                    const nameEn = (r.name_en || '').toLowerCase();
                    const nameRu = (r.name_ru || '').toLowerCase();
                    const nameEnNoSpace = nameEn.replace(/\s+/g, '');
                    // Search by exact match, no-space match, or partial words
                    return nameEn.includes(destination.toLowerCase()) || 
                           nameRu.includes(destination.toLowerCase()) ||
                           nameEnNoSpace.includes(search) ||
                           destination.toLowerCase().split(' ').every(word => nameEn.includes(word) || nameRu.includes(word));
                  }).slice(0, 8).map(route => (
                    <div 
                      key={route.id}
                      onClick={() => { setDestination(route.name_en || route.name_ru); setShowDestinationSuggestions(false); }}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <span style={{ fontWeight: '500' }}>{route.name_en}</span>
                      {route.name_ru && <span style={{ color: '#9ca3af', marginLeft: '8px', fontSize: '12px' }}>{route.name_ru}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boat Name Search with Autocomplete */}
            <div style={{ flex: '1.5', minWidth: '180px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>🚢 Название лодки</label>
              <input 
                placeholder="Real, Princess, Chowa..." 
                value={boatNameSearch} 
                onChange={(e) => { setBoatNameSearch(e.target.value); setShowBoatSuggestions(true); }}
                onFocus={() => setShowBoatSuggestions(true)}
                onBlur={() => setTimeout(() => setShowBoatSuggestions(false), 200)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', outline: 'none', transition: 'all 0.2s' }}
              />
              {showBoatSuggestions && boatNameSearch && allBoats.filter(b => {
                    const search = boatNameSearch.toLowerCase().replace(/\s+/g, '');
                    const name = b.name.toLowerCase();
                    const nameNoSpace = name.replace(/\s+/g, '');
                    return name.includes(boatNameSearch.toLowerCase()) || nameNoSpace.includes(search);
                  }).length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {allBoats.filter(b => {
                    const search = boatNameSearch.toLowerCase().replace(/\s+/g, '');
                    const name = b.name.toLowerCase();
                    const nameNoSpace = name.replace(/\s+/g, '');
                    return name.includes(boatNameSearch.toLowerCase()) || nameNoSpace.includes(search);
                  }).slice(0, 8).map(boat => (
                    <div 
                      key={boat.id}
                      onClick={() => { setBoatNameSearch(boat.name); setShowBoatSuggestions(false); }}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <span style={{ fontWeight: '500' }}>{boat.name}</span>
                      <span style={{ color: '#9ca3af', marginLeft: '8px', fontSize: '12px' }}>{boatPartners.find(p => p.id === boat.partner_id)?.name || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Partner Filter */}
            <div style={{ flex: '1.5', minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>🏢 Партнёр</label>
              <select 
                value={selectedPartnerFilter} 
                onChange={(e) => setSelectedPartnerFilter(e.target.value)} 
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">Все партнёры</option>
                {boatPartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Boat Type */}
            <div style={{ flex: '0.9', minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>🚤 Тип лодки</label>
              <select 
                value={boatType} 
                onChange={(e) => setBoatType(e.target.value)} 
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', cursor: 'pointer', outline: 'none' }}
              >
                {boatTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Duration */}
            <div style={{ flex: '1.2', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>⏱️ Длительность</label>
              <select 
                value={timeSlot} 
                onChange={(e) => setTimeSlot(e.target.value)} 
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', cursor: 'pointer', outline: 'none' }}
              >
                {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Season */}
            <div style={{ flex: '0.9', minWidth: '130px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>📅 Сезон</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', cursor: 'pointer', outline: 'none' }}
              >
                {seasons.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div style={{ flex: '0.9', minWidth: '130px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>📊 Сортировка</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fafafa', cursor: 'pointer', outline: 'none' }}
              > 
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="size">Размер</option>
                <option value="capacity">Вместимость</option>
              </select>
            </div>


            {/* Guests */}
            <div style={{ flex: "0.7", minWidth: "100px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>👥 Гостей</label>
              <input
                type="number"
                min="1"
                max="100"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #e5e7eb", borderRadius: "12px", fontSize: "15px", backgroundColor: "#fafafa", outline: "none" }}
              />
            </div>
            {/* Search Button */}
            <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
              <button 
                onClick={handleSearch} 
                disabled={loading} 
                style={{ 
                  padding: '14px 36px', 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? '⏳ Поиск...' : '🔍 Найти лодки'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              Найдено: {results.length} вариантов на {searchDate}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
              {results.map((boat, idx) => (
                <div key={idx} style={{ ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid transparent' }}
                  onClick={() => openBoatDetails(boat)}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'transparent')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111' }}>{boat.boat_name}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{boat.partner_name}</p>
                    </div>
                    <span style={{ padding: '4px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '12px', fontWeight: '500', height: 'fit-content' }}>
                      {boat.boat_type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                    <span>📏 {boat.length_ft} ft</span>
                    <span>👥 до {boat.max_guests} чел</span>
                    {boat.cabin_count > 0 && <span>🛏️ {boat.cabin_count} каюты</span>}
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>🗺️ {boat.route_name}</p>
                    {boat.season && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8b5cf6' }}>{seasonLabel(boat.season || "")}</p>}
                    {boat.fuel_surcharge > 0 && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>⛽ +{boat.fuel_surcharge.toLocaleString()} THB топливо</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {showAgentPrice ? (
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{(boat.calculated_agent_total || boat.base_price).toLocaleString()}</span></p>
                        <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB{markupPercent > 0 && <span style={{ fontSize: '11px', color: '#8b5cf6' }}> (+{markupPercent}%)</span>}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed' }}>
                          Profit: {(Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
                        </p>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
                        {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB
                      </p>
                    )}
                    <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                      Выбрать →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🚤</p>
            <p style={{ fontSize: '18px' }}>Выберите параметры и нажмите "Найти лодки"</p>
          </div>
        )}
      </div>

      {/* ==================== MODAL ==================== */}
      {selectedBoat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>{selectedBoat.boat_name}</h2>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>{selectedBoat.partner_name} • {selectedBoat.route_name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Итого</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{(totals.totalClient || 0).toLocaleString()} THB</p>
                </div>
                <button onClick={closeModal} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
            </div>

            {/* Quick Navigation */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Быстрый переход:</span>
              <a href="#included" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>✅ Включено</a>
              <a href="#food" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🍽️ Еда</a>
              <a href="#drinks" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🍺 Напитки</a>
              <a href="#toys" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🏄 Игрушки</a>
              <a href="#services" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🎉 Услуги</a>
              <a href="#transfer" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🚗 Трансфер</a>
              <a href="#fees" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>🎫 Сборы</a>
              <a href="#summary" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>📋 Итого</a>
            </div>

            {/* All Sections - Single Scrollable Page */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

              {/* ==================== BOAT INFO HEADER ==================== */}
              <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', borderRadius: '16px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🚢 {selectedBoat.boat_name}</h2>
                    <p style={{ margin: '8px 0 0', fontSize: '16px', opacity: 0.9 }}>📍 {selectedBoat.route_name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>{selectedBoat.partner_name} • {selectedBoat.duration_hours || 8}ч • до {selectedBoat.max_guests} гостей{selectedBoat.cabin_count > 0 && (" • " + selectedBoat.cabin_count + " кают")}{selectedBoat.season && (" • " + seasonLabel(selectedBoat.season || ""))}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Базовая цена</p>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{(selectedBoat.calculated_total || 0).toLocaleString()} THB</p>
                  </div>
                </div>

                {/* Guest count & extra pax pricing */}
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: '600', fontSize: '15px' }}>👥 Гости на борту</p>
                  
                  {/* Info line */}
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px' }}>
                    <span>Базовая цена: <strong>{selectedBoat.base_pax || 8} чел</strong></span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Макс: <strong>{selectedBoat.max_guests} чел</strong></span>
                    {selectedBoat.cabin_count > 0 && (
                      <>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span>🛏️ Кают: <strong>{selectedBoat.cabin_count}</strong></span>
                      </>
                    )}
                  </div>

                  {/* Guest inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {/* Extra Adults */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>👨 Доп. взрослые</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <button onClick={() => setExtraAdults(Math.max(0, extraAdults - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{extraAdults}</span>
                        <button onClick={() => setExtraAdults(extraAdults + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={customAdultPrice !== null ? customAdultPrice : (selectedBoat.extra_pax_price || 0)}
                          onChange={(e) => setCustomAdultPrice(Number(e.target.value) || 0)}
                          style={{ width: '65px', padding: '4px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '12px', textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.8)' }}
                        />
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>THB</span>
                      </div>
                    </div>

                    {/* Children 3-11 */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>👧 Дети 3-11 лет</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <button onClick={() => setChildren3to11(Math.max(0, children3to11 - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{children3to11}</span>
                        <button onClick={() => setChildren3to11(children3to11 + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={customChildPrice !== null ? customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5))}
                          onChange={(e) => setCustomChildPrice(Number(e.target.value) || 0)}
                          style={{ width: '65px', padding: '4px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '12px', textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.8)' }}
                        />
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>THB</span>
                      </div>
                    </div>

                    {/* Children under 3 */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', opacity: 0.8, display: 'block', marginBottom: '6px' }}>
                        👶 Дети до 3 лет
                        <span style={{ color: '#4ade80' }}> (бесплатно)</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => setChildrenUnder3(Math.max(0, childrenUnder3 - 1))} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>{childrenUnder3}</span>
                        <button onClick={() => setChildrenUnder3(childrenUnder3 + 1)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '16px', color: 'white' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Total guests & surcharge */}
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>
                      Всего гостей: <strong>{(selectedBoat.base_pax || 8) + extraAdults + children3to11 + childrenUnder3}</strong> из {selectedBoat.max_guests}
                    </span>
                    {(extraAdults > 0 || children3to11 > 0) && (
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#fbbf24' }}>
                        Доплата: +{((extraAdults * (customAdultPrice !== null ? customAdultPrice : (selectedBoat.extra_pax_price || 0))) + (children3to11 * (customChildPrice !== null ? customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5))))).toLocaleString()} THB
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ==================== INCLUDED SECTION ==================== */}
              <div id="included" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '16px', border: '2px solid #86efac' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#166534' }}>✅ ВКЛЮЧЕНО В СТОИМОСТЬ</h3>
                {loadingOptions ? (
                  <p>Загрузка...</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {boatOptions.filter(o => o.status === 'included').map(opt => (
                      <span key={opt.id} style={{ padding: '8px 16px', backgroundColor: '#dcfce7', borderRadius: '20px', fontSize: '14px', color: '#166534', border: '1px solid #86efac' }}>
                        ✓ {opt.option_name}
                      </span>
                    ))}
                    {boatOptions.filter(o => o.status === 'included').length === 0 && (
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о включённых опциях не указана в контракте</span>
                    )}
                  </div>
                )}
              </div>

              {/* ==================== NOT INCLUDED SECTION ==================== */}
              <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '2px solid #fca5a5' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>❌ НЕ ВКЛЮЧЕНО (нужно доплатить или взять своё)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {routeFees.filter(f => f.mandatory).length > 0 && routeFees.filter(f => f.mandatory).map(fee => (
                    <div key={fee.id} style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{fee.name_en}</span>
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>— {fee.price_per_person} THB/чел</span>
                      <span style={{ padding: '2px 8px', backgroundColor: '#fecaca', borderRadius: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>⚠️ ОБЯЗАТЕЛЬНО</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <span>Алкоголь</span>
                  </div>
                  <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <span>Трансфер от отеля</span>
                  </div>
                  <div style={{ padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <span>VAT 7% (если нужен счёт)</span>
                  </div>
                </div>
              </div>

              {/* ==================== FOOD SECTION ==================== */}
              <div id="food" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fffbeb', borderRadius: '16px', border: '1px solid #fcd34d' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>🍽️ ПИТАНИЕ</h3>
                
                {/* Included menu sets from partner */}
                {boatMenu.filter(m => m.included && m.from_partner_menu).length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#166534' }}>✅ Включено в стоимость — выберите сеты:</p>
                    {(() => {
                      const menu = partnerMenus.find(pm => pm.partner_id === selectedBoat?.partner_id);
                      return (menu?.conditions_ru || menu?.conditions) ? (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e' }}>
                          <strong>⚠️ ' + t('pdf.conditions', lang) + '</strong> {menu.conditions_ru || menu.conditions}
                        </div>
                      ) : null;
                    })()}
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {boatMenu.filter(m => m.included && m.from_partner_menu).map(set => {
                        const isSelected = cateringOrders.some(c => c.packageId === set.id);
                        const orderIndex = cateringOrders.findIndex(c => c.packageId === set.id);
                        const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                        const categoryLabels: Record<string, string> = { thai: '🇹🇭 Тайская', western: '🍝 Западная', vegetarian: '🥗 Вегетарианская', kids: '👶 Детская', seafood: '🦐 Морепродукты', bbq: '🍖 BBQ', other: '🍽️ Другое' };
                        return (
                          <div key={set.id} style={{ padding: '12px 16px', backgroundColor: isSelected ? '#dcfce7' : '#f0fdf4', borderRadius: '10px', border: isSelected ? '2px solid #22c55e' : '1px solid #86efac' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: set.dishes ? '8px' : '0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setCateringOrders(cateringOrders.filter(c => c.packageId !== set.id));
                                    } else {
                                      setCateringOrders([...cateringOrders, { packageId: set.id, packageName: set.name_en + (set.name_ru ? ' (' + set.name_ru + ')' : ''), pricePerPerson: 0, persons: adults + children3to11, notes: '' }]);
                                    }
                                  }}
                                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#22c55e' }}
                                />
                                <div>
                                  <span style={{ fontWeight: '600', color: '#166534' }}>{set.name_en}</span>
                                  {set.name_ru && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#15803d' }}>({set.name_ru})</span>}
                                  <span style={{ marginLeft: '10px', padding: '2px 8px', backgroundColor: '#bbf7d0', borderRadius: '4px', fontSize: '11px', color: '#166534' }}>{categoryLabels[set.category] || set.category}</span>
                                </div>
                              </div>
                              {isSelected && order && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #22c55e', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>−</button>
                                  <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600', color: '#166534' }}>{order.persons} чел</span>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #22c55e', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>+</button>
                                </div>
                              )}
                            </div>
                            {set.dishes && set.dishes.length > 0 && (
                              <div style={{ marginLeft: "30px", fontSize: "13px", color: "#15803d", display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                                {set.dishes.map((dish: string, i: number) => {
                                  const isChoice = dish.match(/^Choice of|^Select|^Pick/i);
                                  const dishRu = set.dishes_ru && set.dishes_ru[i] ? set.dishes_ru[i] : "";
                                  const isChoiceRu = dishRu.match(/^На выбор/i);
                                  if (isChoice || isChoiceRu) {
                                    const label = dish.split(":")[0];
                                    const labelRu = dishRu ? dishRu.split(":")[0] : "";
                                    const options = dish.split(":").slice(1).join(":").split(",").map(o => o.trim()).filter(Boolean);
                                    const optionsRu = dishRu ? dishRu.split(":").slice(1).join(":").split(",").map((o: string) => o.trim()).filter(Boolean) : [];
                                    return (
                                      <div key={i} style={{ padding: "10px 14px", backgroundColor: "#fef9c3", borderRadius: "8px", border: "1px solid #fde68a" }}>
                                        <div style={{ fontWeight: "600", marginBottom: "8px", color: "#92400e" }}>{label}{labelRu ? ` (${labelRu})` : ""}:</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                          {options.map((opt, j) => {
                                            const key = set.id + "_" + i + "_" + j;
                                            const count = selectedDishes[key] || 0;
                                            return (
                                              <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: "6px", backgroundColor: count > 0 ? "#dcfce7" : "#fefce8" }}>
                                                <span style={{ flex: 1 }}>{opt}{optionsRu[j] ? ` (${optionsRu[j]})` : ""}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                                                  <button onClick={() => setSelectedDishes(prev => ({...prev, [key]: Math.max(0, (prev[key] || 0) - 1)}))} style={{ width: "26px", height: "26px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontSize: "14px" }}>−</button>
                                                  <span style={{ minWidth: "24px", textAlign: "center", fontWeight: "600" }}>{count}</span>
                                                  <button onClick={() => setSelectedDishes(prev => ({...prev, [key]: (prev[key] || 0) + 1}))} style={{ width: "26px", height: "26px", border: "1px solid #22c55e", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#166534" }}>+</button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                      <span style={{ color: "#22c55e", marginTop: "2px" }}>•</span>
                                      <span>{dish}{dishRu ? ` (${dishRu})` : ""}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other included food (non-partner menu) */}
                {(boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').length > 0 || boatMenu.filter(m => m.included && !m.from_partner_menu).length > 0) && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: '600', color: '#166534' }}>Также включено: </span>
                    {boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').map((o, i) => (
                      <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>
                    ))}
                    {boatMenu.filter(m => m.included && !m.from_partner_menu).map((m, i) => (
                      <span key={m.id}>{(i > 0 || boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').length > 0) ? ', ' : ''}{m.name_en}</span>
                    ))}
                  </div>
                )}

                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#92400e', fontWeight: '500' }}>➕ Хотите улучшить?</p>

                {/* Boat menu options */}
                {boatMenu.filter(m => !m.included).length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400e' }}>● Меню с яхты:</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {boatMenu.filter(m => !m.included).map(item => {
                        const isAdded = cateringOrders.some(c => c.packageId === 'menu_' + item.id);
                        const orderIndex = cateringOrders.findIndex(c => c.packageId === 'menu_' + item.id);
                        const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#fef3c7' : '#fafafa', borderRadius: '8px', border: isAdded ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={isAdded} 
                                onChange={() => {
                                  if (isAdded) {
                                    setCateringOrders(cateringOrders.filter(c => c.packageId !== 'menu_' + item.id));
                                  } else {
                                    addMenuItem(item);
                                  }
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                              />
                              <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                              {item.name_ru && <span style={{ fontSize: '13px', color: '#6b7280' }}>({item.name_ru})</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {isAdded && order && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #d97706', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>−</button>
                                  <span style={{ minWidth: '60px', textAlign: 'center', fontWeight: '600' }}>{order.persons} чел</span>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #d97706', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  value={getPrice(`menu_${item.id}`, item.price)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPrice(`menu_${item.id}`, val);
                                    if (isAdded && orderIndex >= 0) {
                                      const newOrders = [...cateringOrders];
                                      newOrders[orderIndex] = {...newOrders[orderIndex], pricePerPerson: val};
                                      setCateringOrders(newOrders);
                                    }
                                  }}
                                  style={{ width: '70px', padding: '4px 6px', border: '1px solid #d97706', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px', color: '#d97706' }}
                                />
                                <span style={{ fontWeight: '600', color: '#d97706' }}>THB</span>
                                {isAdded && order && (
                                  <span style={{ marginLeft: '8px', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                                    = {(order.pricePerPerson * order.persons).toLocaleString()} THB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Boat paid food options */}
                {boatOptions.filter(o => o.category_code === 'food' && o.status === 'paid_optional').length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400e' }}>● Дополнительное питание с яхты:</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {boatOptions.filter(o => o.category_code === 'food' && o.status === 'paid_optional').map(opt => {
                        const isAdded = selectedExtras.some(e => e.optionId === opt.id);
                        const extra = selectedExtras.find(e => e.optionId === opt.id);
                        return (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#fef3c7' : '#fafafa', borderRadius: '8px', border: isAdded ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={isAdded} 
                                onChange={() => toggleExtra(opt)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                              />
                              <span style={{ fontWeight: '500' }}>{opt.option_name}</span>
                            </div>
                            <span style={{ fontWeight: '600', color: '#d97706' }}>+{opt.price} THB{opt.price_per === 'person' ? '/чел' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Catering partners - Collapsible */}
                {cateringPartners.length > 0 && (
                  <div style={{ borderRadius: '12px', border: '1px solid #e9d5ff', overflow: 'hidden' }}>
                    {/* Header - clickable to expand */}
                    <div 
                      onClick={() => toggleSection('partnerCatering')}
                      style={{ padding: '14px 16px', backgroundColor: '#faf5ff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{expandedSections.partnerCatering ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: '600', color: '#7c3aed' }}>🍽️ Кейтеринг от партнёров</span>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>({cateringPartners.length} партнёров)</span>
                      </div>
                    </div>
                    
                    {/* Content - collapsible */}
                    {expandedSections.partnerCatering && (
                      <div style={{ padding: '16px', backgroundColor: 'white' }}>
                        {cateringPartners.map(partner => (
                          <div key={partner.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                            {/* Partner header with markup slider */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontWeight: '600', color: '#7c3aed', fontSize: '16px' }}>{partner.name}</span>
                                {partner.description && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{partner.description}</p>}
                              </div>
                            </div>
                            
                            {/* Menu items */}
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {cateringMenu.filter(m => m.partner_id === partner.id).map(item => {
                                const isAdded = cateringOrders.some(c => c.packageId === 'db_' + item.id);
                                const orderIndex = cateringOrders.findIndex(c => c.packageId === 'db_' + item.id);
                                const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                                
                                return (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#f3e8ff' : 'white', borderRadius: '8px', border: isAdded ? '2px solid #a855f7' : '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isAdded} 
                                        onChange={() => {
                                          if (isAdded) {
                                            setCateringOrders(cateringOrders.filter(c => c.packageId !== 'db_' + item.id));
                                          } else {
                                            // Add with markup applied
                                            const customPrice = customPrices['catering_' + item.id] !== undefined ? customPrices['catering_' + item.id] : item.price_per_person;
                                            setCateringOrders([...cateringOrders, {
                                              packageId: 'db_' + item.id,
                                              packageName: item.name_en + ' (' + partner.name + ')',
                                              pricePerPerson: customPrice,
                                              persons: Math.max(adults, item.min_persons),
                                              minPersons: item.min_persons,
                                              notes: ''
                                            }]);
                                          }
                                        }}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                                      />
                                      <div>
                                        <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                                        {item.name_ru && <span style={{ marginLeft: '6px', fontSize: '13px', color: '#6b7280' }}>({item.name_ru})</span>}
                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>мин. {item.min_persons} чел</p>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      {isAdded && order && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #7c3aed', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>−</button>
                                          <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600' }}>{order.persons} чел</span>
                                          <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #7c3aed', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                          type="number"
                                          value={getPrice(`catering_${item.id}`, item.price_per_person)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setPrice(`catering_${item.id}`, val);
                                            if (isAdded && orderIndex >= 0) {
                                              const newOrders = [...cateringOrders];
                                              newOrders[orderIndex] = {...newOrders[orderIndex], pricePerPerson: val};
                                              setCateringOrders(newOrders);
                                            }
                                          }}
                                          style={{ width: '70px', padding: '4px 6px', border: '1px solid #7c3aed', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px', color: '#7c3aed' }}
                                        />
                                        <span style={{ fontWeight: '600', color: '#7c3aed' }}>THB</span>
                                        {isAdded && order && (
                                          <span style={{ marginLeft: '8px', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                                            = {(order.pricePerPerson * order.persons).toLocaleString()} THB
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {boatMenu.length === 0 && boatOptions.filter(o => o.category_code === 'food').length === 0 && cateringPartners.length === 0 && (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о питании не загружена</p>
                )}
              </div>

              {/* ==================== DRINKS SECTION ==================== */}
              <div id="drinks" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fdf4ff', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>🍺 НАПИТКИ И АЛКОГОЛЬ</h3>
                
                {/* Included drinks */}
                {boatDrinks.filter(d => d.included).length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: '600', color: '#166534' }}>Включено: </span>
                    {boatDrinks.filter(d => d.included).map((d, i) => (
                      <span key={d.id}>{i > 0 ? ', ' : ''}{d.name_en}</span>
                    ))}
                  </div>
                )}

                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#7c3aed', fontWeight: '500' }}>➕ Добавить алкоголь?</p>

                {/* Boat drinks for purchase */}
                {boatDrinks.filter(d => !d.included && d.price > 0).length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#7c3aed' }}>С яхты:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {boatDrinks.filter(d => !d.included && d.price > 0).map(drink => {
                        const order = drinkOrders.find(o => o.drinkId === drink.id);
                        return (
                          <div key={drink.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: order ? '#f3e8ff' : '#fafafa', borderRadius: '8px', border: order ? '2px solid #a855f7' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!order} 
                                onChange={() => {
                                  if (order) {
                                    removeDrink(drink.id);
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
                                  <button onClick={() => setDrinkOrders(drinkOrders.map(d => d.drinkId === drink.id ? {...d, quantity: Math.max(1, d.quantity - 1)} : d))} style={{ width: '24px', height: '24px', border: '1px solid #7c3aed', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{order.quantity}</span>
                                  <button onClick={() => setDrinkOrders(drinkOrders.map(d => d.drinkId === drink.id ? {...d, quantity: d.quantity + 1} : d))} style={{ width: '24px', height: '24px', border: '1px solid #7c3aed', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
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

              {/* ==================== PARK FEES SECTION ==================== */}
              <div id="fees" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '16px', border: '1px solid #fca5a5' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>🏝️ ПАРКОВЫЕ СБОРЫ И ВЫСАДКА</h3>
                

                {/* Landing fee */}
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: landingEnabled ? '#fee2e2' : 'white', borderRadius: '12px', border: landingEnabled ? '2px solid #f87171' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={landingEnabled}
                        onChange={() => setLandingEnabled(!landingEnabled)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontWeight: '600' }}>🚤 Высадка на остров</span>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Landing fee / Сбор за высадку</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={landingFee}
                        onChange={(e) => setLandingFee(Number(e.target.value) || 0)}
                        style={{ width: '80px', padding: '8px', border: '1px solid #dc2626', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}
                      />
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>THB</span>
                    </div>
                  </div>
                </div>

                {/* Default park fee - always shown */}
                <div style={{ padding: '16px', backgroundColor: defaultParkFeeEnabled ? '#fee2e2' : 'white', borderRadius: '12px', border: defaultParkFeeEnabled ? '2px solid #f87171' : '1px solid #e5e7eb', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={defaultParkFeeEnabled}
                        onChange={() => setDefaultParkFeeEnabled(!defaultParkFeeEnabled)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontWeight: '600' }}>🌴 Парковый сбор (по умолчанию)</span>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>National Park Fee / Сбор за посещение нац. парка</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={defaultParkFee}
                        onChange={(e) => setDefaultParkFee(Number(e.target.value) || 0)}
                        style={{ width: '60px', padding: '2px 4px', border: '1px solid #dc2626', borderRadius: '4px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#dc2626' }}
                      />
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>THB/чел</span>
                    </div>
                  </div>
                  {defaultParkFeeEnabled && (
                    <div style={{ marginTop: '12px', marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6b7280' }}>Взрослых:</label>
                        <button onClick={() => setDefaultParkFeeAdults(Math.max(0, defaultParkFeeAdults - 1))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{defaultParkFeeAdults}</span>
                        <button onClick={() => setDefaultParkFeeAdults(defaultParkFeeAdults + 1)} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#6b7280' }}>Детей:</label>
                        <button onClick={() => setDefaultParkFeeChildren(Math.max(0, defaultParkFeeChildren - 1))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{defaultParkFeeChildren}</span>
                        <button onClick={() => setDefaultParkFeeChildren(defaultParkFeeChildren + 1)} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                      </div>
                      <div style={{ marginLeft: 'auto', fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>
                        = {(defaultParkFee * (defaultParkFeeAdults + defaultParkFeeChildren)).toLocaleString()} THB
                      </div>
                    </div>
                  )}
                </div>

                {routeFees.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>📍 {selectedBoat.route_name}:</p>
                    {routeFees.map(fee => {
                      const selected = selectedFees.find((f: any) => f.id === fee.id);
                      return (
                        <div key={fee.id} style={{ padding: '16px', backgroundColor: selected ? '#fee2e2' : 'white', borderRadius: '12px', border: selected ? '2px solid #f87171' : '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!selected} 
                                onChange={() => toggleFee(fee)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} 
                              />
                              <div>
                                <span style={{ fontWeight: '600' }}>{fee.name_en}</span>
                                {fee.mandatory && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#fecaca', borderRadius: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>⚠️ Обязательно</span>}
                                {fee.name_ru && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{fee.name_ru}</p>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                value={getPrice(`fee_${fee.id}`, fee.price_per_person)}
                                onChange={(e) => setPrice(`fee_${fee.id}`, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '60px', padding: '2px 4px', border: '1px solid #dc2626', borderRadius: '4px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#dc2626' }}
                              />
                              <span style={{ fontWeight: '600', color: '#dc2626' }}>THB/чел</span>
                            </div>
                            </div>
                          </div>
                          {selected && (
                            <div style={{ marginTop: '12px', marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '20px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#6b7280' }}>Взрослых:</label>
                                <button onClick={() => setSelectedFees(selectedFees.map((f: any) => f.id === fee.id ? {...f, adults: Math.max(0, f.adults - 1)} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{selected.adults}</span>
                                <button onClick={() => setSelectedFees(selectedFees.map((f: any) => f.id === fee.id ? {...f, adults: f.adults + 1} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#6b7280' }}>Детей:</label>
                                <button onClick={() => setSelectedFees(selectedFees.map((f: any) => f.id === fee.id ? {...f, children: Math.max(0, f.children - 1)} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>−</button>
                                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{selected.children}</span>
                                <button onClick={() => setSelectedFees(selectedFees.map((f: any) => f.id === fee.id ? {...f, children: f.children + 1} : f))} style={{ width: '28px', height: '28px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                              </div>
                              <div style={{ marginLeft: 'auto', fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>
                                = {(getPrice(`fee_${fee.id}`, fee.price_per_person) * (selected.adults + selected.children)).toLocaleString()} THB
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о сборах для этого маршрута не найдена</p>
                )}
              </div>

              {/* ==================== WATER TOYS SECTION ==================== */}
              <div id="toys" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ecfeff', borderRadius: '16px', border: '1px solid #a5f3fc' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#0891b2' }}>🎿 ВОДНЫЕ РАЗВЛЕЧЕНИЯ</h3>
                
                {/* Included water toys */}
                {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: '600', color: '#166534' }}>Включено: </span>
                    {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys' || o.category_code === 'equipment') && o.status === 'included').map((o, i) => (
                      <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>
                    ))}
                  </div>
                )}

                {/* Paid water toys from boat */}
                {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #a5f3fc' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#0891b2' }}>➕ Добавить с яхты:</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {boatOptions.filter(o => (o.category_code === 'water' || o.category_code === 'toys') && o.status === 'paid_optional').map(opt => {
                        const isAdded = selectedExtras.some(e => e.optionId === opt.id);
                        return (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#cffafe' : '#fafafa', borderRadius: '8px', border: isAdded ? '2px solid #22d3ee' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input type="checkbox" checked={isAdded} onChange={() => toggleExtra(opt)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                              <span style={{ fontWeight: '500' }}>{opt.option_name}</span>
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#0891b2' }}>
                              +<input
                                type="number"
                                value={getPrice(`opt_${opt.id}`, opt.price)}
                                onChange={(e) => setPrice(`opt_${opt.id}`, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '60px', padding: '2px 4px', border: '1px solid #0891b2', borderRadius: '4px', textAlign: 'right', fontSize: '13px' }}
                              /> THB{opt.price_per === 'hour' ? '/час' : opt.price_per === 'day' ? '/день' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Watersports catalog removed - using partners only */}

                {/* Partner watersports - Collapsible */}
                {watersportsPartners.length > 0 && (
                  <div style={{ borderRadius: '12px', border: '1px solid #a5f3fc', overflow: 'hidden' }}>
                    {/* Header - clickable */}
                    <div 
                      onClick={() => toggleSection('partnerWatersports')}
                      style={{ padding: '14px 16px', backgroundColor: '#ecfeff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{expandedSections.partnerWatersports ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: '600', color: '#0891b2' }}>🏄 🏄 Водные развлечения от партнёров</span>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>({watersportsPartners.length} партнёров)</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    {expandedSections.partnerWatersports && (
                      <div style={{ padding: '16px', backgroundColor: 'white' }}>
                        {watersportsPartners.map(partner => (
                          <div key={partner.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#ecfeff', borderRadius: '10px', border: '1px solid #a5f3fc' }}>
                            {/* Partner header with markup */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontWeight: '600', color: '#0891b2', fontSize: '16px' }}>{partner.name}</span>
                                {partner.phone && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>📞 {partner.phone}</p>}
                              </div>
                            </div>
                            
                            {/* Items */}
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {watersportsCatalog.filter(w => w.partner_id === partner.id).map(item => {
                                const isAdded = selectedPartnerWatersports.some(w => w.id === item.id);
                                const pw = selectedPartnerWatersports.find(w => w.id === item.id);
                                const basePrice = (item.price_per_hour || 0) > 0 ? item.price_per_hour : item.price_per_day;
                                // Using direct price edit
                                const totalPrice = isAdded && pw ? ((pw.pricePerHour || 0) * (pw.hours || 0) + (pw.pricePerDay || 0) * (pw.days || 0)) : 0;
                                // Using direct price edit
                                
                                return (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: isAdded ? '#cffafe' : 'white', borderRadius: '8px', border: isAdded ? '2px solid #22d3ee' : '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isAdded} 
                                        onChange={() => {
                                          if (isAdded) {
                                            removePartnerWatersport(item.id);
                                          } else {
                                            // Add with markup info
                                            setSelectedPartnerWatersports([...selectedPartnerWatersports, {
                                              id: item.id,
                                              name: item.name_en,
                                              partnerName: partner.name,
                                              partnerId: partner.id,
                                              pricePerHour: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_hour > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_hour || 0),
                                              pricePerDay: customPrices[`ws_${item.id}`] !== undefined ? (item.price_per_day > 0 ? customPrices[`ws_${item.id}`] : 0) : (item.price_per_day || 0),
                                              hours: (item.price_per_hour || 0) > 0 ? 1 : 0,
                                              days: (item.price_per_hour || 0) > 0 ? 0 : ((item.price_per_day || 0) > 0 ? 1 : 0),
                                              // markup removed
                                            }]);
                                          }
                                        }}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                                      />
                                      <div>
                                        <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                                        {item.name_ru && <span style={{ marginLeft: '6px', fontSize: '13px', color: '#6b7280' }}>({item.name_ru})</span>}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      {isAdded && pw && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {(item.price_per_hour || 0) > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <button onClick={() => updatePartnerWatersport(item.id, 'hours', Math.max(1, (pw.hours || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>−</button>
                                              <span style={{ minWidth: '40px', textAlign: 'center' }}>{pw.hours} ч</span>
                                              <button onClick={() => updatePartnerWatersport(item.id, 'hours', (pw.hours || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                            </div>
                                          )}
                                          {(item.price_per_day || 0) > 0 && (item.price_per_hour || 0) === 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <button onClick={() => updatePartnerWatersport(item.id, 'days', Math.max(1, (pw.days || 1) - 1))} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>−</button>
                                              <span style={{ minWidth: '40px', textAlign: 'center' }}>{pw.days} дн</span>
                                              <button onClick={() => updatePartnerWatersport(item.id, 'days', (pw.days || 1) + 1)} style={{ width: '24px', height: '24px', border: '1px solid #0891b2', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                          type="number"
                                          value={getPrice(`ws_${item.id}`, basePrice)}
                                          onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            setPrice(`ws_${item.id}`, val);
                                            if (isAdded) {
                                              const updated = selectedPartnerWatersports.map(w => 
                                                w.id === item.id ? {...w, pricePerHour: (item.price_per_hour || 0) > 0 ? val : 0, pricePerDay: (item.price_per_day || 0) > 0 ? val : 0} : w
                                              );
                                              setSelectedPartnerWatersports(updated);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ width: '80px', padding: '6px 8px', border: '1px solid #0891b2', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}
                                        />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>THB/{(item.price_per_hour || 0) > 0 ? 'час' : 'день'}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ==================== STAFF SERVICES SECTION ==================== */}
              <div id="services" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#faf5ff', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>👨‍💼 ДОПОЛНИТЕЛЬНЫЙ ПЕРСОНАЛ</h3>
                
                {staffServices.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {staffServices.map(service => {
                      const selected = selectedServices.find((s: any) => s.id === service.id);
                      return (
                        <div key={service.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: selected ? '#f3e8ff' : 'white', borderRadius: '10px', border: selected ? '2px solid #a855f7' : '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input type="checkbox" checked={!!selected} onChange={() => toggleService(service)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <div>
                              <span style={{ fontWeight: '500' }}>{service.name_en}</span>
                              {service.name_ru && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{service.name_ru}</p>}
                            </div>
                          </div>
                          <span style={{ fontWeight: '600', color: '#7c3aed' }}>+<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                value={getPrice(`service_${service.id}`, service.price || 0)}
                                onChange={(e) => setPrice(`service_${service.id}`, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '70px', padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'right', fontSize: '12px' }}
                              /> THB
                            </span></span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Список персонала не загружен</p>
                )}
              </div>

              {/* ==================== TRANSFER SECTION ==================== */}
              <div id="transfer" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #86efac' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#166534' }}>🚗 ТРАНСФЕР</h3>
                
                {/* Direction selector */}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setTransferDirection('round_trip');
                      // Обновляем цену при смене направления
                      if (useOwnTransfer) {
                        setTransferPickup(prev => ({...prev, price: ownTransferPriceRoundTrip}));
                        setCustomTransferPrice(ownTransferPriceRoundTrip);
                      } else if (useOwnTransferVip) {
                        setTransferPickup(prev => ({...prev, price: ownTransferVipPriceRoundTrip}));
                        setCustomTransferPrice(ownTransferVipPriceRoundTrip);
                      } else if (transferPickup.type !== 'none' && transferPickup.type !== 'own') {
                        const opt = transferOptionsDB.find(o => String(o.id) === String(transferPickup.type));
                        if (opt) {
                          const newPrice = customPrices[`transfer_${opt.id}`] !== undefined 
                            ? customPrices[`transfer_${opt.id}`] 
                            : (Number(opt.price_round_trip) || 0);
                          setTransferPickup(prev => ({...prev, price: newPrice}));
                          setCustomTransferPrice(newPrice);
                          // Сбросим кастомную цену чтобы взялась новая базовая
                          setPrice(`transfer_${opt.id}`, Number(opt.price_round_trip) || 0);
                        }
                      }
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: transferDirection === 'round_trip' ? '2px solid #22c55e' : '1px solid #e5e7eb', backgroundColor: transferDirection === 'round_trip' ? '#dcfce7' : 'white', cursor: 'pointer', fontWeight: '600' }}
                  >
                    🔄 Туда и обратно
                  </button>
                  <button
                    onClick={() => {
                      setTransferDirection('one_way');
                      // Обновляем цену при смене направления
                      if (useOwnTransfer) {
                        setTransferPickup(prev => ({...prev, price: ownTransferPriceOneWay}));
                        setCustomTransferPrice(ownTransferPriceOneWay);
                      } else if (useOwnTransferVip) {
                        setTransferPickup(prev => ({...prev, price: ownTransferVipPriceOneWay}));
                        setCustomTransferPrice(ownTransferVipPriceOneWay);
                      } else if (transferPickup.type !== 'none' && transferPickup.type !== 'own') {
                        const opt = transferOptionsDB.find(o => String(o.id) === String(transferPickup.type));
                        if (opt) {
                          const newPrice = Number(opt.price_one_way) || 0;
                          setTransferPickup(prev => ({...prev, price: newPrice}));
                          setCustomTransferPrice(newPrice);
                          // Обновим кастомную цену на новую базовую
                          setPrice(`transfer_${opt.id}`, Number(opt.price_one_way) || 0);
                        }
                      }
                    }}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: transferDirection === 'one_way' ? '2px solid #22c55e' : '1px solid #e5e7eb', backgroundColor: transferDirection === 'one_way' ? '#dcfce7' : 'white', cursor: 'pointer', fontWeight: '600' }}
                  >
                    ➡️ Только в одну сторону
                  </button>
                </div>
                
                <div style={{ display: 'grid', gap: '10px' }}>
                  {/* No transfer option */}
                  <div 
                    onClick={() => {
                      setTransferPickup({...transferPickup, type: 'none', price: 0});
                      setUseOwnTransfer(false);
                      setCustomTransferPrice(null);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: transferPickup.type === 'none' ? '#dcfce7' : 'white', borderRadius: '10px', border: transferPickup.type === 'none' ? '2px solid #22c55e' : '1px solid #e5e7eb', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: transferPickup.type === 'none' ? '6px solid #22c55e' : '2px solid #d1d5db', backgroundColor: 'white' }} />
                      <div>
                        <span style={{ fontWeight: '600' }}>Не нужен</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Клиент доберётся сам</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: '600', color: '#166534' }}>0 THB</span>
                  </div>

                  {/* Our own transfer */}
                  <div 
                    onClick={() => {
                      const price = transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay;
                      setTransferPickup({...transferPickup, type: 'own', price: price});
                      setUseOwnTransfer(true);
                      setUseOwnTransferVip(false);
                      setCustomTransferPrice(price);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: String(transferPickup.type) === 'own' ? '#dcfce7' : 'white', borderRadius: '10px', border: String(transferPickup.type) === 'own' ? '2px solid #22c55e' : '1px solid #e5e7eb', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: String(transferPickup.type) === 'own' ? '6px solid #22c55e' : '2px solid #d1d5db', backgroundColor: 'white' }} />
                      <div>
                        <span style={{ fontWeight: '600' }}>🚐 Наш трансфер</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Стандартный минивэн</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={transferDirection === 'round_trip' ? ownTransferPriceRoundTrip : ownTransferPriceOneWay}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (transferDirection === 'round_trip') {
                            setOwnTransferPriceRoundTrip(val);
                            if (String(transferPickup.type) === 'own') {
                              setTransferPickup({...transferPickup, price: val});
                              setCustomTransferPrice(val);
                            }
                          } else {
                            setOwnTransferPriceOneWay(val);
                            if (String(transferPickup.type) === 'own') {
                              setTransferPickup({...transferPickup, price: val});
                              setCustomTransferPrice(val);
                            }
                          }
                        }}
                        style={{ width: '70px', padding: '4px 6px', border: '1px solid #22c55e', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}
                      />
                      <span style={{ fontWeight: '600', color: '#166534' }}>THB</span>
                    </div>
                  </div>

                  {/* VIP Transfer option */}
                  <div
                    onClick={() => {
                      const price = transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay;
                      setTransferPickup({...transferPickup, type: 'vip', price});
                      setUseOwnTransfer(false);
                      setUseOwnTransferVip(true);
                      setCustomTransferPrice(price);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: useOwnTransferVip ? '#fef3c7' : 'white', borderRadius: '10px', border: useOwnTransferVip ? '2px solid #f59e0b' : '1px solid #e5e7eb', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: useOwnTransferVip ? '6px solid #f59e0b' : '2px solid #d1d5db', backgroundColor: 'white' }} />
                      <div>
                        <span style={{ fontWeight: '600' }}>👑 Наш трансфер VIP</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Премиум минивэн</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={transferDirection === 'round_trip' ? ownTransferVipPriceRoundTrip : ownTransferVipPriceOneWay}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (transferDirection === 'round_trip') {
                            setOwnTransferVipPriceRoundTrip(val);
                            if (useOwnTransferVip) {
                              setTransferPickup({...transferPickup, price: val});
                              setCustomTransferPrice(val);
                            }
                          } else {
                            setOwnTransferVipPriceOneWay(val);
                            if (useOwnTransferVip) {
                              setTransferPickup({...transferPickup, price: val});
                              setCustomTransferPrice(val);
                            }
                          }
                        }}
                        style={{ width: '70px', padding: '4px 6px', border: '1px solid #f59e0b', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}
                      />
                      <span style={{ fontWeight: '600', color: '#d97706' }}>THB</span>
                    </div>
                  </div>

                  
                </div>

                {/* Address input */}
                {transferPickup.type !== 'none' && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>📍 Адрес забора:</label>
                    <input
                      value={transferPickup.pickup}
                      onChange={(e) => setTransferPickup({...transferPickup, pickup: e.target.value})}
                      placeholder="Название отеля или адрес"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                )}

                {/* Total */}
                {transferPickup.price > 0 && (
                  <div style={{ marginTop: '16px', padding: '14px 16px', backgroundColor: '#dcfce7', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>✓ Трансфер ({transferDirection === 'round_trip' ? 'round trip' : 'one way'}):</span>
                    <span style={{ fontWeight: '700', color: '#166534', fontSize: '20px' }}>{transferPickup.price.toLocaleString()} THB</span>
                  </div>
                )}
              </div>

              <div id="summary" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', borderRadius: '16px', color: 'white' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700' }}>📊 ИТОГО</h3>
                
                {/* Markup slider */}
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600' }}>Наша наценка</span>
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '2px' }}>
                      <button onClick={() => setMarkupMode('percent')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: markupMode === 'percent' ? 'white' : 'transparent', color: markupMode === 'percent' ? '#1e40af' : 'rgba(255,255,255,0.7)' }}>%</button>
                      <button onClick={() => setMarkupMode('fixed')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: markupMode === 'fixed' ? 'white' : 'transparent', color: markupMode === 'fixed' ? '#1e40af' : 'rgba(255,255,255,0.7)' }}>THB</button>
                    </div>
                  </div>
                  {markupMode === 'percent' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <input type="number" min="0" max="500" value={boatMarkup} onChange={(e) => setBoatMarkup(Number(e.target.value) || 0)} style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }} />
                        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>%</span>
                        <span style={{ fontSize: '13px', opacity: 0.7 }}>= +{Math.round((selectedBoat?.calculated_total || 0) * boatMarkup / 100).toLocaleString()} THB</span>
                      </div>
                      <input type="range" min="0" max="200" value={boatMarkup} onChange={(e) => setBoatMarkup(Number(e.target.value))} style={{ width: '100%', height: '6px', cursor: 'pointer' }} />
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="number" min="0" step="1000" value={fixedMarkup} onChange={(e) => setFixedMarkup(Number(e.target.value) || 0)} style={{ width: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }} />
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>THB</span>
                      <span style={{ fontSize: '13px', opacity: 0.7 }}>= {((selectedBoat?.calculated_total || 0) > 0 ? (fixedMarkup / (selectedBoat?.calculated_total || 1) * 100).toFixed(1) : 0)}%</span>
                    </div>
                  )}
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Яхта (базовая цена)</span>
                    <span style={{ fontWeight: '600' }}>{(selectedBoat.calculated_total || 0).toLocaleString()} THB</span>
                  </div>

                  {(extraAdults + children3to11) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                      <span>Доп. гости ({extraAdults} взр + {children3to11} дет)</span>
                      <span style={{ fontWeight: "600" }}>+{((extraAdults * (customPrices["extra_adult"] || selectedBoat?.extra_pax_price || 0)) + (children3to11 * (customPrices["child_3_11"] || Math.round((selectedBoat?.extra_pax_price || 0) * 0.5)))).toLocaleString()} THB</span>
                    </div>
                  )}                  
                  {totals.fees > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Парковые сборы</span>
                      <span style={{ fontWeight: '600' }}>+{totals.fees.toLocaleString()} THB</span>
                    </div>
                  )}
                  
                  {totals.catering > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Питание</span>
                      <span style={{ fontWeight: '600' }}>+{totals.catering.toLocaleString()} THB</span>
                    </div>
                  )}
                  
                  {totals.drinks > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Напитки</span>
                      <span style={{ fontWeight: '600' }}>+{totals.drinks.toLocaleString()} THB</span>
                    </div>
                  )}
                  
                  {totals.toys > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Водные развлечения</span>
                      <span style={{ fontWeight: '600' }}>+{totals.toys.toLocaleString()} THB</span>
                    </div>
                  )}

                  {(totals.partnerWatersports || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                      <span>Водные услуги</span>
                      <span style={{ fontWeight: "600" }}>+{(totals.partnerWatersports || 0).toLocaleString()} THB</span>
                    </div>
                  )}                  
                  {totals.services > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Персонал</span>
                      <span style={{ fontWeight: '600' }}>+{totals.services.toLocaleString()} THB</span>
                    </div>
                  )}
                  
                  {totals.transfer > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Трансфер</span>
                      <span style={{ fontWeight: '600' }}>+{totals.transfer.toLocaleString()} THB</span>
                    </div>
                  )}
                  
                  {totals.extras > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Дополнительные опции</span>
                      <span style={{ fontWeight: '600' }}>+{totals.extras.toLocaleString()} THB</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#fcd34d' }}>
                    <span>Наценка {markupMode === "fixed" ? "(" + fixedMarkup.toLocaleString() + " THB)" : "(" + boatMarkup + "%)"}</span>
                    <span style={{ fontWeight: "600" }}>+{markupMode === "fixed" ? fixedMarkup.toLocaleString() : Math.round((selectedBoat.calculated_total || 0) * boatMarkup / 100).toLocaleString()} THB</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                    <span>💰 ЦЕНА ДЛЯ КЛИЕНТА</span>
                    <span>{(totals.totalClient || 0).toLocaleString()} THB</span>
                  </div>
                </div>

                {/* Custom notes */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'white' }}>📝 Заметки / Примечания:</label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Например: Обед в ресторане - кэш-ваучер 500 THB/чел для спидбота..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', minHeight: '80px', resize: 'vertical', backgroundColor: 'rgba(255,255,255,0.95)' }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={generatePDF}
                    style={{ flex: 1, padding: '16px', backgroundColor: 'white', color: '#1e40af', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    📄 Создать PDF
                  </button>
                  <button 
                    onClick={generateWhatsApp}
                    style={{ flex: 1, padding: '16px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    💬 Отправить в WhatsApp
                  </button>
                </div>
              </div>

            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'none' }}>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1] as any);
                }}
                style={{ padding: '12px 24px', backgroundColor: activeTab === 'included' ? '#e5e7eb' : '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: activeTab === 'included' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>
                ← Назад
              </button>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1] as any);
                }}
                style={{ padding: '12px 24px', backgroundColor: activeTab === 'summary' ? '#e5e7eb' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: activeTab === 'summary' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>
                Далее →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
