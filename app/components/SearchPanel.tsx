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
  showDestinationSuggestions, setShowDestinationSuggestions, allRoutes, allBoats,
  boatPartners, selectedPartnerFilter, setSelectedPartnerFilter,
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
    { value: 'chinese_new_year', label: '🧧 Кит. НГ' },
    { value: 'chinese_national_day', label: '🇨🇳 Нац. день Китая' },
    { value: 'international_labour_day', label: '👷 День труда' },
  ];

  const timeSlots = [
    { value: 'full_day', label: 'Полный день (8ч)' },
    { value: 'half_day', label: 'Полдня (4ч)' },
    { value: 'morning', label: 'Утро (4ч)' },
    { value: 'afternoon', label: 'После обеда (4ч)' },
    { value: 'sunset', label: 'Закат (3ч)' },
    { value: 'overnight', label: 'С ночёвкой' },
  ];

  const boatTypes = [
    { value: '', label: 'Любой тип' },
    { value: 'catamaran', label: '⛵ Катамаран' },
    { value: 'sailing_catamaran', label: '⛵ Парусный' },
    { value: 'speedboat', label: '🚤 Спидбот' },
    { value: 'yacht', label: '🛥 Яхта' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid var(--os-border)',
    borderRadius: 'var(--r-md)',
    fontSize: '14px',
    backgroundColor: 'var(--os-surface)',
    color: 'var(--os-text-1)',
    outline: 'none',
    transition: 'border-color var(--t-fast)',
    fontFamily: 'var(--font-body)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--os-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'var(--os-card)',
    border: '1.5px solid var(--os-border-hover)',
    borderRadius: 'var(--r-md)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 200,
    boxShadow: 'var(--shadow-float)',
  };

  const filterRoutes = (routes: any[]) => routes.filter(r => {
    const s = destination.toLowerCase().replace(/\s+/g, '');
    const en = (r.name_en || '').toLowerCase();
    const ru = (r.name_ru || '').toLowerCase();
    return en.includes(destination.toLowerCase()) || ru.includes(destination.toLowerCase()) ||
      en.replace(/\s+/g, '').includes(s) ||
      destination.toLowerCase().split(' ').every((w: string) => en.includes(w) || ru.includes(w));
  });

  const filterBoats = (boats: any[]) => boats.filter(b => {
    const s = boatNameSearch.toLowerCase().replace(/\s+/g, '');
    const n = b.name.toLowerCase();
    return n.includes(boatNameSearch.toLowerCase()) || n.replace(/\s+/g, '').includes(s);
  });

  return (
    <div className="os-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>

      {/* ROW 1: дата / направление / лодка / партнёр */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>

        {/* Дата */}
        <div style={{ flex: '0 0 150px' }}>
          <label style={labelStyle}>📅 Дата чартера</label>
          <input
            type="date"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* Направление */}
        <div style={{ flex: '2 1 200px', position: 'relative' }}>
          <label style={labelStyle}>🗺️ Направление</label>
          <input
            placeholder="Phi Phi, Phang Nga, James Bond..."
            value={destination}
            onChange={e => { setDestination(e.target.value); setShowDestinationSuggestions(true); }}
            onFocus={() => setShowDestinationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
            style={inputStyle}
          />
          {showDestinationSuggestions && destination && filterRoutes(allRoutes).length > 0 && (
            <div style={dropdownStyle}>
              {filterRoutes(allRoutes).slice(0, 8).map(r => (
                <div
                  key={r.id}
                  onClick={() => { setDestination(r.name_en || r.name_ru); setShowDestinationSuggestions(false); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', fontSize: '13px', color: 'var(--os-text-1)' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--os-card-hover)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '')}
                >
                  <span style={{ fontWeight: 500 }}>{r.name_en}</span>
                  {r.name_ru && <span style={{ color: 'var(--os-text-2)', marginLeft: 8, fontSize: 12 }}>{r.name_ru}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Название лодки */}
        <div style={{ flex: '1.5 1 160px', position: 'relative' }}>
          <label style={labelStyle}>🚢 Название лодки</label>
          <input
            placeholder="Real, Princess, Chowa..."
            value={boatNameSearch}
            onChange={e => { setBoatNameSearch(e.target.value); setShowBoatSuggestions(true); }}
            onFocus={() => setShowBoatSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBoatSuggestions(false), 200)}
            style={inputStyle}
          />
          {showBoatSuggestions && boatNameSearch && filterBoats(allBoats).length > 0 && (
            <div style={dropdownStyle}>
              {filterBoats(allBoats).slice(0, 8).map(b => (
                <div
                  key={b.id}
                  onClick={() => { setBoatNameSearch(b.name); setShowBoatSuggestions(false); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', fontSize: '13px', color: 'var(--os-text-1)' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--os-card-hover)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '')}
                >
                  <span style={{ fontWeight: 500 }}>{b.name}</span>
                  <span style={{ color: 'var(--os-text-2)', marginLeft: 8, fontSize: 12 }}>
                    {boatPartners.find((p: any) => p.id === b.partner_id)?.name || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Партнёр */}
        <div style={{ flex: '1.5 1 160px' }}>
          <label style={labelStyle}>🏢 Партнёр</label>
          <select
            value={selectedPartnerFilter}
            onChange={e => setSelectedPartnerFilter(e.target.value)}
            style={inputStyle as any}
          >
            <option value="">Все партнёры</option>
            {boatPartners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* ROW 2: тип / длительность / сезон / гости / сортировка / кнопка */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>

        {/* Тип лодки */}
        <div style={{ flex: '1 1 130px' }}>
          <label style={labelStyle}>🚤 Тип</label>
          <select value={boatType} onChange={e => setBoatType(e.target.value)} style={inputStyle as any}>
            {boatTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Длительность */}
        <div style={{ flex: '1.5 1 170px' }}>
          <label style={labelStyle}>⏱️ Длительность</label>
          <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} style={inputStyle as any}>
            {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Сезон */}
        <div style={{ flex: '1 1 140px' }}>
          <label style={labelStyle}>📅 Сезон</label>
          <select value={season} onChange={e => setSeason(e.target.value)} style={inputStyle as any}>
            {seasons.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Гости */}
        <div style={{ flex: '0 0 90px' }}>
          <label style={labelStyle}>👥 Гостей</label>
          <input
            type="number"
            min="1"
            max="100"
            value={adults}
            onChange={e => setAdults(Math.max(1, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>

        {/* Сортировка */}
        <div style={{ flex: '1 1 120px' }}>
          <label style={labelStyle}>📊 Сортировка</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle as any}>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="size">Размер</option>
            <option value="capacity">Вместимость</option>
          </select>
        </div>

        {/* Кнопка */}
        <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="os-btn-search"
            style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading ? '⏳ Поиск...' : '🔍 Найти лодки'}
          </button>
        </div>
      </div>
    </div>
  );
}
