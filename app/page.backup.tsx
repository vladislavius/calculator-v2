// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// ============ TYPES ============
interface SearchResult {
  boat_id: string;
  boat_name: string;
  boat_type: string;
  length_ft: number;
  max_guests: number;
  cabin_count: number;
  crew_count: number;
  description: string;
  main_photo_url: string;
  partner_name: string;
  partner_id: string;
  route_name: string;
  destination: string;
  duration_hours: number;
  base_price: number;
  extra_pax_price: number;
  fuel_surcharge: number;
  calculated_total: number;
  base_pax: number;
  marina_name: string;
}

interface BoatOption {
  id: string;
  option_name: string;
  option_category: string;
  status: 'included' | 'paid_optional';
  price_thb: number | null;
  price_unit: string | null;
  notes: string | null;
}

interface SelectedExtra {
  optionId: string;
  quantity: number;
  price: number;
  name: string;
  unit: string;
}

interface CateringPackage {
  id: string;
  name: string;
  description: string;
  price_per_person: number;
  min_persons: number;
  items: string[];
}

interface DrinkPackage {
  id: string;
  name: string;
  type: 'alcoholic' | 'non_alcoholic' | 'premium';
  price: number;
  unit: string;
  description: string;
}

// ============ MOCK DATA FOR DEMO ============
// Сторонние кейтеринги (работают с любой лодкой)
const CATERING_PACKAGES: CateringPackage[] = [
  {
    id: 'cat_thai_basic',
    name: 'Thai Classic',
    description: 'Традиционные тайские блюда',
    price_per_person: 800,
    min_persons: 4,
    items: ['Том Ям', 'Пад Тай', 'Зелёный карри', 'Рис', 'Фрукты']
  },
  {
    id: 'cat_seafood_bbq',
    name: 'Seafood BBQ Premium',
    description: 'Морепродукты гриль свежайшего улова',
    price_per_person: 1500,
    min_persons: 6,
    items: ['Лобстер', 'Тигровые креветки', 'Рыба на гриле', 'Кальмары', 'Крабы', 'Салаты', 'Десерт']
  },
  {
    id: 'cat_western',
    name: 'Western Style',
    description: 'Европейская кухня',
    price_per_person: 1200,
    min_persons: 4,
    items: ['Стейк', 'Паста', 'Салат Цезарь', 'Закуски', 'Десерт']
  },
  {
    id: 'cat_vegan',
    name: 'Vegan Healthy',
    description: 'Веганское меню',
    price_per_person: 900,
    min_persons: 2,
    items: ['Салаты', 'Овощи гриль', 'Хумус', 'Фалафель', 'Фрукты', 'Смузи']
  }
];

const DRINK_PACKAGES: DrinkPackage[] = [
  { id: 'drink_local_beer', name: 'Local Beer (Chang/Leo/Singha)', type: 'alcoholic', price: 80, unit: 'per can', description: 'Тайское пиво' },
  { id: 'drink_import_beer', name: 'Import Beer (Heineken/Asahi)', type: 'alcoholic', price: 120, unit: 'per can', description: 'Импортное пиво' },
  { id: 'drink_beer_pack', name: 'Beer Pack (24 cans)', type: 'alcoholic', price: 1500, unit: 'per pack', description: 'Упаковка местного пива' },
  { id: 'drink_wine', name: 'Wine (Red/White)', type: 'alcoholic', price: 950, unit: 'per bottle', description: 'Вино' },
  { id: 'drink_champagne', name: 'Champagne', type: 'premium', price: 3500, unit: 'per bottle', description: 'Шампанское' },
  { id: 'drink_whiskey', name: 'Whiskey (Johnnie Walker)', type: 'premium', price: 2500, unit: 'per bottle', description: 'Виски' },
  { id: 'drink_vodka', name: 'Grey Goose Vodka', type: 'premium', price: 3000, unit: 'per bottle', description: 'Премиум водка' },
  { id: 'drink_evian', name: 'Evian Water', type: 'non_alcoholic', price: 60, unit: 'per bottle', description: 'Премиум вода' },
  { id: 'drink_redbull', name: 'Red Bull', type: 'non_alcoholic', price: 50, unit: 'per can', description: 'Энергетик' },
];

// ============ COMPONENT ============
export default function HomePage() {
  // Search filters
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(10);
  const [children, setChildren] = useState(0);
  const [boatType, setBoatType] = useState('');
  const [destination, setDestination] = useState('');
  const [marina, setMarina] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [timeSlot, setTimeSlot] = useState('full_day');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'size' | 'guests'>('price_asc');
  
  // Results and UI state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal state
  const [selectedBoat, setSelectedBoat] = useState<SearchResult | null>(null);
  const [boatOptions, setBoatOptions] = useState<BoatOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Selected extras state
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  
  // Catering state
  const [showCatering, setShowCatering] = useState(false);
  const [selectedCatering, setSelectedCatering] = useState<CateringPackage | null>(null);
  const [cateringPersons, setCateringPersons] = useState(0);
  
  // Drinks state
  const [showDrinks, setShowDrinks] = useState(false);
  const [selectedDrinks, setSelectedDrinks] = useState<{id: string, quantity: number}[]>([]);
  
  // Transfer state
  const [transferType, setTransferType] = useState<'none' | 'standard' | 'premium' | 'vip'>('none');
  
  // Additional notes
  const [notes, setNotes] = useState('');

  // Filter options
  const destinations = [
    'Phi Phi Islands', 'Phang Nga Bay', 'James Bond Island', 'Racha Islands', 
    'Similan Islands', 'Coral Island', 'Maiton Island', 'Khai Islands',
    'Hong Krabi', 'Rang Yai Island', 'Yao Yai Island'
  ];
  const boatTypes = ['Speedboat', 'Power Catamaran', 'Sailing Catamaran', 'Yacht', 'Motor Yacht'];
  const marinas = [
    'Chalong Pier', 'Royal Phuket Marina', 'Ao Po Grand Marina', 
    'Boat Lagoon Marina', 'Yacht Haven Marina'
  ];

  const TRANSFER_PRICES = {
    none: 0,
    standard: 0, // included in many charters
    premium: 2500, // Mercedes V-class
    vip: 5000, // Alphard/Lexus LX
  };

  // Calculate extras total
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  
  // Calculate catering total
  const cateringTotal = selectedCatering ? selectedCatering.price_per_person * Math.max(cateringPersons, selectedCatering.min_persons) : 0;
  
  // Calculate drinks total
  const drinksTotal = selectedDrinks.reduce((sum, d) => {
    const drink = DRINK_PACKAGES.find(dp => dp.id === d.id);
    return sum + (drink ? drink.price * d.quantity : 0);
  }, 0);
  
  // Calculate transfer total
  const transferTotal = TRANSFER_PRICES[transferType];
  
  // Calculate children discount (50% for ages 4-11)
  const childrenDiscount = selectedBoat && children > 0 
    ? Math.round(children * (selectedBoat.extra_pax_price || 2000) * 0.5)
    : 0;
  
  // Grand total
  const grandTotal = selectedBoat 
    ? selectedBoat.calculated_total + extrasTotal + cateringTotal + drinksTotal + transferTotal - childrenDiscount
    : 0;

  // Search function
  const searchBoats = async () => {
    if (!date) {
      setError('Пожалуйста, выберите дату');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error: searchError } = await supabase.rpc('search_available_boats', {
        p_date: date,
        p_guests: guests + children,
        p_time_slot: timeSlot,
        p_boat_type: boatType || null,
        p_destination: destination || null,
        p_max_budget: maxBudget ? parseFloat(maxBudget) : null
      });

      if (searchError) throw searchError;
      
      let filteredData = data || [];
      
      // Apply min budget filter
      if (minBudget) {
        filteredData = filteredData.filter((b: SearchResult) => b.calculated_total >= parseFloat(minBudget));
      }
      
      // Sort results
      filteredData.sort((a: SearchResult, b: SearchResult) => {
        switch (sortBy) {
          case 'price_asc': return a.calculated_total - b.calculated_total;
          case 'price_desc': return b.calculated_total - a.calculated_total;
          case 'size': return b.length_ft - a.length_ft;
          case 'guests': return b.max_guests - a.max_guests;
          default: return 0;
        }
      });
      
      setResults(filteredData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openBoatDetails = async (boat: SearchResult) => {
    setSelectedBoat(boat);
    setSelectedExtras([]);
    setSelectedCatering(null);
    setCateringPersons(guests + children);
    setSelectedDrinks([]);
    setTransferType('none');
    setShowCatering(false);
    setShowDrinks(false);
    setNotes('');
    setLoadingOptions(true);
    
    try {
      const { data, error } = await supabase
        .from('boat_options')
        .select('*')
        .eq('boat_id', boat.boat_id)
        .order('option_category', { ascending: true });
      
      if (error) throw error;
      setBoatOptions(data || []);
    } catch (err: any) {
      console.error('Error loading options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeModal = () => {
    setSelectedBoat(null);
    setBoatOptions([]);
  };

  // Toggle extra selection
  const toggleExtra = (option: BoatOption) => {
    const existing = selectedExtras.find(e => e.optionId === option.id);
    
    if (existing) {
      setSelectedExtras(selectedExtras.filter(e => e.optionId !== option.id));
    } else {
      setSelectedExtras([...selectedExtras, {
        optionId: option.id,
        quantity: 1,
        price: option.price_thb || 0,
        name: option.option_name,
        unit: option.price_unit || 'per day'
      }]);
    }
  };

  // Update quantity for an extra
  const updateExtraQuantity = (optionId: string, delta: number) => {
    setSelectedExtras(selectedExtras.map(e => {
      if (e.optionId === optionId) {
        const newQty = Math.max(1, e.quantity + delta);
        return { ...e, quantity: newQty };
      }
      return e;
    }));
  };

  // Toggle drink selection
  const toggleDrink = (drinkId: string) => {
    const existing = selectedDrinks.find(d => d.id === drinkId);
    if (existing) {
      setSelectedDrinks(selectedDrinks.filter(d => d.id !== drinkId));
    } else {
      setSelectedDrinks([...selectedDrinks, { id: drinkId, quantity: 1 }]);
    }
  };

  const updateDrinkQuantity = (drinkId: string, delta: number) => {
    setSelectedDrinks(selectedDrinks.map(d => {
      if (d.id === drinkId) {
        return { ...d, quantity: Math.max(1, d.quantity + delta) };
      }
      return d;
    }));
  };

  // Separate included and paid options
  const includedOptions = boatOptions.filter(o => o.status === 'included');
  const paidOptions = boatOptions.filter(o => o.status === 'paid_optional');

  // Check if boat has food included
  const hasFoodIncluded = includedOptions.some(o => 
    o.option_category === 'food' || 
    o.option_name.toLowerCase().includes('lunch') ||
    o.option_name.toLowerCase().includes('dinner') ||
    o.option_name.toLowerCase().includes('meal')
  );

  // Determine season based on date
  const getSeason = (dateStr: string) => {
    if (!dateStr) return 'unknown';
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    if ((month === 12 && day >= 15) || (month === 1 && day <= 15)) return 'peak';
    if (month >= 5 && month <= 10) return 'low';
    return 'high';
  };

  const season = getSeason(date);
  const seasonLabels: Record<string, {label: string, color: string}> = {
    peak: { label: '🔥 Peak Season (15 Dec - 15 Jan)', color: 'bg-red-100 text-red-700' },
    high: { label: '☀️ High Season (Nov - Apr)', color: 'bg-orange-100 text-orange-700' },
    low: { label: '🌧️ Low Season (May - Oct)', color: 'bg-green-100 text-green-700' },
    unknown: { label: 'Select date', color: 'bg-gray-100 text-gray-600' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🚤 Phuket Charter Pro
              </h1>
              <p className="text-blue-100 mt-1">170 лодок • 60 партнёров • 2000+ маршрутов</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Менеджер системы</p>
              <p className="font-semibold">Профессиональный подбор</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">🔍 Поиск лодки</h2>
            {date && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${seasonLabels[season].color}`}>
                {seasonLabels[season].label}
              </span>
            )}
          </div>
          
          {/* Main filters - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата чартера *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Adults */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Взрослые</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="px-3 py-2 hover:bg-gray-100 rounded-l-lg"
                >-</button>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="w-full text-center py-2 border-0 focus:ring-0"
                />
                <button 
                  onClick={() => setGuests(guests + 1)}
                  className="px-3 py-2 hover:bg-gray-100 rounded-r-lg"
                >+</button>
              </div>
            </div>

            {/* Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дети (4-11 лет)</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="px-3 py-2 hover:bg-gray-100 rounded-l-lg"
                >-</button>
                <input
                  type="number"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  className="w-full text-center py-2 border-0 focus:ring-0"
                />
                <button 
                  onClick={() => setChildren(children + 1)}
                  className="px-3 py-2 hover:bg-gray-100 rounded-r-lg"
                >+</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">50% скидка</p>
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Длительность</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="full_day">Full Day (8ч)</option>
                <option value="morning">Morning (4ч)</option>
                <option value="afternoon">Afternoon (4ч)</option>
                <option value="sunset">Sunset (3ч)</option>
                <option value="overnight">Overnight (24ч+)</option>
              </select>
            </div>

            {/* Boat Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип лодки</label>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Любой</option>
                {boatTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Направление</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Любое</option>
                {destinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters - Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {/* Marina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пирс отправления</label>
              <select
                value={marina}
                onChange={(e) => setMarina(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Любой</option>
                {marinas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Min Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет от (THB)</label>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет до (THB)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Без лимита"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сортировка</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="size">Размер ↓</option>
                <option value="guests">Вместимость ↓</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вид</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  ▦ Сетка
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  ☰ Список
                </button>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={searchBoats}
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Поиск...
                  </>
                ) : (
                  <>🔍 Найти</>
                )}
              </button>
            </div>
          </div>

          {/* Total guests summary */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
            <span>👥 Всего гостей: <strong>{guests + children}</strong></span>
            <span>•</span>
            <span>👨‍👩‍👧 Взрослых: {guests}</span>
            {children > 0 && (
              <>
                <span>•</span>
                <span>👶 Детей: {children}</span>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Найдено {results.length} вариант{results.length !== 1 ? 'ов' : ''}
              </h2>
              <p className="text-sm text-gray-500">
                {date} • {guests + children} чел. • {timeSlot === 'full_day' ? 'Full Day' : timeSlot}
              </p>
            </div>
            
            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((boat, idx) => (
                  <div 
                    key={`${boat.boat_id}-${boat.route_name}-${idx}`} 
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Boat Image */}
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                      {boat.main_photo_url ? (
                        <img 
                          src={boat.main_photo_url} 
                          alt={boat.boat_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                          🚤
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold text-blue-600">
                          {boat.boat_type}
                        </span>
                        <span className="bg-black/50 px-2 py-1 rounded-full text-xs font-semibold text-white">
                          {boat.length_ft}ft
                        </span>
                      </div>
                      {boat.fuel_surcharge > 0 && (
                        <div className="absolute top-3 right-3 bg-orange-500 px-2 py-1 rounded-full text-xs text-white">
                          +Fuel ⛽
                        </div>
                      )}
                    </div>

                    {/* Boat Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{boat.boat_name}</h3>
                          <p className="text-xs text-gray-500">{boat.partner_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">👥 Max {boat.max_guests}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">🛏️ {boat.cabin_count || 0}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">👨‍✈️ {boat.crew_count || 3}</span>
                      </div>

                      <div className="p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg mb-3">
                        <p className="text-sm font-medium text-blue-800">📍 {boat.route_name}</p>
                        <p className="text-xs text-blue-600">{boat.destination} • {boat.duration_hours}ч</p>
                      </div>

                      {/* Price */}
                      <div className="pt-3 border-t">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Базовая цена</p>
                            <p className="text-sm text-gray-600">{boat.base_price.toLocaleString()} THB</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Итого</p>
                            <p className="text-2xl font-bold text-green-600">{boat.calculated_total.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">THB</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => openBoatDetails(boat)}
                        className="mt-4 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Подробнее и Extras →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {results.map((boat, idx) => (
                  <div 
                    key={`${boat.boat_id}-${boat.route_name}-${idx}`}
                    className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow flex gap-4"
                  >
                    {/* Image */}
                    <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600">
                      {boat.main_photo_url ? (
                        <img src={boat.main_photo_url} alt={boat.boat_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl">🚤</div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{boat.boat_name}</h3>
                          <p className="text-sm text-gray-500">{boat.partner_name} • {boat.boat_type} • {boat.length_ft}ft</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{boat.calculated_total.toLocaleString()} THB</p>
                          <p className="text-xs text-gray-400">Base: {boat.base_price.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>📍 {boat.route_name}</span>
                        <span>•</span>
                        <span>👥 Max {boat.max_guests}</span>
                        <span>•</span>
                        <span>⏱️ {boat.duration_hours}ч</span>
                        {boat.fuel_surcharge > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500">⛽ +{boat.fuel_surcharge.toLocaleString()} fuel</span>
                          </>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => openBoatDetails(boat)}
                        className="mt-3 px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Подробнее →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !loading && date && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-xl text-gray-600 mb-2">Лодки не найдены</p>
            <p className="text-gray-400">Попробуйте изменить фильтры поиска</p>
          </div>
        )}

        {!date && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <p className="text-6xl mb-4">📅</p>
            <p className="text-xl text-gray-600 mb-2">Выберите дату чартера</p>
            <p className="text-gray-400">Укажите дату выше, чтобы увидеть доступные лодки</p>
          </div>
        )}
      </div>

      {/* ============ MODAL ============ */}
      {selectedBoat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold">{selectedBoat.boat_name}</h2>
                <p className="text-sm text-gray-500">{selectedBoat.partner_name} • {selectedBoat.boat_type}</p>
              </div>
              <button 
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Route & Date Info */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800 text-lg">📍 {selectedBoat.route_name}</h3>
                    <p className="text-blue-600">{selectedBoat.destination} • {selectedBoat.duration_hours} часов</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Дата</p>
                    <p className="font-semibold">{date}</p>
                  </div>
                </div>
              </div>

              {/* Boat Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl">📏</p>
                  <p className="font-bold text-lg">{selectedBoat.length_ft} ft</p>
                  <p className="text-xs text-gray-500">Длина</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl">👥</p>
                  <p className="font-bold text-lg">{selectedBoat.max_guests}</p>
                  <p className="text-xs text-gray-500">Max гостей</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl">🛏️</p>
                  <p className="font-bold text-lg">{selectedBoat.cabin_count || 0}</p>
                  <p className="text-xs text-gray-500">Кают</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl">👨‍✈️</p>
                  <p className="font-bold text-lg">{selectedBoat.crew_count || 3}</p>
                  <p className="text-xs text-gray-500">Экипаж</p>
                </div>
              </div>

              {/* What's Included */}
              {loadingOptions ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl">⏳</div>
                  <p className="mt-2 text-gray-500">Загрузка опций...</p>
                </div>
              ) : (
                <>
                  {/* Included */}
                  {includedOptions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <span className="text-xl">✅</span> Включено в стоимость
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {includedOptions.map(option => (
                          <div key={option.id} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg">
                            <span className="text-green-500">✓</span>
                            <span>{option.option_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ====== PAID EXTRAS ====== */}
                  {paidOptions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                        <span className="text-xl">🎯</span> Платные опции лодки
                      </h3>
                      <div className="space-y-2">
                        {paidOptions.map(option => {
                          const isSelected = selectedExtras.some(e => e.optionId === option.id);
                          const selectedExtra = selectedExtras.find(e => e.optionId === option.id);
                          
                          return (
                            <div 
                              key={option.id} 
                              className={`border-2 rounded-xl p-4 transition-all ${
                                isSelected 
                                  ? 'border-orange-400 bg-orange-50' 
                                  : 'border-gray-200 hover:border-orange-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer flex-grow">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleExtra(option)}
                                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-800">{option.option_name}</p>
                                    <p className="text-sm text-gray-500">
                                      {option.price_thb?.toLocaleString()} THB {option.price_unit && `/ ${option.price_unit}`}
                                    </p>
                                  </div>
                                </label>
                                
                                {isSelected && selectedExtra && (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-white rounded-lg border">
                                      <button
                                        onClick={() => updateExtraQuantity(option.id, -1)}
                                        className="w-8 h-8 hover:bg-gray-100 rounded-l-lg font-bold"
                                      >−</button>
                                      <span className="w-8 text-center font-semibold">{selectedExtra.quantity}</span>
                                      <button
                                        onClick={() => updateExtraQuantity(option.id, 1)}
                                        className="w-8 h-8 hover:bg-gray-100 rounded-r-lg font-bold"
                                      >+</button>
                                    </div>
                                    <span className="font-bold text-orange-600 min-w-[100px] text-right">
                                      {(selectedExtra.price * selectedExtra.quantity).toLocaleString()} THB
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ====== CATERING SECTION ====== */}
                  <div className="mb-6 border-2 border-dashed border-purple-200 rounded-xl p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowCatering(!showCatering)}
                    >
                      <h3 className="font-bold text-purple-700 flex items-center gap-2">
                        <span className="text-xl">🍽️</span> 
                        Кейтеринг {hasFoodIncluded ? '(питание уже включено)' : '(питание не включено!)'}
                      </h3>
                      <span className={`transform transition-transform ${showCatering ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    
                    {showCatering && (
                      <div className="mt-4 space-y-3">
                        {!hasFoodIncluded && (
                          <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                            ⚠️ На этой лодке питание НЕ включено. Рекомендуем выбрать кейтеринг!
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {CATERING_PACKAGES.map(pkg => (
                            <div 
                              key={pkg.id}
                              onClick={() => setSelectedCatering(selectedCatering?.id === pkg.id ? null : pkg)}
                              className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                                selectedCatering?.id === pkg.id 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{pkg.name}</h4>
                                <span className="text-purple-600 font-bold">{pkg.price_per_person} THB/чел</span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">{pkg.description}</p>
                              <p className="text-xs text-gray-400">Min: {pkg.min_persons} чел.</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {pkg.items.map((item, i) => (
                                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{item}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {selectedCatering && (
                          <div className="flex items-center gap-4 bg-purple-100 p-3 rounded-lg">
                            <span>Количество порций:</span>
                            <div className="flex items-center gap-1 bg-white rounded-lg border">
                              <button
                                onClick={() => setCateringPersons(Math.max(selectedCatering.min_persons, cateringPersons - 1))}
                                className="w-8 h-8 hover:bg-gray-100 rounded-l-lg font-bold"
                              >−</button>
                              <span className="w-12 text-center font-semibold">{cateringPersons}</span>
                              <button
                                onClick={() => setCateringPersons(cateringPersons + 1)}
                                className="w-8 h-8 hover:bg-gray-100 rounded-r-lg font-bold"
                              >+</button>
                            </div>
                            <span className="font-bold text-purple-700 ml-auto">
                              {cateringTotal.toLocaleString()} THB
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ====== DRINKS SECTION ====== */}
                  <div className="mb-6 border-2 border-dashed border-pink-200 rounded-xl p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowDrinks(!showDrinks)}
                    >
                      <h3 className="font-bold text-pink-700 flex items-center gap-2">
                        <span className="text-xl">🍺</span> Напитки
                      </h3>
                      <span className={`transform transition-transform ${showDrinks ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    
                    {showDrinks && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-3">Гости могут привезти свой алкоголь (без corkage fee) или заказать у нас:</p>
                        
                        {/* Alcoholic */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">🍺 Алкогольные</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {DRINK_PACKAGES.filter(d => d.type === 'alcoholic').map(drink => {
                              const selected = selectedDrinks.find(d => d.id === drink.id);
                              return (
                                <div 
                                  key={drink.id}
                                  className={`border rounded-lg p-2 cursor-pointer transition-all ${
                                    selected ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                                  }`}
                                  onClick={() => toggleDrink(drink.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">{drink.name}</span>
                                    {selected && (
                                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => updateDrinkQuantity(drink.id, -1)} className="w-5 h-5 bg-white rounded text-xs">-</button>
                                        <span className="text-xs w-4 text-center">{selected.quantity}</span>
                                        <button onClick={() => updateDrinkQuantity(drink.id, 1)} className="w-5 h-5 bg-white rounded text-xs">+</button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-pink-600">{drink.price} THB {drink.unit}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Premium */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">🥂 Премиум</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {DRINK_PACKAGES.filter(d => d.type === 'premium').map(drink => {
                              const selected = selectedDrinks.find(d => d.id === drink.id);
                              return (
                                <div 
                                  key={drink.id}
                                  className={`border rounded-lg p-2 cursor-pointer transition-all ${
                                    selected ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                                  }`}
                                  onClick={() => toggleDrink(drink.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">{drink.name}</span>
                                    {selected && (
                                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => updateDrinkQuantity(drink.id, -1)} className="w-5 h-5 bg-white rounded text-xs">-</button>
                                        <span className="text-xs w-4 text-center">{selected.quantity}</span>
                                        <button onClick={() => updateDrinkQuantity(drink.id, 1)} className="w-5 h-5 bg-white rounded text-xs">+</button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-pink-600">{drink.price} THB {drink.unit}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Non-alcoholic */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">💧 Безалкогольные</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {DRINK_PACKAGES.filter(d => d.type === 'non_alcoholic').map(drink => {
                              const selected = selectedDrinks.find(d => d.id === drink.id);
                              return (
                                <div 
                                  key={drink.id}
                                  className={`border rounded-lg p-2 cursor-pointer transition-all ${
                                    selected ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                                  }`}
                                  onClick={() => toggleDrink(drink.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">{drink.name}</span>
                                    {selected && (
                                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => updateDrinkQuantity(drink.id, -1)} className="w-5 h-5 bg-white rounded text-xs">-</button>
                                        <span className="text-xs w-4 text-center">{selected.quantity}</span>
                                        <button onClick={() => updateDrinkQuantity(drink.id, 1)} className="w-5 h-5 bg-white rounded text-xs">+</button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-pink-600">{drink.price} THB {drink.unit}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {drinksTotal > 0 && (
                          <div className="mt-3 p-2 bg-pink-100 rounded-lg text-right">
                            <span className="font-bold text-pink-700">Напитки: {drinksTotal.toLocaleString()} THB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ====== TRANSFER SECTION ====== */}
                  <div className="mb-6 border-2 border-dashed border-cyan-200 rounded-xl p-4">
                    <h3 className="font-bold text-cyan-700 mb-3 flex items-center gap-2">
                      <span className="text-xl">🚗</span> Трансфер
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'none', label: 'Без трансфера', price: 0, desc: 'Самостоятельно' },
                        { value: 'standard', label: 'Стандарт', price: 0, desc: 'Включён' },
                        { value: 'premium', label: 'Mercedes V', price: 2500, desc: 'V-Class' },
                        { value: 'vip', label: 'VIP', price: 5000, desc: 'Alphard/Lexus' },
                      ].map(t => (
                        <div
                          key={t.value}
                          onClick={() => setTransferType(t.value as any)}
                          className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${
                            transferType === t.value 
                              ? 'border-cyan-500 bg-cyan-50' 
                              : 'border-gray-200 hover:border-cyan-200'
                          }`}
                        >
                          <p className="font-semibold">{t.label}</p>
                          <p className="text-xs text-gray-500">{t.desc}</p>
                          <p className={`text-sm font-bold ${t.price > 0 ? 'text-cyan-600' : 'text-green-600'}`}>
                            {t.price > 0 ? `+${t.price.toLocaleString()} THB` : 'Бесплатно'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ====== ADDITIONAL NOTES ====== */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-xl">📝</span> Дополнительные пожелания
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Особые пожелания, аллергии, празднование дня рождения и т.д."
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* ====== PRICE SUMMARY ====== */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 mb-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="text-xl">💰</span> Итоговый расчёт
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      {/* Base charter */}
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium">Чартер: {selectedBoat.boat_name}</span>
                        <span>{selectedBoat.base_price.toLocaleString()} THB</span>
                      </div>
                      
                      {/* Fuel surcharge */}
                      {selectedBoat.fuel_surcharge > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>⛽ Fuel surcharge ({selectedBoat.route_name}):</span>
                          <span>+{selectedBoat.fuel_surcharge.toLocaleString()} THB</span>
                        </div>
                      )}
                      
                      {/* Extra guests */}
                      {guests + children > (selectedBoat.base_pax || 10) && selectedBoat.extra_pax_price > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>👥 Extra guests ({guests + children - (selectedBoat.base_pax || 10)} × {selectedBoat.extra_pax_price.toLocaleString()}):</span>
                          <span>+{((guests + children - (selectedBoat.base_pax || 10)) * selectedBoat.extra_pax_price).toLocaleString()} THB</span>
                        </div>
                      )}
                      
                      {/* Children discount */}
                      {childrenDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>👶 Скидка на детей (50%):</span>
                          <span>-{childrenDiscount.toLocaleString()} THB</span>
                        </div>
                      )}

                      {/* Charter subtotal */}
                      <div className="flex justify-between py-2 border-b border-gray-300 font-medium">
                        <span>Чартер итого:</span>
                        <span>{selectedBoat.calculated_total.toLocaleString()} THB</span>
                      </div>

                      {/* Extras */}
                      {selectedExtras.length > 0 && (
                        <div className="pt-2">
                          <p className="text-gray-500 text-xs mb-1">Платные опции:</p>
                          {selectedExtras.map(extra => (
                            <div key={extra.optionId} className="flex justify-between text-orange-600">
                              <span>🎯 {extra.name} × {extra.quantity}:</span>
                              <span>+{(extra.price * extra.quantity).toLocaleString()} THB</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Catering */}
                      {selectedCatering && (
                        <div className="flex justify-between text-purple-600">
                          <span>🍽️ {selectedCatering.name} ({cateringPersons} чел.):</span>
                          <span>+{cateringTotal.toLocaleString()} THB</span>
                        </div>
                      )}
                      
                      {/* Drinks */}
                      {drinksTotal > 0 && (
                        <div className="flex justify-between text-pink-600">
                          <span>🍺 Напитки:</span>
                          <span>+{drinksTotal.toLocaleString()} THB</span>
                        </div>
                      )}
                      
                      {/* Transfer */}
                      {transferTotal > 0 && (
                        <div className="flex justify-between text-cyan-600">
                          <span>🚗 Трансфер ({transferType}):</span>
                          <span>+{transferTotal.toLocaleString()} THB</span>
                        </div>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="border-t-2 border-green-400 mt-4 pt-4">
                      <div className="flex justify-between text-2xl font-bold text-green-600">
                        <span>ИТОГО:</span>
                        <span>{grandTotal.toLocaleString()} THB</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        ≈ ${Math.round(grandTotal / 35).toLocaleString()} USD
                      </p>
                    </div>

                    {/* Not included notice */}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                      <p className="font-medium text-yellow-800 mb-1">⚠️ Не включено в стоимость:</p>
                      <p className="text-yellow-700 text-xs">
                        • National Park fees (Phi Phi 400 THB, Phang Nga 300 THB/чел)
                        • Crew gratuities (по желанию)
                        • VAT 7% (при необходимости invoice)
                      </p>
                    </div>
                  </div>

                  {/* ====== ACTION BUTTONS ====== */}
                  <div className="flex gap-4">
                    <button 
                      onClick={closeModal}
                      className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      ← Назад к поиску
                    </button>
                    <button className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl">
                      📝 Создать бронь — {grandTotal.toLocaleString()} THB
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
