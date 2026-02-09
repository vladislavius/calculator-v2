'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder } from './lib/types';
import { t, Lang } from "./lib/i18n";import { inputStyle, labelStyle, cardStyle, tabStyle } from './lib/styles';
import { calculateTotals } from './lib/calculateTotals';
import { generatePDFContent } from './lib/generatePDF';
import { generateWhatsAppMessage } from './lib/generateWhatsApp';
import Header from './components/Header';
import SearchResults from './components/SearchResults';
import IncludedSection from './components/IncludedSection';
import FoodSection from './components/FoodSection';
import SearchPanel from './components/SearchPanel';
import ModalHeader from './components/ModalHeader';
import GuestSelector from './components/GuestSelector';
import ServicesSection from './components/ServicesSection';
import DrinksSection from './components/DrinksSection';
import FeesSection from './components/FeesSection';
import ToysSection from './components/ToysSection';
import TransferSection from './components/TransferSection';
import SummarySection from './components/SummarySection';


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
      const { data: cpData } = await supabase.from('catering_partners').select('*');
      if (cpData) setCateringPartners(cpData);
      
      const { data: cmData } = await supabase.from('catering_menu').select('*');
      if (cmData) setCateringMenu(cmData);
      
      // Load watersports partners & catalog
      const { data: wpData } = await supabase.from('watersports_partners').select('*');
      if (wpData) setWatersportsPartners(wpData);
      
      const { data: wcData } = await supabase.from('watersports_catalog').select('*');
      if (wcData) setWatersportsCatalog(wcData);
      
      // Load transfer options
      const { data: toData } = await supabase.from('transfer_options').select('*');
      if (toData) setTransferOptionsDB(toData);
      
      // Load staff services
      const { data: ssData } = await supabase.from('staff_services').select('*');
      if (ssData) setStaffServices(ssData);
      
      // Load boat partners
      const { data: bpData } = await supabase.from('partners').select('*').order('name');
      if (bpData) setBoatPartners(bpData);

      // Load all boats for autocomplete
      const { data: boatsData } = await supabase.from('boats').select('id, name, partner_id').eq('active', true).order('name');
      if (boatsData) setAllBoats(boatsData);

      // Load all routes for autocomplete
      const { data: routesData } = await supabase.from('routes').select('id, name_en, name_ru').order('name_en');
      if (routesData) setAllRoutes(routesData);

      // Load partner menus (new system)
      const { data: pmData } = await supabase.from('partner_menus').select('*').eq('active', true);
      if (pmData) setPartnerMenus(pmData);
      
      const { data: msData } = await supabase.from('menu_sets').select('*').eq('active', true);
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
      const { data, error } = await supabase.rpc('search_available_boats', {
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
      const { data: drinksData } = await supabase
        .from('boat_drinks')
        .select('*')
        .eq('partner_id', boat.partner_id);
      setBoatDrinks(drinksData || []);
      
      // Load route fees for this route
      const { data: routeData } = await supabase
        .from('routes')
        .select('id')
        .ilike('name', '%' + boat.route_name.split(' ')[0] + '%')
        .limit(1)
        .single();
      
      if (routeData) {
        const { data: feesData } = await supabase
          .from('route_fees')
          .select('*')
          .eq('route_id', routeData.id);
        setRouteFees(feesData || []);
        
        // Don't auto-add fees - let user select them
        // Fees are now optional, user can add them manually
        setSelectedFees([]);
      }
      
      // Load boat menu (old system)
      const { data: menuData } = await supabase
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

      const { data, error } = await supabase
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
  const calcTotals = () => calculateTotals({
    selectedBoat, selectedExtras, cateringOrders, drinkOrders,
    selectedToys, selectedServices, selectedFees, selectedPartnerWatersports,
    transferPickup, transferDropoff, transferPrice, transferMarkup,
    landingEnabled, landingFee, defaultParkFeeEnabled, defaultParkFee,
    defaultParkFeeAdults, defaultParkFeeChildren, corkageFee,
    extraAdults, children3to11, childrenUnder3, adults,
    customAdultPrice, customChildPrice, boatMarkup, fixedMarkup,
    markupMode, markupPercent, customPrices,
  });

  const totals = calcTotals();

  
  // ==================== PDF GENERATION ====================
  const generatePDF = () => {
    if (!selectedBoat) return;
    const tots = calcTotals();
    const html = generatePDFContent({
      selectedBoat, totals: tots, boatOptions, selectedExtras, cateringOrders,
      drinkOrders, boatDrinks, selectedToys, selectedServices, selectedFees,
      selectedPartnerWatersports, transferPickup, transferDirection, partnerMenus,
      boatMenu, selectedDishes, customPrices, lang, markupMode, fixedMarkup,
      boatMarkup, extraAdults, children3to11, childrenUnder3, adults, totalGuests,
      customAdultPrice, customChildPrice, customNotes,
    });
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };



    // WhatsApp message generation
  const generateWhatsApp = () => {
    if (!selectedBoat) return;
    const tots = calcTotals();
    const message = generateWhatsAppMessage({
      selectedBoat, totals: tots, selectedExtras, cateringOrders, drinkOrders,
      selectedToys, selectedServices, selectedFees, selectedPartnerWatersports,
      transferPickup, transferDirection, boatMenu, selectedDishes, customPrices,
      lang, markupMode, fixedMarkup, boatMarkup, extraAdults, children3to11,
      childrenUnder3, adults, totalGuests, customAdultPrice, customChildPrice, customNotes,
    });
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
<Header lang={lang} setLang={setLang} />

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

        <SearchResults
          results={results}
          loading={loading}
          searchDate={searchDate}
          showAgentPrice={showAgentPrice}
          markupPercent={markupPercent}
          onSelectBoat={openBoatDetails}
        />
      </div>

      {/* ==================== MODAL ==================== */}
      {selectedBoat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <ModalHeader selectedBoat={selectedBoat} totals={totals} closeModal={closeModal} />

            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {/* Boat info header */}
              <div style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', borderRadius: '16px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', opacity: 0.9 }}>📏 {selectedBoat.length_ft} ft • 👥 до {selectedBoat.max_guests} чел • 🗺️ {selectedBoat.route_name}</p>
                  </div>
                </div>

<GuestSelector
                selectedBoat={selectedBoat}
                extraAdults={extraAdults} setExtraAdults={setExtraAdults}
                children3to11={children3to11} setChildren3to11={setChildren3to11}
                childrenUnder3={childrenUnder3} setChildrenUnder3={setChildrenUnder3}
                customAdultPrice={customAdultPrice} setCustomAdultPrice={setCustomAdultPrice}
                customChildPrice={customChildPrice} setCustomChildPrice={setCustomChildPrice}
              />
              </div>

              {/* ==================== INCLUDED SECTION ==================== */}
              <IncludedSection
                boatOptions={boatOptions}
                routeFees={routeFees}
                loadingOptions={loadingOptions}
              />

              <FoodSection
                selectedBoat={selectedBoat}
                boatMenu={boatMenu}
                boatOptions={boatOptions}
                cateringOrders={cateringOrders}
                setCateringOrders={setCateringOrders}
                cateringPartners={cateringPartners}
                cateringMenu={cateringMenu}
                partnerMenus={partnerMenus}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                customPrices={customPrices}
                getPrice={getPrice}
                setPrice={setPrice}
                addMenuItem={addMenuItem}
                updateCateringPersons={updateCateringPersons}
                adults={adults}
                children3to11={children3to11}
                selectedDishes={selectedDishes}
                setSelectedDishes={setSelectedDishes}
                lang={lang}
              />

              <DrinksSection
                boatDrinks={boatDrinks}
                drinkOrders={drinkOrders}
                addDrink={addDrink}
                removeDrink={removeDrink}
                setDrinkOrders={setDrinkOrders}
                getPrice={getPrice}
                setPrice={setPrice}
              />

              <FeesSection
                routeName={selectedBoat?.route_name || ''}
                routeFees={routeFees}
                selectedFees={selectedFees}
                toggleFee={toggleFee}
                setSelectedFees={setSelectedFees}
                landingEnabled={landingEnabled}
                setLandingEnabled={setLandingEnabled}
                landingFee={landingFee}
                setLandingFee={setLandingFee}
                defaultParkFeeEnabled={defaultParkFeeEnabled}
                setDefaultParkFeeEnabled={setDefaultParkFeeEnabled}
                defaultParkFee={defaultParkFee}
                setDefaultParkFee={setDefaultParkFee}
                defaultParkFeeAdults={defaultParkFeeAdults}
                setDefaultParkFeeAdults={setDefaultParkFeeAdults}
                defaultParkFeeChildren={defaultParkFeeChildren}
                setDefaultParkFeeChildren={setDefaultParkFeeChildren}
                getPrice={getPrice}
                setPrice={setPrice}
              />

              <ToysSection
                boatOptions={boatOptions}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}
                watersportsPartners={watersportsPartners}
                watersportsCatalog={watersportsCatalog}
                selectedPartnerWatersports={selectedPartnerWatersports}
                setSelectedPartnerWatersports={setSelectedPartnerWatersports}
                removePartnerWatersport={removePartnerWatersport}
                updatePartnerWatersport={updatePartnerWatersport}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                customPrices={customPrices}
                getPrice={getPrice}
                setPrice={setPrice}
              />

              {/* ==================== STAFF SERVICES SECTION ==================== */}
              <ServicesSection
                staffServices={staffServices}
                selectedServices={selectedServices}
                toggleService={toggleService}
                getPrice={getPrice}
                setPrice={setPrice}
              />

              <TransferSection
                transferDirection={transferDirection}
                setTransferDirection={setTransferDirection}
                transferPickup={transferPickup}
                setTransferPickup={setTransferPickup}
                useOwnTransfer={useOwnTransfer}
                setUseOwnTransfer={setUseOwnTransfer}
                useOwnTransferVip={useOwnTransferVip}
                setUseOwnTransferVip={setUseOwnTransferVip}
                ownTransferPriceRoundTrip={ownTransferPriceRoundTrip}
                setOwnTransferPriceRoundTrip={setOwnTransferPriceRoundTrip}
                ownTransferPriceOneWay={ownTransferPriceOneWay}
                setOwnTransferPriceOneWay={setOwnTransferPriceOneWay}
                ownTransferVipPriceRoundTrip={ownTransferVipPriceRoundTrip}
                setOwnTransferVipPriceRoundTrip={setOwnTransferVipPriceRoundTrip}
                ownTransferVipPriceOneWay={ownTransferVipPriceOneWay}
                setOwnTransferVipPriceOneWay={setOwnTransferVipPriceOneWay}
                transferOptionsDB={transferOptionsDB}
                customTransferPrice={customTransferPrice}
                setCustomTransferPrice={setCustomTransferPrice}
                customPrices={customPrices}
                setPrice={setPrice}
              />

              <SummarySection
                selectedBoat={selectedBoat}
                totals={totals}
                markupMode={markupMode}
                setMarkupMode={setMarkupMode}
                boatMarkup={boatMarkup}
                setBoatMarkup={setBoatMarkup}
                fixedMarkup={fixedMarkup}
                setFixedMarkup={setFixedMarkup}
                extraAdults={extraAdults}
                children3to11={children3to11}
                customPrices={customPrices}
                customNotes={customNotes}
                setCustomNotes={setCustomNotes}
                generatePDF={generatePDF}
                generateWhatsApp={generateWhatsApp}
              />

            </div>

            </div>
        </div>
      )}
    </div>
  );
}
