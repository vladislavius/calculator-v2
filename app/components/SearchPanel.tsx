'use client';

import { SearchResult } from '../lib/types';

interface SearchPanelProps {
  searchDate: string;
  setSearchDate: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  showDestinationSuggestions: boolean;
  setShowDestinationSuggestions: (v: boolean) => void;
  allRoutes: any[];
  allBoats: any[];
  boatPartners: any[];
  selectedPartnerFilter: string;
  setSelectedPartnerFilter: (v: string) => void;
  boatNameSearch: string;
  setBoatNameSearch: (v: string) => void;
  showBoatSuggestions: boolean;
  setShowBoatSuggestions: (v: boolean) => void;
  timeSlot: string;
  setTimeSlot: (v: string) => void;
  boatType: string;
  setBoatType: (v: string) => void;
  season: string;
  setSeason: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  adults: number;
  setAdults: (v: number) => void;
  showAgentPrice: boolean;
  markupPercent: number;
  handleSearch: () => void;
  loading: boolean;
}

export default function SearchPanel({
  searchDate, setSearchDate, destination, setDestination,
  showDestinationSuggestions, setShowDestinationSuggestions, allRoutes, allBoats, boatPartners, selectedPartnerFilter, setSelectedPartnerFilter,
  boatNameSearch, setBoatNameSearch, showBoatSuggestions, setShowBoatSuggestions,
  timeSlot, setTimeSlot, boatType, setBoatType, season, setSeason,
  sortBy, setSortBy, adults, setAdults, showAgentPrice, markupPercent,
  handleSearch, loading
}: SearchPanelProps) {
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

  const timeSlots = [
    { value: 'full_day', label: 'Полный день (8ч)', hours: 8 },
    { value: 'half_day', label: 'Полдня (4ч)', hours: 4 },
    { value: 'morning', label: 'Утро (4ч)', hours: 4 },
    { value: 'afternoon', label: 'После обеда (4ч)', hours: 4 },
    { value: 'sunset', label: 'Закат (3ч)', hours: 3 },
    { value: 'overnight', label: 'С ночёвкой', hours: 24 },
  ];

  const boatTypes = [
    { value: '', label: 'Любой тип' },
    { value: 'catamaran', label: 'Катамаран' },
    { value: 'sailing_catamaran', label: 'Парусный катамаран' },
    { value: 'speedboat', label: 'Спидбот' },
    { value: 'yacht', label: 'Яхта' },
  ];

  return (
    <>
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

    </>
  );
}
