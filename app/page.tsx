'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==================== INTERFACES ====================
interface SearchResult {
  boat_id: number;
  boat_name: string;
  boat_type: string;
  length_ft: number;
  max_guests: number;
  cabin_count: number;
  crew_count: number;
  description: string;
  main_photo_url: string;
  partner_name: string;
  partner_id: number;
  route_name: string;
  destination: string;
  duration_hours: number;
  base_price: number;
  agent_price: number;
  client_price: number;
  extra_pax_price: number;
  fuel_surcharge: number;
  calculated_total: number;
  calculated_agent_total: number;
  base_pax: number;
  marina_name: string;
}

interface BoatOption {
  id: number;
  option_name: string;
  option_name_ru: string;
  option_category: string;
  category_code: string;
  status: string;
  price: number | null;
  price_per: string | null;
  quantity_included: number | null;
  notes: string | null;
}

interface SelectedExtra {
  optionId: number;
  name: string;
  nameRu: string;
  quantity: number;
  price: number;
  pricePer: string;
  category: string;
}

interface CateringOrder {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  persons: number;
  minPersons?: number;
  notes: string;
}

interface DrinkOrder {
  drinkId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface TransferOrder {
  type: 'none' | 'standard' | 'minivan' | 'vip';
  pickup: string;
  dropoff: string;
  price: number;
  notes: string;
}

// ==================== MOCK DATA ====================
// CATERING_PACKAGES moved to database (catering_menu table)

const DRINKS = [
  { id: 'water', name: 'Drinking Water', nameRu: 'Вода', price: 0, unit: 'included', category: 'non_alcoholic' },
  { id: 'soft', name: 'Soft Drinks', nameRu: 'Газировка', price: 0, unit: 'included', category: 'non_alcoholic' },
  { id: 'juice', name: 'Fresh Juice', nameRu: 'Свежий сок', price: 100, unit: 'glass', category: 'non_alcoholic' },
  { id: 'coconut', name: 'Fresh Coconut', nameRu: 'Кокос', price: 80, unit: 'piece', category: 'non_alcoholic' },
  { id: 'coffee', name: 'Coffee/Tea', nameRu: 'Кофе/Чай', price: 0, unit: 'included', category: 'non_alcoholic' },
  { id: 'beer_local', name: 'Local Beer (Chang/Leo)', nameRu: 'Местное пиво', price: 80, unit: 'can', category: 'alcohol' },
  { id: 'beer_import', name: 'Import Beer (Heineken)', nameRu: 'Импортное пиво', price: 120, unit: 'can', category: 'alcohol' },
  { id: 'wine_house', name: 'House Wine', nameRu: 'Домашнее вино', price: 950, unit: 'bottle', category: 'alcohol' },
  { id: 'wine_premium', name: 'Premium Wine', nameRu: 'Премиум вино', price: 2500, unit: 'bottle', category: 'alcohol' },
  { id: 'champagne', name: 'Champagne', nameRu: 'Шампанское', price: 3500, unit: 'bottle', category: 'alcohol' },
  { id: 'whiskey', name: 'Whiskey (Johnnie Walker)', nameRu: 'Виски', price: 2500, unit: 'bottle', category: 'alcohol' },
  { id: 'vodka', name: 'Vodka', nameRu: 'Водка', price: 2000, unit: 'bottle', category: 'alcohol' },
  { id: 'rum', name: 'Rum', nameRu: 'Ром', price: 1800, unit: 'bottle', category: 'alcohol' },
  { id: 'cocktail', name: 'Cocktails', nameRu: 'Коктейли', price: 250, unit: 'glass', category: 'alcohol' },
];

const TRANSFER_OPTIONS = [
  { type: 'none', name: 'Без трансфера', nameRu: 'Без трансфера', price: 0 },
  { type: 'standard', name: 'Standard (Sedan)', nameRu: 'Стандарт (Седан)', price: 800, maxPax: 3 },
  { type: 'minivan', name: 'Minivan (6-10 pax)', nameRu: 'Минивэн (6-10 чел)', price: 1500, maxPax: 10 },
  { type: 'vip', name: 'VIP (Mercedes/BMW)', nameRu: 'VIP (Mercedes/BMW)', price: 3500, maxPax: 3 },
];

const SPECIAL_SERVICES = [
  { id: 'photographer', name: 'Photographer', nameRu: 'Фотограф', price: 8000, unit: 'day' },
  { id: 'videographer', name: 'Videographer', nameRu: 'Видеограф', price: 12000, unit: 'day' },
  { id: 'drone', name: 'Drone Photography', nameRu: 'Съёмка с дрона', price: 5000, unit: 'day' },
  { id: 'dj', name: 'DJ', nameRu: 'Диджей', price: 10000, unit: 'day' },
  { id: 'live_music', name: 'Live Music', nameRu: 'Живая музыка', price: 15000, unit: 'day' },
  { id: 'masseuse', name: 'Masseuse (2 persons)', nameRu: 'Массажист (2 чел)', price: 4000, unit: 'day' },
  { id: 'chef', name: 'Private Chef', nameRu: 'Личный шеф', price: 6000, unit: 'day' },
  { id: 'decorator', name: 'Decorations', nameRu: 'Декорации', price: 5000, unit: 'event' },
  { id: 'cake', name: 'Birthday/Wedding Cake', nameRu: 'Торт', price: 3000, unit: 'piece' },
  { id: 'flowers', name: 'Flower Arrangements', nameRu: 'Цветочные композиции', price: 2500, unit: 'set' },
  { id: 'balloons', name: 'Balloons & Decor', nameRu: 'Шары и декор', price: 2000, unit: 'set' },
  { id: 'fireworks', name: 'Fireworks', nameRu: 'Фейерверк', price: 15000, unit: 'show' },
];

const WATER_TOYS = [
  { id: 'seabob', name: 'Seabob', nameRu: 'Сибоб', price: 10000, unit: 'day', description: 'Underwater scooter' },
  { id: 'jetski', name: 'Jet Ski', nameRu: 'Гидроцикл', price: 5000, unit: 'hour', description: '1 hour rental' },
  { id: 'flyboard', name: 'Flyboard', nameRu: 'Флайборд', price: 4000, unit: '30min', description: 'With instructor' },
  { id: 'wakeboard', name: 'Wakeboard', nameRu: 'Вейкборд', price: 3000, unit: 'hour', description: 'Board + tow' },
  { id: 'banana', name: 'Banana Boat', nameRu: 'Банан', price: 2000, unit: 'ride', description: '15 min ride' },
  { id: 'kayak', name: 'Kayak', nameRu: 'Каяк', price: 500, unit: 'hour', description: 'Single or double' },
  { id: 'sup', name: 'SUP Board', nameRu: 'SUP доска', price: 500, unit: 'hour', description: 'Stand-up paddle' },
  { id: 'snorkel', name: 'Snorkeling Set', nameRu: 'Снорклинг', price: 0, unit: 'included', description: 'Mask + fins' },
  { id: 'fishing', name: 'Fishing Gear', nameRu: 'Рыбалка', price: 1000, unit: 'set', description: 'Rod + bait' },
  { id: 'diving', name: 'Scuba Diving', nameRu: 'Дайвинг', price: 3500, unit: 'dive', description: 'With instructor' },
];

const FEES = [
  { id: 'park_similan', name: 'Similan National Park', nameRu: 'Нац. парк Симиланы', priceAdult: 500, priceChild: 300 },
  { id: 'park_phiphi', name: 'Phi Phi National Park', nameRu: 'Нац. парк Пхи Пхи', priceAdult: 400, priceChild: 200 },
  { id: 'park_phangnga', name: 'Phang Nga Bay', nameRu: 'Залив Пханг Нга', priceAdult: 300, priceChild: 150 },
  { id: 'park_surin', name: 'Surin Islands', nameRu: 'Острова Сурин', priceAdult: 500, priceChild: 300 },
  { id: 'maya_fee', name: 'Maya Bay Fee', nameRu: 'Сбор Maya Bay', priceAdult: 400, priceChild: 200 },
];

// ==================== COMPONENT ====================
export default function Home() {
  // Search state
  const [searchDate, setSearchDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [boatType, setBoatType] = useState('');
  const [destination, setDestination] = useState('');
  const [timeSlot, setTimeSlot] = useState('full_day');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');

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
  
  // New: Watersports partners from DB  
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  const [selectedPartnerWatersports, setSelectedPartnerWatersports] = useState<any[]>([]);
  
  // New: Transfer options from DB
  const [transferOptionsDB, setTransferOptionsDB] = useState<any[]>([]);
  
  // New: Boat markup slider
  const [boatMarkup, setBoatMarkup] = useState(15);

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
  const [transferPrice, setTransferPrice] = useState(0);
  const [transferMarkup, setTransferMarkup] = useState(15);

  // Special services
  const [selectedServices, setSelectedServices] = useState<{id: string, quantity: number}[]>([]);

  // Water toys
  const [selectedToys, setSelectedToys] = useState<{id: string, quantity: number, hours: number}[]>([]);

  // Fees
  const [selectedFees, setSelectedFees] = useState<{id: string, adults: number, children: number}[]>([]);

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

  const totalGuests = adults + children + infants;

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

  const occasions = [
    '', 'Birthday', 'Anniversary', 'Wedding', 'Proposal', 
    'Corporate Event', 'Bachelor/Bachelorette', 'Family Reunion', 'Other'
  ];

  // ==================== SEARCH ====================
  // Load partners data on mount
  useEffect(() => {
    const loadPartnersData = async () => {
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
        p_max_budget: maxBudget ? Number(maxBudget) : null
      });

      if (error) throw error;

      let filtered = data || [];
      
      if (minBudget) {
        filtered = filtered.filter((r: SearchResult) => r.calculated_total >= Number(minBudget));
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
      
      console.log('Loaded boat options:', transformed);
      
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
  };

  const closeModal = () => {
    setSelectedBoat(null);
    resetSelections();
  };

  // ==================== CALCULATIONS ====================
  const calculateTotals = () => {
    if (!selectedBoat) return { agent: 0, client: 0, extras: 0, catering: 0, drinks: 0, toys: 0, services: 0, transfer: 0, fees: 0, total: 0 };

    const baseAgent = selectedBoat.calculated_agent_total || selectedBoat.base_price;
    const baseClient = selectedBoat.calculated_total;

    // Extras from boat options
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);

    // Catering
    const cateringTotal = cateringOrders.reduce((sum, c) => sum + (c.pricePerPerson * c.persons), 0);

    // Drinks
    const drinksTotal = drinkOrders.reduce((sum, d) => sum + (d.price * d.quantity), 0) + corkageFee;

    // Water toys
    const toysTotal = selectedToys.reduce((sum, t) => {
      const toy = WATER_TOYS.find(w => w.id === t.id);
      if (!toy) return sum;
      if (toy.unit === 'hour') return sum + (toy.price * t.hours * t.quantity);
      return sum + (toy.price * t.quantity);
    }, 0);

    // Services
    const servicesTotal = selectedServices.reduce((sum, s) => {
      const service = SPECIAL_SERVICES.find(ss => ss.id === s.id);
      return sum + (service ? service.price * s.quantity : 0);
    }, 0);

    // Transfer (include DB transfer with markup)
    let transferTotal = transferPickup.price + transferDropoff.price;
    if (transferPrice > 0) {
      transferTotal += Math.round(transferPrice * (1 + transferMarkup / 100));
    }
    
    // Partner watersports (with individual markup)
    const partnerWatersportsTotal = selectedPartnerWatersports.reduce((sum, w) => {
      const base = (w.pricePerHour * w.hours) + (w.pricePerDay * w.days);
      return sum + Math.round(base * (1 + w.markup / 100));
    }, 0);

    // Park fees
    const feesTotal = selectedFees.reduce((sum, f) => {
      const fee = FEES.find(ff => ff.id === f.id);
      return sum + (fee ? (fee.priceAdult * f.adults) + (fee.priceChild * f.children) : 0);
    }, 0);

    // Children discount (50% on base price only)
    const childrenDiscount = Math.round(baseClient * 0.5 * (children / Math.max(1, totalGuests)));

    const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal + partnerWatersportsTotal;

    

    // Apply boat markup to base price for client
    const boatPriceWithMarkup = Math.round(baseClient * (1 + boatMarkup / 100));
    const totalBeforeMarkup = boatPriceWithMarkup + allExtras - childrenDiscount;
    const markupAmount = markupPercent > 0 ? Math.round(totalBeforeMarkup * markupPercent / 100) : 0;
    
    return {
      agent: baseAgent,
      client: baseClient,
      childrenDiscount,
      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      markup: markupAmount,
      totalAgent: baseAgent + allExtras - childrenDiscount,
      totalClient: totalBeforeMarkup + markupAmount
    };
  };

  const totals = calculateTotals();

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

  const addCatering = (pkg: typeof CATERING_PACKAGES[0]) => {
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
    setSelectedPartnerWatersports([...selectedPartnerWatersports, {
      id: item.id,
      name: item.name_en,
      partnerName: partner.name,
      pricePerHour: item.price_per_hour || 0,
      pricePerDay: item.price_per_day || 0,
      hours: item.price_per_day ? 0 : 1,
      days: item.price_per_day ? 1 : 0,
      markup: 15
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

  const addDrink = (drink: typeof DRINKS[0]) => {
    const exists = drinkOrders.find(d => d.drinkId === drink.id);
    if (exists) {
      setDrinkOrders(drinkOrders.map(d => 
        d.drinkId === drink.id ? { ...d, quantity: d.quantity + 1 } : d
      ));
    } else {
      setDrinkOrders([...drinkOrders, {
        drinkId: drink.id,
        name: drink.name,
        price: drink.price,
        quantity: 1,
        unit: drink.unit
      }]);
    }
  };

  const removeDrink = (drinkId: string) => {
    setDrinkOrders(drinkOrders.filter(d => d.drinkId !== drinkId));
  };

  const toggleService = (serviceId: string) => {
    const exists = selectedServices.find(s => s.id === serviceId);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, { id: serviceId, quantity: 1 }]);
    }
  };

  const toggleToy = (toyId: string) => {
    const exists = selectedToys.find(t => t.id === toyId);
    if (exists) {
      setSelectedToys(selectedToys.filter(t => t.id !== toyId));
    } else {
      setSelectedToys([...selectedToys, { id: toyId, quantity: 1, hours: 1 }]);
    }
  };

  const toggleFee = (feeId: string) => {
    const exists = selectedFees.find(f => f.id === feeId);
    if (exists) {
      setSelectedFees(selectedFees.filter(f => f.id !== feeId));
    } else {
      setSelectedFees([...selectedFees, { id: feeId, adults: adults, children: children }]);
    }
  };

  // ==================== STYLES ====================
  const inputStyle = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#1f2937', width: '100%', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' as const };
  const cardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
  const tabStyle = (active: boolean) => ({
    padding: '10px 16px', border: 'none', borderRadius: '8px',
    backgroundColor: active ? '#2563eb' : '#f3f4f6',
    color: active ? 'white' : '#6b7280',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500' as const
  });

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
            <a href="/import" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
              📄 Import
            </a>
            <a href="/partners" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
              👥 Партнёры
            </a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Search Panel */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>📅 Дата</label>
              <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>👨 Взрослые</label>
              <input type="number" value={adults} onChange={(e) => setAdults(Number(e.target.value))} min="1" max="100" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>👶 Дети (2-12)</label>
              <input type="number" value={children} onChange={(e) => setChildren(Number(e.target.value))} min="0" max="50" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>🍼 Младенцы (0-2)</label>
              <input type="number" value={infants} onChange={(e) => setInfants(Number(e.target.value))} min="0" max="10" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>🚤 Тип лодки</label>
              <select value={boatType} onChange={(e) => setBoatType(e.target.value)} style={inputStyle}>
                {boatTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>⏱️ Длительность</label>
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={inputStyle}>
                {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>🗺️ Направление</label>
              <input placeholder="Phi Phi, Phang Nga..." value={destination} onChange={(e) => setDestination(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>💰 Бюджет от (THB)</label>
              <input type="number" placeholder="Min" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>💰 Бюджет до (THB)</label>
              <input type="number" placeholder="Max" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>📊 Сортировка</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="size">Размер</option>
                <option value="capacity">Вместимость</option>
              </select>
            </div>
            <button onClick={handleSearch} disabled={loading}
              style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              {loading ? '⏳ Поиск...' : '🔍 Найти лодки'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              Найдено: {results.length} вариантов на {searchDate}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
              {results.map((boat) => (
                <div key={`${boat.boat_id}-${boat.route_name}`} style={{ ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid transparent' }}
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
                    <span>🛏️ {boat.cabin_count} каюты</span>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>🗺️ {boat.route_name}</p>
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
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{totals.totalClient.toLocaleString()} THB</p>
                </div>
                <button onClick={closeModal} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#fafafa' }}>
              <button onClick={() => setActiveTab('included')} style={tabStyle(activeTab === 'included')}>✅ Включено</button>
              <button onClick={() => setActiveTab('food')} style={tabStyle(activeTab === 'food')}>🍽️ Еда</button>
              <button onClick={() => setActiveTab('drinks')} style={tabStyle(activeTab === 'drinks')}>🍺 Напитки</button>
              <button onClick={() => setActiveTab('toys')} style={tabStyle(activeTab === 'toys')}>🏄 Игрушки</button>
              <button onClick={() => setActiveTab('services')} style={tabStyle(activeTab === 'services')}>🎉 Услуги</button>
              <button onClick={() => setActiveTab('transfer')} style={tabStyle(activeTab === 'transfer')}>🚗 Трансфер</button>
              <button onClick={() => setActiveTab('fees')} style={tabStyle(activeTab === 'fees')}>🎫 Сборы</button>
              <button onClick={() => setActiveTab('summary')} style={tabStyle(activeTab === 'summary')}>📋 Итого</button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              
              {/* INCLUDED TAB */}
              {activeTab === 'included' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#16a34a' }}>✅ Включено в стоимость</h3>
                  {loadingOptions ? (
                    <p>Загрузка опций...</p>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        {boatOptions.filter(o => o.status === 'included').map(opt => (
                          <div key={opt.id} style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac' }}>
                            <p style={{ margin: 0, fontWeight: '500', color: '#166534' }}>{opt.option_name}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#15803d' }}>{opt.option_name_ru}</p>
                          </div>
                        ))}
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#7c3aed' }}>💰 Платные опции</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {boatOptions.filter(o => o.status === 'paid_optional').map(opt => {
                          const selected = selectedExtras.find(e => e.optionId === opt.id);
                          return (
                            <div key={opt.id} style={{ padding: '12px', backgroundColor: selected ? '#f3e8ff' : '#f9fafb', borderRadius: '8px', border: selected ? '2px solid #a855f7' : '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: '500' }}>{opt.option_name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{opt.option_name_ru}</p>
                                {opt.price && opt.price > 0 && (
                                  <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: '#7c3aed' }}>
                                    {opt.price.toLocaleString()} THB / {opt.price_per}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {selected && (
                                  <>
                                    <button onClick={() => updateExtraQuantity(opt.id, -1)} style={{ width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                                    <span style={{ minWidth: '24px', textAlign: 'center' }}>{selected.quantity}</span>
                                    <button onClick={() => updateExtraQuantity(opt.id, 1)} style={{ width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                  </>
                                )}
                                <button onClick={() => toggleExtra(opt)} style={{ padding: '6px 12px', backgroundColor: selected ? '#dc2626' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                  {selected ? '✕' : '+ Add'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* FOOD TAB */}
              {activeTab === 'food' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🍽️ Кейтеринг и меню</h3>
                  
                  {/* Selected Orders */}
                  {cateringOrders.length > 0 && (
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600' }}>Заказано:</h4>
                      {cateringOrders.map((order, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fcd34d' }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>{order.packageName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateCateringPersons(i, order.persons - 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d97706', background: '#fef3c7', cursor: 'pointer' }}>-</button>
                            <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '500' }}>{order.persons} чел</span>
                            <button onClick={() => updateCateringPersons(i, order.persons + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #d97706', background: '#fef3c7', cursor: 'pointer' }}>+</button>
                            <span style={{ fontWeight: '600', marginLeft: '10px', minWidth: '80px' }}>{(order.pricePerPerson * order.persons).toLocaleString()} THB</span>
                            <button onClick={() => removeCatering(i)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Food options from the boat */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#059669' }}>🚤 Питание на яхте</h4>
                    
                    {/* Included food */}
                    {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'included').length > 0 && (
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontWeight: '600', color: '#059669', marginBottom: '8px', fontSize: '13px' }}>✓ Включено в стоимость:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'included').map(opt => (
                            <span key={opt.id} style={{ padding: '4px 10px', backgroundColor: '#d1fae5', borderRadius: '12px', fontSize: '12px', color: '#065f46' }}>
                              {opt.option_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Paid food options */}
                    {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'paid_optional' && opt.price > 0).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {boatOptions.filter(opt => opt.category_code === 'food' && opt.status === 'paid_optional' && opt.price > 0).map(opt => (
                          <div key={opt.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '500', fontSize: '13px' }}>{opt.option_name}</span>
                              <span style={{ fontWeight: '600', color: '#2563eb', fontSize: '13px' }}>{opt.price} THB</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{opt.price_per === 'person' ? 'за человека' : opt.price_per === 'day' ? 'в день' : 'за заказ'}</div>
                            <button 
                              onClick={() => {
                                const exists = selectedExtras.find(e => e.optionId === opt.id);
                                if (!exists) {
                                  setSelectedExtras([...selectedExtras, {
                                    optionId: opt.id,
                                    name: opt.option_name,
                                    nameRu: opt.option_name_ru || opt.option_name,
                                    quantity: 1,
                                    price: opt.price,
                                    pricePer: opt.price_per || 'trip',
                                    category: 'food'
                                  }]);
                                }
                              }}
                              disabled={selectedExtras.some(e => e.optionId === opt.id)}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: selectedExtras.some(e => e.optionId === opt.id) ? '#d1d5db' : '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px', 
                                width: '100%' 
                              }}
                            >
                              {selectedExtras.some(e => e.optionId === opt.id) ? '✓ Добавлено' : '+ Добавить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {boatOptions.filter(opt => opt.category_code === 'food').length === 0 && (
                      <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#6b7280', textAlign: 'center' }}>
                        Информация о питании на яхте не указана
                      </div>
                    )}
                  </div>

                  {/* Catering Partners from DB */}
                  {cateringPartners.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#7c3aed' }}>🍽️ Кейтеринг от партнёров</h4>
                      {cateringPartners.map(partner => (
                        <div key={partner.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#faf5ff' }}>
                          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#7c3aed' }}>{partner.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>{partner.description}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {cateringMenu.filter(m => m.partner_id === partner.id).map(item => (
                              <div key={item.id} style={{ padding: '8px', border: '1px solid #ddd6fe', borderRadius: '6px', backgroundColor: 'white' }}>
                                <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.name_en}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.name_ru} • мин. {item.min_persons} чел</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                  <span style={{ fontWeight: '600', color: '#7c3aed' }}>{item.price_per_person} THB/чел</span>
                                  <button onClick={() => addCateringFromDB(item, partner)} style={{ padding: '4px 10px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ Добавить</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dietary Requirements */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={labelStyle}>🥗 Особые пожелания по еде</label>
                    <textarea value={dietaryRequirements} onChange={(e) => setDietaryRequirements(e.target.value)} 
                      placeholder="Аллергии, вегетарианцы, халяль, без глютена..."
                      style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
                  </div>
                </div>
              )}

              {/* DRINKS TAB */}
              {activeTab === 'drinks' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🍺 Напитки</h3>
                  
                  {/* BYOB Option */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '500' }}>🍾 Свой алкоголь (BYOB)</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#92400e' }}>Можно привезти свои напитки</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="checkbox" checked={byobAllowed} onChange={(e) => setByobAllowed(e.target.checked)} />
                      {byobAllowed && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Corkage fee:</label>
                          <input type="number" value={corkageFee} onChange={(e) => setCorkageFee(Number(e.target.value))} 
                            style={{ width: '80px', marginLeft: '8px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', color: '#1f2937' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Drinks */}
                  {drinkOrders.length > 0 && (
                    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600' }}>Заказано:</h4>
                      {drinkOrders.map(d => (
                        <div key={d.drinkId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                          <span>{d.name} × {d.quantity}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600' }}>{(d.price * d.quantity).toLocaleString()} THB</span>
                            <button onClick={() => removeDrink(d.drinkId)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-Alcoholic */}
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#059669' }}>🥤 Безалкогольные</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {DRINKS.filter(d => d.category === 'non_alcoholic').map(drink => (
                      <div key={drink.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>{drink.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                            {drink.price === 0 ? '✓ Включено' : `${drink.price} THB/${drink.unit}`}
                          </p>
                        </div>
                        {drink.price > 0 && (
                          <button onClick={() => addDrink(drink)} style={{ padding: '4px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+</button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Alcoholic */}
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#dc2626' }}>🍺 Алкоголь</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {DRINKS.filter(d => d.category === 'alcohol').map(drink => (
                      <div key={drink.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>{drink.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{drink.price} THB/{drink.unit}</p>
                        </div>
                        <button onClick={() => addDrink(drink)} style={{ padding: '4px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WATER TOYS TAB */}
              {activeTab === 'toys' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🏄 Водные игрушки и оборудование</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {WATER_TOYS.map(toy => {
                      const selected = selectedToys.find(t => t.id === toy.id);
                      return (
                        <div key={toy.id} style={{ padding: '16px', border: selected ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: selected ? '#eff6ff' : '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                              <h4 style={{ margin: 0, fontWeight: '600' }}>{toy.name}</h4>
                              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>{toy.nameRu}</p>
                            </div>
                            <span style={{ fontWeight: 'bold', color: toy.price === 0 ? '#16a34a' : '#2563eb' }}>
                              {toy.price === 0 ? '✓ Free' : `${toy.price.toLocaleString()} THB/${toy.unit}`}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#9ca3af' }}>{toy.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selected && toy.unit === 'hour' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '12px' }}>Часов:</label>
                                <input type="number" min="1" value={selected.hours} 
                                  onChange={(e) => setSelectedToys(selectedToys.map(t => t.id === toy.id ? {...t, hours: Number(e.target.value)} : t))}
                                  style={{ width: '60px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', color: '#1f2937' }} />
                              </div>
                            )}
                            {selected && toy.unit !== 'hour' && toy.unit !== 'included' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => setSelectedToys(selectedToys.map(t => t.id === toy.id ? {...t, quantity: Math.max(1, t.quantity - 1)} : t))} 
                                  style={{ width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                                <span>{selected.quantity}</span>
                                <button onClick={() => setSelectedToys(selectedToys.map(t => t.id === toy.id ? {...t, quantity: t.quantity + 1} : t))} 
                                  style={{ width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                              </div>
                            )}
                            {!selected && <div />}
                            <button onClick={() => toggleToy(toy.id)} 
                              style={{ padding: '8px 16px', backgroundColor: selected ? '#dc2626' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                              {selected ? '✕ Убрать' : '+ Добавить'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SERVICES TAB */}
              {activeTab === 'services' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🎉 Дополнительные услуги</h3>
                  
                  {/* Special Occasion */}
                  <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fdf4ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                    <label style={{ ...labelStyle, color: '#7c3aed' }}>🎂 Особый случай</label>
                    <select value={specialOccasion} onChange={(e) => setSpecialOccasion(e.target.value)} style={inputStyle}>
                      <option value="">Выберите...</option>
                      {occasions.filter(o => o).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {SPECIAL_SERVICES.map(service => {
                      const selected = selectedServices.find(s => s.id === service.id);
                      return (
                        <div key={service.id} style={{ padding: '16px', border: selected ? '2px solid #7c3aed' : '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: selected ? '#faf5ff' : '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{service.name}</h4>
                            <span style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '14px' }}>{service.price.toLocaleString()} THB</span>
                          </div>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>{service.nameRu} / {service.unit}</p>
                          <button onClick={() => toggleService(service.id)} 
                            style={{ padding: '8px 16px', backgroundColor: selected ? '#dc2626' : '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                            {selected ? '✕ Убрать' : '+ Добавить'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Requests */}
                  <div style={{ marginTop: '24px' }}>
                    <label style={labelStyle}>📝 Особые пожелания</label>
                    <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} 
                      placeholder="Любые дополнительные пожелания или требования..."
                      style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
                  </div>
                </div>
              )}

              {/* WATERSPORTS PARTNERS */}
              {activeTab === 'toys' && watersportsPartners.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0891b2' }}>🏄 Водные игрушки от партнёров</h4>
                  
                  {/* Selected partner watersports */}
                  {selectedPartnerWatersports.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ecfeff', borderRadius: '8px', border: '1px solid #a5f3fc' }}>
                      <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600' }}>Выбрано:</h5>
                      {selectedPartnerWatersports.map(w => {
                        const basePrice = (w.pricePerHour * w.hours) + (w.pricePerDay * w.days);
                        const finalPrice = Math.round(basePrice * (1 + w.markup / 100));
                        return (
                          <div key={w.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '6px', backgroundColor: 'white', borderRadius: '6px' }}>
                            <span style={{ fontWeight: '500', flex: '1' }}>{w.name} ({w.partnerName})</span>
                            {w.pricePerHour > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" min="0" value={w.hours} onChange={(e) => updatePartnerWatersport(w.id, 'hours', Number(e.target.value))} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                                <span style={{ fontSize: '11px' }}>час</span>
                              </div>
                            )}
                            {w.pricePerDay > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" min="0" value={w.days} onChange={(e) => updatePartnerWatersport(w.id, 'days', Number(e.target.value))} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                                <span style={{ fontSize: '11px' }}>дн</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px' }}>Наценка:</span>
                              <input type="number" min="0" max="100" value={w.markup} onChange={(e) => updatePartnerWatersport(w.id, 'markup', Number(e.target.value))} style={{ width: '45px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center' }} />
                              <span style={{ fontSize: '11px' }}>%</span>
                            </div>
                            <span style={{ fontWeight: '600', color: '#0891b2' }}>{finalPrice.toLocaleString()} THB</span>
                            <button onClick={() => removePartnerWatersport(w.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {watersportsPartners.map(partner => (
                    <div key={partner.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f0fdfa' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#0891b2' }}>{partner.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {watersportsCatalog.filter(w => w.partner_id === partner.id).map(item => (
                          <div key={item.id} style={{ padding: '8px', border: '1px solid #99f6e4', borderRadius: '6px', backgroundColor: 'white' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.name_en}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.price_per_hour > 0 && `${item.price_per_hour} THB/час`}
                              {item.price_per_hour > 0 && item.price_per_day > 0 && ' • '}
                              {item.price_per_day > 0 && `${item.price_per_day} THB/день`}
                            </div>
                            <button 
                              onClick={() => addPartnerWatersport(item, partner)} 
                              disabled={selectedPartnerWatersports.some(w => w.id === item.id)}
                              style={{ marginTop: '6px', padding: '4px 10px', backgroundColor: selectedPartnerWatersports.some(w => w.id === item.id) ? '#d1d5db' : '#0891b2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                            >
                              {selectedPartnerWatersports.some(w => w.id === item.id) ? 'Добавлено' : '+ Добавить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TRANSFER TAB */}
              {activeTab === 'transfer' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🚗 Трансфер</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Pickup */}
                    <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                      <h4 style={{ margin: '0 0 16px', fontWeight: '600', color: '#166534' }}>🏨 → 🚤 К марине</h4>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>Тип трансфера</label>
                        <select value={transferPickup.type} onChange={(e) => {
                          const opt = TRANSFER_OPTIONS.find(t => t.type === e.target.value);
                          setTransferPickup({...transferPickup, type: e.target.value as any, price: opt?.price || 0});
                        }} style={inputStyle}>
                          {TRANSFER_OPTIONS.map(t => (
                            <option key={t.type} value={t.type}>{t.nameRu} {t.price > 0 ? `(${t.price} THB)` : ''}</option>
                          ))}
                        </select>
                      </div>
                      {transferPickup.type !== 'none' && (
                        <div>
                          <label style={labelStyle}>Адрес отеля / точка</label>
                          <input value={transferPickup.pickup} onChange={(e) => setTransferPickup({...transferPickup, pickup: e.target.value})} 
                            placeholder="Название отеля или адрес" style={inputStyle} />
                        </div>
                      )}
                    </div>

                    {/* Dropoff */}
                    <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                      <h4 style={{ margin: '0 0 16px', fontWeight: '600', color: '#92400e' }}>🚤 → 🏨 От марины</h4>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>Тип трансфера</label>
                        <select value={transferDropoff.type} onChange={(e) => {
                          const opt = TRANSFER_OPTIONS.find(t => t.type === e.target.value);
                          setTransferDropoff({...transferDropoff, type: e.target.value as any, price: opt?.price || 0});
                        }} style={inputStyle}>
                          {TRANSFER_OPTIONS.map(t => (
                            <option key={t.type} value={t.type}>{t.nameRu} {t.price > 0 ? `(${t.price} THB)` : ''}</option>
                          ))}
                        </select>
                      </div>
                      {transferDropoff.type !== 'none' && (
                        <div>
                          <label style={labelStyle}>Адрес доставки</label>
                          <input value={transferDropoff.dropoff} onChange={(e) => setTransferDropoff({...transferDropoff, dropoff: e.target.value})} 
                            placeholder="Отель или аэропорт" style={inputStyle} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transfer Summary */}
                  {(transferPickup.type !== 'none' || transferDropoff.type !== 'none') && (
                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600' }}>Итого трансфер:</h4>
                      {transferPickup.type !== 'none' && <p style={{ margin: '4px 0', fontSize: '14px' }}>К марине: {transferPickup.price.toLocaleString()} THB</p>}
                      {transferDropoff.type !== 'none' && <p style={{ margin: '4px 0', fontSize: '14px' }}>От марины: {transferDropoff.price.toLocaleString()} THB</p>}
                      <p style={{ margin: '8px 0 0', fontWeight: 'bold' }}>Всего: {(transferPickup.price + transferDropoff.price).toLocaleString()} THB</p>
                    </div>
                  )}
                </div>
              )}

              {/* FEES TAB */}
              {activeTab === 'fees' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🎫 Сборы и налоги</h3>
                  <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#dc2626' }}>⚠️ Сборы национальных парков НЕ включены в стоимость чартера</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {FEES.map(fee => {
                      const selected = selectedFees.find(f => f.id === fee.id);
                      return (
                        <div key={fee.id} style={{ padding: '16px', border: selected ? '2px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: selected ? '#fffbeb' : '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontWeight: '600' }}>{fee.name}</h4>
                          </div>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>{fee.nameRu}</p>
                          <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
                            Взрослый: <strong>{fee.priceAdult} THB</strong> | Ребёнок: <strong>{fee.priceChild} THB</strong>
                          </p>
                          {selected && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                              <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Взрослых:</label>
                                <input type="number" min="0" value={selected.adults}
                                  onChange={(e) => setSelectedFees(selectedFees.map(f => f.id === fee.id ? {...f, adults: Number(e.target.value)} : f))}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', color: '#1f2937' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Детей:</label>
                                <input type="number" min="0" value={selected.children}
                                  onChange={(e) => setSelectedFees(selectedFees.map(f => f.id === fee.id ? {...f, children: Number(e.target.value)} : f))}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', color: '#1f2937' }} />
                              </div>
                            </div>
                          )}
                          <button onClick={() => toggleFee(fee.id)} 
                            style={{ padding: '8px 16px', backgroundColor: selected ? '#dc2626' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                            {selected ? '✕ Убрать' : '+ Добавить'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>📋 Итоговый расчёт</h3>

                  {/* Boat Markup Slider */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#92400e', fontSize: '15px' }}>⚙️ Наценка на яхту</span>
                      <span style={{ fontWeight: '700', color: '#d97706', fontSize: '24px' }}>{boatMarkup}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={boatMarkup} 
                      onChange={(e) => setBoatMarkup(Number(e.target.value))}
                      style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: '#f59e0b' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '10px' }}>
                      <span style={{ color: '#92400e' }}>База партнёра: <strong>{(selectedBoat?.calculated_total || selectedBoat?.base_price || 0).toLocaleString()} THB</strong></span>
                      <span style={{ color: '#059669' }}>Цена для клиента: <strong>{Math.round((selectedBoat?.calculated_total || selectedBoat?.base_price || 0) * (1 + boatMarkup / 100)).toLocaleString()} THB</strong></span>
                    </div>
                  </div>

                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left: Price Breakdown */}
                    <div>
                      <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 16px', fontWeight: '600' }}>💰 Детализация стоимости</h4>
                        
                        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Чартер ({selectedBoat.route_name})</span>
                            <span style={{ fontWeight: '500' }}>{selectedBoat.base_price.toLocaleString()} THB</span>
                          </div>
                          {selectedBoat.fuel_surcharge > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#f59e0b' }}>
                              <span>⛽ Топливный сбор</span>
                              <span>{selectedBoat.fuel_surcharge.toLocaleString()} THB</span>
                            </div>
                          )}
                          {children > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                              <span>👶 Скидка на детей ({children} чел × 50%)</span>
                              <span>-{totals.childrenDiscount?.toLocaleString()} THB</span>
                            </div>
                          )}
                        </div>

                        {totals.extras > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🎁 Доп. опции лодки</span>
                            <span>{totals.extras.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.catering > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🍽️ Кейтеринг</span>
                            <span>{totals.catering.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.drinks > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🍺 Напитки</span>
                            <span>{totals.drinks.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.toys > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🏄 Водные игрушки (яхта)</span>
                            <span>{totals.toys.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.partnerWatersports > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🏄 Водные игрушки (партнёры)</span>
                            <span>{totals.partnerWatersports.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.services > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🎉 Услуги</span>
                            <span>{totals.services.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.transfer > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🚗 Трансфер</span>
                            <span>{totals.transfer.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.partnerWatersports > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>🏄 Водные игрушки (партнёры)</span>
                            <span>{totals.partnerWatersports.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.fees > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🎫 Сборы парков</span>
                            <span>{totals.fees.toLocaleString()} THB</span>
                          </div>
                        )}
                        {totals.markup > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#7c3aed' }}>
                            <span>📈 Наценка ({markupPercent}%)</span>
                            <span>{totals.markup.toLocaleString()} THB</span>
                          </div>
                        )}

                        <div style={{ borderTop: '2px solid #2563eb', paddingTop: '12px', marginTop: '12px' }}>
                          {showAgentPrice && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6b7280' }}>
                              <span>Агентская цена</span>
                              <span style={{ fontWeight: '600' }}>{totals.totalAgent?.toLocaleString()} THB</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px' }}>
                            <span style={{ fontWeight: '600' }}>ИТОГО для клиента</span>
                            <span style={{ fontWeight: 'bold', color: '#059669' }}>{totals.totalClient?.toLocaleString()} THB</span>
                          </div>
                          {showAgentPrice && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#7c3aed' }}>
                              <span>💰 Прибыль</span>
                              <span style={{ fontWeight: 'bold' }}>{((totals.totalClient || 0) - (totals.totalAgent || 0)).toLocaleString()} THB</span>
                            </div>
                          )}
                          <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#6b7280' }}>
                            ≈ ${Math.round((totals.totalClient || 0) / 35).toLocaleString()} USD
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Customer Info & Notes */}
                    <div>
                      <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac', marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 16px', fontWeight: '600', color: '#166534' }}>👤 Данные клиента</h4>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={labelStyle}>Имя</label>
                          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Имя клиента" style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={labelStyle}>Телефон</label>
                          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+66..." style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Email</label>
                          <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
                        </div>
                      </div>

                      {/* Quick Summary */}
                      <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                        <h4 style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400e' }}>📝 Краткое описание</h4>
                        <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
                          <strong>{selectedBoat.boat_name}</strong> ({selectedBoat.boat_type}, {selectedBoat.length_ft}ft)<br />
                          📅 {searchDate} | ⏱️ {timeSlots.find(t => t.value === timeSlot)?.label}<br />
                          👥 {adults} взр. {children > 0 ? `+ ${children} дет.` : ''} {infants > 0 ? `+ ${infants} мл.` : ''}<br />
                          🗺️ {selectedBoat.route_name}<br />
                          {specialOccasion && <>🎂 {specialOccasion}<br /></>}
                          {dietaryRequirements && <>🥗 {dietaryRequirements}<br /></>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                    <button 
                      onClick={async () => {
                        const pdfData = {
                          boatName: selectedBoat.boat_name,
                          boatType: selectedBoat.boat_type,
                          partnerName: selectedBoat.partner_name,
                          routeName: selectedBoat.route_name,
                          date: searchDate,
                          duration: timeSlots.find(t => t.value === timeSlot)?.label,
                          adults, children, infants,
                          occasion: specialOccasion,
                          basePrice: selectedBoat.base_price,
                          fuelSurcharge: selectedBoat.fuel_surcharge,
                          childrenDiscount: totals.childrenDiscount,
                          extras: totals.extras,
                          catering: totals.catering,
                          drinks: totals.drinks,
                          toys: totals.toys,
                          services: totals.services,
                          transfer: totals.transfer,
                          fees: totals.fees,
                          totalClient: totals.totalClient,
                          customerName, customerPhone, customerEmail,
                          includedOptions: boatOptions.filter(o => o.status === 'included').map(o => o.option_name)
                        };
                        const res = await fetch('/api/generate-pdf', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(pdfData)
                        });
                        const html = await res.text();
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(html);
                          printWindow.document.close();
                          setTimeout(() => printWindow.print(), 500);
                        }
                      }}
                      style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                      📄 Скачать PDF
                    </button>
                    <button style={{ flex: 1, padding: '16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
                      📧 Отправить клиенту
                    </button>
                    <button style={{ flex: 1, padding: '16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
                      ✅ Создать бронь
                    </button>
                  </div>

                  {/* Not Included Warning */}
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>⚠️ НЕ включено в стоимость:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#991b1b' }}>
                      <li>Сборы национальных парков (если не выбраны выше)</li>
                      <li>Чаевые экипажу (рекомендуется 10-15%)</li>
                      <li>НДС 7% (при выставлении счёта компании)</li>
                      <li>Дополнительное время сверх оплаченного</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1] as any);
                }}
                disabled={activeTab === 'included'}
                style={{ padding: '12px 24px', backgroundColor: activeTab === 'included' ? '#e5e7eb' : '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: activeTab === 'included' ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>
                ← Назад
              </button>
              <button 
                onClick={() => {
                  const tabs = ['included', 'food', 'drinks', 'toys', 'services', 'transfer', 'fees', 'summary'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1] as any);
                }}
                disabled={activeTab === 'summary'}
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
