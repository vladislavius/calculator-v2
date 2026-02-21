'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder, CateringPartner, CateringMenuItem, WatersportsPartner, WatersportsCatalogItem, TransferOptionDB, StaffService, BoatMenuSet, BoatDrink, RouteFee, Partner, SimpleBoat, SimpleRoute , CalcResult} from './lib/types';
import { t, Lang } from "./lib/i18n"; import { inputStyle, labelStyle, cardStyle, tabStyle } from './lib/styles';
import { calculateTotals } from './lib/calculateTotals';
import { generatePDFContent } from './lib/generatePDF';
import { generateWhatsAppMessage } from './lib/generateWhatsApp';
import Header from './components/Header';
import { useCharterStore } from './store/useCharterStore';
import SearchResults from './components/SearchResults';
import { preloadAvailability } from './hooks/useBoatAvailability';
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
import { useIsMobile } from './hooks/useIsMobile';


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
  // Store
  const store = useCharterStore();
  const { set: storeSet } = store;

  // Sync store → local state (for fields updated by child components via store)
  useEffect(() => {
    const unsub = useCharterStore.subscribe((state) => {
      if (state.extraAdults !== extraAdults) setExtraAdults(state.extraAdults);
      if (state.children3to11 !== children3to11) setChildren3to11(state.children3to11);
      if (state.childrenUnder3 !== childrenUnder3) setChildrenUnder3(state.childrenUnder3);
      if (state.customAdultPrice !== customAdultPrice) setCustomAdultPrice(state.customAdultPrice);
      if (state.customChildPrice !== customChildPrice) setCustomChildPrice(state.customChildPrice);
      if (state.boatMarkup !== boatMarkup) setBoatMarkup(state.boatMarkup);
      if (state.fixedMarkup !== fixedMarkup) setFixedMarkup(state.fixedMarkup);
      if (state.markupMode !== markupMode) setMarkupMode(state.markupMode);
    });
    return () => unsub();
  });
  const isMobile = useIsMobile();

  // Search state
  const [searchDate, setSearchDate] = useState('');

  const [adults, setAdults] = useState(2);
  const lang = useCharterStore(s => s.lang);
  const [extraAdults, setExtraAdults] = useState(0);
  const [children3to11, setChildren3to11] = useState(0);
  const [childrenUnder3, setChildrenUnder3] = useState(0);
  const [customAdultPrice, setCustomAdultPrice] = useState<number | null>(null);
  const [customChildPrice, setCustomChildPrice] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [boatType, setBoatType] = useState('');
  const [destination, setDestination] = useState('');
  const [boatNameSearch, setBoatNameSearch] = useState('');
  const [boatPartners, setBoatPartners] = useState<Partner[]>([]);
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('');
  const [allBoats, setAllBoats] = useState<SimpleBoat[]>([]);
  const [allRoutes, setAllRoutes] = useState<SimpleRoute[]>([]);
  const [showBoatSuggestions, setShowBoatSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [timeSlot, setTimeSlot] = useState('full_day');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [season, setSeason] = useState('auto');

  // Results state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [boatUnavailMap, setBoatUnavailMap] = useState<Record<number, Array<{date_from: string, date_to: string}>>>({});
  const [boatCalSet, setBoatCalSet] = useState<Set<number>>(new Set());
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
  const [cateringPartners, setCateringPartners] = useState<CateringPartner[]>([]);
  const [cateringMenu, setCateringMenu] = useState<CateringMenuItem[]>([]);
  const [partnerMenus, setPartnerMenus] = useState<any[]>([]);
  const [partnerMenuSets, setPartnerMenuSets] = useState<any[]>([]);

  // New: Watersports partners from DB  
  const [watersportsPartners, setWatersportsPartners] = useState<WatersportsPartner[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<WatersportsCatalogItem[]>([]);
  const [selectedPartnerWatersports, setSelectedPartnerWatersports] = useState<any[]>([]);

  // New: Transfer options from DB
  const [transferOptionsDB, setTransferOptionsDB] = useState<TransferOptionDB[]>([]);

  // DB data
  const [boatDrinks, setBoatDrinks] = useState<BoatDrink[]>([]); // Use BoatDrink interface
  const [routeFees, setRouteFees] = useState<RouteFee[]>([]);
  const [landingFee, setLandingFee] = useState<number>(0);
  const [landingEnabled, setLandingEnabled] = useState<boolean>(false);
  const [defaultParkFee, setDefaultParkFee] = useState<number>(0);
  const [defaultParkFeeEnabled, setDefaultParkFeeEnabled] = useState<boolean>(false);
  const [defaultParkFeeAdults, setDefaultParkFeeAdults] = useState<number>(2);
  const [defaultParkFeeChildren, setDefaultParkFeeChildren] = useState<number>(0);
  const [staffServices, setStaffServices] = useState<StaffService[]>([]);
  const [boatMenu, setBoatMenu] = useState<any[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});

  // New: Boat markup slider
  const [boatMarkup, setBoatMarkup] = useState(0);

  const [markupMode, setMarkupMode] = useState<"percent" | "fixed">("fixed");
  const [fixedMarkup, setFixedMarkup] = useState(0);  // Partner markups
  const [partnerMarkups, setPartnerMarkups] = useState<{ [key: string]: number }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    boatFood: true,
    boatDrinks: true,
    boatToys: true,
    partnerCatering: false,
    partnerWatersports: false,
    partnerDecor: false
  });

  // Toggle section expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get/Set partner markup
  const getPartnerMarkup = (partnerId: number | string) => partnerMarkups[partnerId] || 15;
  const setPartnerMarkup = (partnerId: number | string, value: number) => {
    setPartnerMarkups(prev => ({ ...prev, [partnerId]: value }));
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
  const [customPrices, setCustomPrices] = useState<{ [key: string]: number }>({});

  // Helper to get custom price or original
  const getPrice = (itemId: string, originalPrice: number | null): number => {
    return customPrices[itemId] !== undefined ? customPrices[itemId] : (originalPrice || 0);
  };

  // Helper to set custom price
  const setPrice = (itemId: string, price: number) => {
    setCustomPrices(prev => ({ ...prev, [itemId]: price }));
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
  // Reverse sync: store → local for FeesSection (reads/writes store directly)
  useEffect(() => {
    const unsub = useCharterStore.subscribe((state) => {
      setSelectedFees(state.selectedFees || []);
      setLandingEnabled(state.landingEnabled ?? false);
      setLandingFee(state.landingFee ?? 0);
      setDefaultParkFeeEnabled(state.defaultParkFeeEnabled ?? false);
      setDefaultParkFee(state.defaultParkFee ?? 0);
      setDefaultParkFeeAdults(state.defaultParkFeeAdults ?? 0);
      setDefaultParkFeeChildren(state.defaultParkFeeChildren ?? 0);
    });
    return () => unsub();
  }, []);

  // Load user role once
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    if (token) {
      fetch('/api/auth/me', { headers: { 'x-session-token': token } })
        .then(r => r.json())
        .then(data => { if (data.user?.role === 'admin') storeSet({ isAdmin: true }); })
        .catch(() => {});
    }
  }, []);

  // Sync local state → store for components that read from store
  useEffect(() => {
    storeSet({
      searchDate, results, loading, showAgentPrice, markupPercent, lang,
      selectedBoat, boatOptions, loadingOptions, routeFees, staffServices, boatDrinks,
      
      
      transferPickup, transferDropoff, transferPrice, transferMarkup,
      
      
      extraAdults, children3to11, childrenUnder3, adults,
      customAdultPrice, customChildPrice, boatMarkup, fixedMarkup,
      markupMode, customNotes,
      boatMenu, cateringPartners, cateringMenu, partnerMenus, partnerMenuSets,
      watersportsPartners, watersportsCatalog,
      boatPartners, allBoats, allRoutes,
      showBoatSuggestions, showDestinationSuggestions, boatNameSearch, destination,
      selectedPartnerFilter, boatType, timeSlot, season, sortBy,
    });
  }, [searchDate, results, loading, showAgentPrice, markupPercent, lang,
    selectedBoat, boatOptions, loadingOptions, routeFees, staffServices, boatDrinks,
    
    
    transferPickup, transferDropoff, transferPrice, transferMarkup,
    
    
    extraAdults, children3to11, childrenUnder3, adults,
    customAdultPrice, customChildPrice, boatMarkup, fixedMarkup,
    markupMode, customNotes,
    boatMenu, cateringPartners, cateringMenu, partnerMenus, partnerMenuSets,
    watersportsPartners, watersportsCatalog,
    boatPartners, allBoats, allRoutes,
    showBoatSuggestions, showDestinationSuggestions, boatNameSearch, destination,
    selectedPartnerFilter, boatType, timeSlot, season, sortBy, storeSet]);

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

        // Загружаем доступность лодок для сортировки
        const today = new Date().toISOString().split('T')[0];
        const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const { data: unavailData } = await supabase
          .from('boat_unavailable_dates')
          .select('boat_id, date_from, date_to')
          .gte('date_to', today)
          .lte('date_from', in30days);
        if (unavailData) {
          const unavailMap: Record<number, Array<{date_from: string, date_to: string}>> = {};
          unavailData.forEach((u: any) => {
            if (!unavailMap[u.boat_id]) unavailMap[u.boat_id] = [];
            unavailMap[u.boat_id].push({ date_from: u.date_from, date_to: u.date_to });
          });
          setBoatUnavailMap(unavailMap);
        }
        const { data: calData } = await supabase
          .from('boat_calendars')
          .select('boat_id')
          .eq('active', true);
        if (calData) {
          setBoatCalSet(new Set(calData.map((c: any) => c.boat_id)));
        }

        // Загружаем все лодки по умолчанию (без поиска)
        const nowDate = new Date();
        const defaultDate = `${nowDate.getFullYear()}-${String(nowDate.getMonth()+1).padStart(2,'0')}-${String(nowDate.getDate()).padStart(2,'0')}`;
        const { data: defaultBoats } = await supabase.rpc('search_available_boats', {
          p_date: defaultDate,
          p_guests: 2,
          p_time_slot: 'full_day',
          p_boat_type: '',
          p_destination: '',
          p_max_budget: 999999,
        });
        if (defaultBoats && defaultBoats.length > 0) {
          storeSet({ results: defaultBoats, loading: false });
        }
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
        p_boat_type: boatType || '',
        p_destination: destination || '',
        p_max_budget: maxBudget ? Number(maxBudget) : 999999,
        p_season: season === 'auto' ? '' : season,
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
      // Если выбрана дата — сначала сортируем по доступности (свободные вверху)
      // Сортировка по доступности — загружаем свежие данные
      // Загружаем доступность для сортировки и квадратиков
      let availCalSet = new Set<number>();
      let availUnavailMap: Record<number, Array<{date_from: string, date_to: string}>> = {};
      if (searchDate) {
        const today = new Date().toISOString().split('T')[0];
        const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const [{ data: freshUnavail }, { data: freshCals }] = await Promise.all([
          supabase.from('boat_unavailable_dates')
            .select('boat_id, date_from, date_to')
            .gte('date_to', today)
            .lte('date_from', in30days),
          supabase.from('boat_calendars').select('boat_id').eq('active', true)
        ]);
        (freshUnavail || []).forEach((u: any) => {
          if (!availUnavailMap[u.boat_id]) availUnavailMap[u.boat_id] = [];
          availUnavailMap[u.boat_id].push({ date_from: u.date_from, date_to: u.date_to });
        });
        availCalSet = new Set((freshCals || []).map((c: any) => c.boat_id));
        setBoatUnavailMap(availUnavailMap);
        setBoatCalSet(availCalSet);
      }

      if (sortBy === 'price_asc') {
        filtered.sort((a: SearchResult, b: SearchResult) => a.calculated_total - b.calculated_total);
      } else if (sortBy === 'price_desc') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.calculated_total - a.calculated_total);
      } else if (sortBy === 'size') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.length_ft - a.length_ft);
      } else if (sortBy === 'capacity') {
        filtered.sort((a: SearchResult, b: SearchResult) => b.max_guests - a.max_guests);
      }

      // Сортировка по доступности — всегда поверх основной
      if (searchDate && availCalSet.size > 0) {
        filtered.sort((a: SearchResult, b: SearchResult) => {
          const aUnavail = (availUnavailMap[a.boat_id] || []).some((u: any) => searchDate >= u.date_from && searchDate <= u.date_to);
          const bUnavail = (availUnavailMap[b.boat_id] || []).some((u: any) => searchDate >= u.date_from && searchDate <= u.date_to);
          const aScore = aUnavail ? 2 : availCalSet.has(a.boat_id) ? 0 : 1;
          const bScore = bUnavail ? 2 : availCalSet.has(b.boat_id) ? 0 : 1;
          return aScore - bScore;
        });
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
  const openBoatDetailsRef = { current: 0 }; // race condition guard
  const openBoatDetails = async (boat: SearchResult) => {
    const requestId = ++openBoatDetailsRef.current;
    setSelectedBoat(boat);
    setLoadingOptions(true);
    resetSelections();

    try {
      // Load all data in parallel
      const [drinksRes, routeRes, menuRes, optionsRes] = await Promise.all([
        supabase.from('boat_drinks').select('*').eq('partner_id', boat.partner_id),
        supabase.from('routes').select('id').ilike('name', '%' + boat.route_name.split(' ')[0] + '%').limit(1).single(),
        supabase.from('boat_menu').select('*').or('partner_id.eq.' + boat.partner_id + ',boat_id.eq.' + boat.boat_id),
        supabase.from('boat_options').select('id, status, price, price_per, quantity_included, notes, available, options_catalog (name_en, name_ru, code, category_id)').eq('boat_id', boat.boat_id).eq('available', true),
      ]);

      // Abort if user clicked another boat while loading
      if (requestId !== openBoatDetailsRef.current) return;

      setBoatDrinks(drinksRes.data || []);

      if (routeRes.data) {
        const { data: feesData } = await supabase.from('route_fees').select('*').eq('route_id', routeRes.data.id);
        if (requestId !== openBoatDetailsRef.current) return;
        setRouteFees(feesData || []);
        setSelectedFees([]);
      }

      // Boat menu (old system)
      let menuItems = menuRes.data || [];

      // Partner menu sets (new system)
      const partnerMenuIds = partnerMenus
        .filter(pm => pm.partner_id === boat.partner_id && (pm.boat_id === null || pm.boat_id === boat.boat_id))
        .map(pm => pm.id);

      if (partnerMenuIds.length > 0) {
        const relevantSets = partnerMenuSets.filter(ms => partnerMenuIds.includes(ms.menu_id));
        menuItems = [...menuItems, ...relevantSets.map(s => ({
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
        }))];
      }
      setBoatMenu(menuItems);

      // Transform options
      if (optionsRes.error) throw optionsRes.error;
      const transformed = (optionsRes.data || []).map((item: { id: number; options_catalog: any; status: string; price: number; price_per: string; quantity_included: number; notes: string }) => ({
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
      setBoatOptions(transformed);
    } catch (err) {
      console.error('Error loading options:', err);
    } finally {
      if (requestId === openBoatDetailsRef.current) {
        setLoadingOptions(false);
      }
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
    setCorkageFee(0);
  };

  const closeModal = () => {
    setSelectedBoat(null);
    resetSelections();
  };

  // ==================== CALCULATIONS ====================
  const calcTotals = () => {
    const ss = useCharterStore.getState();
    return calculateTotals({
      selectedBoat: ss.selectedBoat || selectedBoat,
      selectedExtras: ss.selectedExtras || [],
      cateringOrders: ss.cateringOrders || [],
      drinkOrders: ss.drinkOrders || [],
      selectedToys: ss.selectedToys || [],
      selectedServices: ss.selectedServices || [],
      selectedFees: ss.selectedFees || [],
      selectedPartnerWatersports: ss.selectedPartnerWatersports || [],
      transferPickup: ss.transferPickup || transferPickup,
      transferDropoff: ss.transferDropoff || transferDropoff,
      transferPrice: ss.transferPrice ?? transferPrice,
      transferMarkup: ss.transferMarkup ?? transferMarkup,
      landingEnabled: ss.landingEnabled ?? landingEnabled,
      landingFee: ss.landingFee ?? landingFee,
      defaultParkFeeEnabled: ss.defaultParkFeeEnabled ?? defaultParkFeeEnabled,
      defaultParkFee: ss.defaultParkFee ?? defaultParkFee,
      defaultParkFeeAdults: ss.defaultParkFeeAdults ?? defaultParkFeeAdults,
      defaultParkFeeChildren: ss.defaultParkFeeChildren ?? defaultParkFeeChildren,
      corkageFee: ss.corkageFee ?? corkageFee,
      extraAdults: ss.extraAdults ?? extraAdults,
      children3to11: ss.children3to11 ?? children3to11,
      childrenUnder3: ss.childrenUnder3 ?? childrenUnder3,
      adults: ss.adults ?? adults,
      customAdultPrice: ss.customAdultPrice ?? customAdultPrice,
      customChildPrice: ss.customChildPrice ?? customChildPrice,
      boatMarkup: ss.boatMarkup ?? boatMarkup,
      fixedMarkup: ss.fixedMarkup ?? fixedMarkup,
      markupMode: ss.markupMode || markupMode,
      markupPercent: ss.markupPercent ?? markupPercent,
      customPrices: ss.customPrices || {},
    });
  };

  const totals = calcTotals();


  // ==================== PDF GENERATION ====================
  const generatePDF = () => {
    if (!selectedBoat) return;
    // Use store values for guest counts and markup (GuestSelector updates store directly)
    const storeState = useCharterStore.getState();
    const pdfTotals = calculateTotals({
      selectedBoat: storeState.selectedBoat || selectedBoat,
      selectedExtras: storeState.selectedExtras || selectedExtras,
      cateringOrders: storeState.cateringOrders || cateringOrders,
      drinkOrders: storeState.drinkOrders || [],
      selectedToys: storeState.selectedToys || selectedToys,
      selectedServices: storeState.selectedServices || selectedServices,
      selectedFees: storeState.selectedFees || selectedFees,
      selectedPartnerWatersports: storeState.selectedPartnerWatersports || selectedPartnerWatersports,
      transferPickup: storeState.transferPickup || transferPickup,
      transferDropoff: storeState.transferDropoff || transferDropoff,
      transferPrice: storeState.transferPrice ?? transferPrice,
      transferMarkup: storeState.transferMarkup ?? transferMarkup,
      landingEnabled: storeState.landingEnabled ?? landingEnabled,
      landingFee: storeState.landingFee ?? landingFee,
      defaultParkFeeEnabled: storeState.defaultParkFeeEnabled ?? defaultParkFeeEnabled,
      defaultParkFee: storeState.defaultParkFee ?? defaultParkFee,
      defaultParkFeeAdults: storeState.defaultParkFeeAdults ?? defaultParkFeeAdults,
      defaultParkFeeChildren: storeState.defaultParkFeeChildren ?? defaultParkFeeChildren,
      corkageFee: storeState.corkageFee ?? corkageFee,
      extraAdults: storeState.extraAdults ?? extraAdults,
      children3to11: storeState.children3to11 ?? children3to11,
      childrenUnder3: storeState.childrenUnder3 ?? childrenUnder3,
      adults: storeState.adults ?? adults,
      customAdultPrice: storeState.customAdultPrice ?? customAdultPrice,
      customChildPrice: storeState.customChildPrice ?? customChildPrice,
      boatMarkup: storeState.boatMarkup ?? boatMarkup,
      fixedMarkup: storeState.fixedMarkup ?? fixedMarkup,
      markupMode: storeState.markupMode || markupMode,
      markupPercent: storeState.markupPercent ?? markupPercent,
      customPrices: storeState.customPrices || {}});
    const pdfGuests = (storeState.adults ?? adults) + (storeState.extraAdults ?? extraAdults) + (storeState.children3to11 ?? children3to11) + (storeState.childrenUnder3 ?? childrenUnder3);
    const html = generatePDFContent({
      selectedBoat,
      totals: pdfTotals as CalcResult,
      boatOptions,
      selectedExtras: storeState.selectedExtras || selectedExtras,
      cateringOrders: storeState.cateringOrders || cateringOrders,
      drinkOrders: storeState.drinkOrders || [],
      boatDrinks: boatDrinks,
      selectedToys: storeState.selectedToys || selectedToys,
      selectedServices: storeState.selectedServices || selectedServices,
      selectedFees: storeState.selectedFees || selectedFees,
      selectedPartnerWatersports: storeState.selectedPartnerWatersports || selectedPartnerWatersports,
      transferPickup: storeState.transferPickup || transferPickup,
      transferDirection,
      partnerMenus,
      boatMenu,
      selectedDishes: storeState.selectedDishes || selectedDishes || {},
      customPrices: storeState.customPrices || customPrices || {},
      lang: storeState.lang || lang,
      markupMode: storeState.markupMode || markupMode,
      fixedMarkup: storeState.fixedMarkup ?? fixedMarkup,
      boatMarkup: storeState.boatMarkup ?? boatMarkup,
      extraAdults: storeState.extraAdults ?? extraAdults,
      children3to11: storeState.children3to11 ?? children3to11,
      childrenUnder3: storeState.childrenUnder3 ?? childrenUnder3,
      adults: storeState.adults ?? adults,
      totalGuests: pdfGuests,
      customAdultPrice: storeState.customAdultPrice ?? customAdultPrice,
      customChildPrice: storeState.customChildPrice ?? customChildPrice,
      customNotes: storeState.customNotes || customNotes,
    });
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };



  // WhatsApp message generation
  const generateWhatsApp = () => {
    if (!selectedBoat) return;
    const ss = useCharterStore.getState();
    const waTotals = calculateTotals({
      selectedBoat: ss.selectedBoat || selectedBoat,
      selectedExtras: ss.selectedExtras || selectedExtras,
      cateringOrders: ss.cateringOrders || cateringOrders,
      drinkOrders: ss.drinkOrders || [],
      selectedToys: ss.selectedToys || selectedToys,
      selectedServices: ss.selectedServices || selectedServices,
      selectedFees: ss.selectedFees || selectedFees,
      selectedPartnerWatersports: ss.selectedPartnerWatersports || selectedPartnerWatersports,
      transferPickup: ss.transferPickup || transferPickup,
      transferDropoff: ss.transferDropoff || transferDropoff,
      transferPrice: ss.transferPrice ?? transferPrice,
      transferMarkup: ss.transferMarkup ?? transferMarkup,
      landingEnabled: ss.landingEnabled ?? landingEnabled,
      landingFee: ss.landingFee ?? landingFee,
      defaultParkFeeEnabled: ss.defaultParkFeeEnabled ?? defaultParkFeeEnabled,
      defaultParkFee: ss.defaultParkFee ?? defaultParkFee,
      defaultParkFeeAdults: ss.defaultParkFeeAdults ?? defaultParkFeeAdults,
      defaultParkFeeChildren: ss.defaultParkFeeChildren ?? defaultParkFeeChildren,
      corkageFee: ss.corkageFee ?? corkageFee,
      extraAdults: ss.extraAdults ?? extraAdults,
      children3to11: ss.children3to11 ?? children3to11,
      childrenUnder3: ss.childrenUnder3 ?? childrenUnder3,
      adults: ss.adults ?? adults,
      customAdultPrice: ss.customAdultPrice ?? customAdultPrice,
      customChildPrice: ss.customChildPrice ?? customChildPrice,
      boatMarkup: ss.boatMarkup ?? boatMarkup,
      fixedMarkup: ss.fixedMarkup ?? fixedMarkup,
      markupMode: ss.markupMode || markupMode,
      markupPercent: ss.markupPercent ?? markupPercent,
      customPrices: ss.customPrices || {}});
    const waGuests = (ss.adults ?? adults) + (ss.extraAdults ?? extraAdults) + (ss.children3to11 ?? children3to11) + (ss.childrenUnder3 ?? childrenUnder3);
    const message = generateWhatsAppMessage({
      selectedBoat,
      totals: waTotals as CalcResult,
      selectedExtras: ss.selectedExtras || selectedExtras,
      cateringOrders: ss.cateringOrders || cateringOrders,
      drinkOrders: ss.drinkOrders || [],
      selectedToys: ss.selectedToys || selectedToys,
      selectedServices: ss.selectedServices || selectedServices,
      selectedFees: ss.selectedFees || selectedFees,
      selectedPartnerWatersports: ss.selectedPartnerWatersports || selectedPartnerWatersports,
      transferPickup: ss.transferPickup || transferPickup,
      transferDirection,
      boatMenu,
      selectedDishes: ss.selectedDishes || selectedDishes || {},
      customPrices: ss.customPrices || customPrices || {},
      lang: ss.lang || lang,
      markupMode: ss.markupMode || markupMode,
      fixedMarkup: ss.fixedMarkup ?? fixedMarkup,
      boatMarkup: ss.boatMarkup ?? boatMarkup,
      extraAdults: ss.extraAdults ?? extraAdults,
      children3to11: ss.children3to11 ?? children3to11,
      childrenUnder3: ss.childrenUnder3 ?? childrenUnder3,
      adults: ss.adults ?? adults,
      totalGuests: waGuests,
      customAdultPrice: ss.customAdultPrice ?? customAdultPrice,
      customChildPrice: ss.customChildPrice ?? customChildPrice,
      customNotes: ss.customNotes || customNotes,
    });
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
  };
  // ==================== TOGGLE FUNCTIONS ====================

  const updateExtraQuantity = (optionId: number, delta: number) => {
    setSelectedExtras(selectedExtras.map(e =>
      e.optionId === optionId ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e
    ));
  };

  const addCatering = (pkg: CateringMenuItem) => {
    setCateringOrders([...cateringOrders, {
      packageId: String(pkg.id),
      packageName: pkg.name,
      pricePerPerson: pkg.price,
      persons: Math.max(adults, pkg.min_persons),
      notes: ''
    }]);
  };

  const removeCatering = (index: number) => {
    setCateringOrders(cateringOrders.filter((_, i) => i !== index));
  };
  // Add menu item from boat_menu



  // Update catering persons count

  // Add catering from DB partner
  const addCateringFromDB = (item: CateringMenuItem, partner: CateringPartner) => {
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
  const addPartnerWatersport = (item: WatersportsCatalogItem, partner: WatersportsPartner) => {
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






  const toggleToy = (toy: WatersportsCatalogItem) => {
    const exists = selectedToys.find(t => t.id === toy.id);
    if (exists) {
      setSelectedToys(selectedToys.filter(t => t.id !== toy.id));
    } else {
      setSelectedToys([...selectedToys, {
        id: toy.id,
        name: toy.name_en,
        nameRu: toy.name_ru,
        quantity: 1,
        hours: 1,
        days: 0,
        pricePerHour: toy.price_per_hour || 0,
        pricePerDay: toy.price_per_day || 0
      }]);
    }
  };


  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0C1825' }}>
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '8px' : '24px' }}>
        {/* Search Panel — sticky */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(12,24,37,0.92)', marginLeft: isMobile ? -8 : -24, marginRight: isMobile ? -8 : -24, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24, paddingTop: 8, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SearchPanel handleSearch={handleSearch} />
        </div>

        <SearchResults onSelectBoat={openBoatDetails} />
      </div>

      {/* ==================== MODAL ==================== */}
      {selectedBoat && (
        <div className="os-modal-overlay">
          <div className="os-modal">

            <ModalHeader closeModal={closeModal} />

            <div className="os-modal-body">
              <div className="os-modal-content">
              <IncludedSection />

              <FoodSection />

              <DrinksSection />

              <FeesSection />

              <ToysSection />

              {/* ==================== STAFF SERVICES SECTION ==================== */}
              <ServicesSection />

              <TransferSection />

              <SummarySection generatePDF={generatePDF} generateWhatsApp={generateWhatsApp} />

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
