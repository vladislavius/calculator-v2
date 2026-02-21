'use client';

import { useState, useEffect } from 'react';
import { useCharterStore } from '../store/useCharterStore';

export default function SearchPanel({ handleSearch }: { handleSearch: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMob, setIsMob] = useState(false);
  const s = useCharterStore();

  useEffect(() => {
    const check = () => setIsMob(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const searchDate = s.searchDate;
  const setSearchDate = (v: string) => s.set({ searchDate: v });
  const destination = s.destination;
  const setDestination = (v: string) => s.set({ destination: v });
  const showDestinationSuggestions = s.showDestinationSuggestions;
  const setShowDestinationSuggestions = (v: boolean) => s.set({ showDestinationSuggestions: v });
  const allRoutes = s.allRoutes;
  const allBoats = s.allBoats;
  const boatPartners = s.boatPartners;
  const selectedPartnerFilter = s.selectedPartnerFilter;
  const setSelectedPartnerFilter = (v: string) => s.set({ selectedPartnerFilter: v });
  const boatNameSearch = s.boatNameSearch;
  const setBoatNameSearch = (v: string) => s.set({ boatNameSearch: v });
  const showBoatSuggestions = s.showBoatSuggestions;
  const setShowBoatSuggestions = (v: boolean) => s.set({ showBoatSuggestions: v });
  const timeSlot = s.timeSlot;
  const setTimeSlot = (v: string) => s.set({ timeSlot: v });
  const boatType = s.boatType;
  const setBoatType = (v: string) => s.set({ boatType: v });
  const season = s.season;
  const setSeason = (v: string) => s.set({ season: v });
  const sortBy = s.sortBy;
  const setSortBy = (v: string) => s.set({ sortBy: v });
  const adults = s.adults;
  const setAdults = (v: number) => s.set({ adults: v });
  const loading = s.loading;

  const seasons = [
    { value: 'auto', label: '📅 Авто (по дате)' },
    { value: 'all_seasons', label: '🌍 Все сезоны' },
    { value: 'high', label: '🔴 Высокий' },
    { value: 'low', label: '🟢 Низкий' },
    { value: 'peak', label: '🔥 Пик' },
  ];
  const timeSlots = [
    { value: 'full_day', label: 'Полный день (8ч)' },
    { value: 'half_day', label: 'Полдня (4ч)' },
    { value: 'sunset', label: 'Закат (3ч)' },
    { value: 'overnight', label: 'С ночёвкой' },
  ];
  const boatTypes = [
    { value: '', label: 'Любой тип' },
    { value: 'catamaran', label: '⛵ Катамаран' },
    { value: 'speedboat', label: '🚤 Спидбот' },
    { value: 'yacht', label: '🛥 Яхта' },
  ];

  const inp: React.CSSProperties = {
    width: '100%',
    padding: isMob ? '8px 10px' : '10px 14px',
    border: '1.5px solid var(--os-border)',
    borderRadius: 'var(--r-md)',
    fontSize: isMob ? '12px' : '14px',
    backgroundColor: 'var(--os-surface)',
    color: 'var(--os-text-1)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  };
  const lbl: React.CSSProperties = {
    display: 'block',
    marginBottom: isMob ? '3px' : '6px',
    fontSize: isMob ? '9px' : '11px',
    fontWeight: 600,
    color: 'var(--os-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  const dd: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    backgroundColor: 'var(--os-card)', border: '1.5px solid var(--os-border-hover)',
    borderRadius: 'var(--r-md)', maxHeight: 200, overflowY: 'auto', zIndex: 200,
    boxShadow: 'var(--shadow-float)',
  };

  const filterRoutes = (routes: any[]) => routes.filter(r => {
    const q = destination.toLowerCase();
    return (r.name_en||'').toLowerCase().includes(q) || (r.name_ru||'').toLowerCase().includes(q);
  });
  const filterBoats = (boats: any[]) => boats.filter(b => b.name.toLowerCase().includes(boatNameSearch.toLowerCase()));

  const doSearch = () => { handleSearch(); if (isMob) setCollapsed(true); };

  if (collapsed && isMob) {
    return (
      <div style={{
        padding: isMob ? '8px 12px' : '10px 16px',
        background: 'var(--os-card)', borderRadius: 'var(--r-lg)',
        border: '1px solid var(--os-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: isMob ? 11 : 13, color: 'var(--os-text-2)', flexWrap: 'wrap' }}>
          <span>📅 {searchDate || '—'}</span>
          <span>·</span>
          <span>👥 {adults}</span>
          {destination && <><span>·</span><span style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🏝️ {destination}</span></>}
        </div>
        <button onClick={() => setCollapsed(false)} style={{
          padding: isMob ? '5px 10px' : '6px 14px',
          background: 'var(--os-aqua-btn)', color: '#0C1825', border: 'none',
          borderRadius: 'var(--r-md)', fontSize: isMob ? 11 : 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
        }}>🔍 Фильтры</button>
      </div>
    );
  }

  const gap = isMob ? '8px' : '12px';
  const pad = isMob ? '12px 14px' : '16px 20px';

  return (
    <div className="os-card" style={{ marginBottom: isMob ? 10 : 20, padding: pad }}>
      {/* ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : '150px 1fr 1fr 1fr', gap, marginBottom: gap }}>
        <div>
          <label style={lbl}>📅 Дата</label>
          <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} style={{...inp, colorScheme:'dark'}} />
        </div>
        <div style={{ position: 'relative', gridColumn: isMob ? 'span 1' : 'auto' }}>
          <label style={lbl}>🗺️ Направление</label>
          <input placeholder={isMob ? "Phi Phi..." : "Phi Phi, Phang Nga..."} value={destination}
            onChange={e => { setDestination(e.target.value); setShowDestinationSuggestions(true); }}
            onFocus={() => setShowDestinationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
            style={inp} />
          {showDestinationSuggestions && destination && filterRoutes(allRoutes).length > 0 && (
            <div style={dd}>{filterRoutes(allRoutes).slice(0,6).map(r => (
              <div key={r.id} onClick={() => { setDestination(r.name_en||r.name_ru); setShowDestinationSuggestions(false); }}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', fontSize: 12, color: 'var(--os-text-1)' }}>
                {r.name_en}
              </div>
            ))}</div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <label style={lbl}>🚢 Лодка</label>
          <input placeholder={isMob ? "Real..." : "Real, Princess..."} value={boatNameSearch}
            onChange={e => { setBoatNameSearch(e.target.value); setShowBoatSuggestions(true); }}
            onFocus={() => setShowBoatSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBoatSuggestions(false), 200)}
            style={inp} />
          {showBoatSuggestions && boatNameSearch && filterBoats(allBoats).length > 0 && (
            <div style={dd}>{filterBoats(allBoats).slice(0,6).map(b => (
              <div key={b.id} onClick={() => { setBoatNameSearch(b.name); setShowBoatSuggestions(false); }}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', fontSize: 12, color: 'var(--os-text-1)' }}>
                {b.name}
              </div>
            ))}</div>
          )}
        </div>
        <div>
          <label style={lbl}>🏢 Партнёр</label>
          <select value={selectedPartnerFilter} onChange={e => setSelectedPartnerFilter(e.target.value)} style={inp as any}>
            <option value="">Все</option>
            {boatPartners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : '1fr 1fr 1fr 80px 1fr auto', gap, alignItems: 'end' }}>
        <div>
          <label style={lbl}>🚤 Тип</label>
          <select value={boatType} onChange={e => setBoatType(e.target.value)} style={inp as any}>
            {boatTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>⏱️ Время</label>
          <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} style={inp as any}>
            {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>📅 Сезон</label>
          <select value={season} onChange={e => setSeason(e.target.value)} style={inp as any}>
            {seasons.map(ss => <option key={ss.value} value={ss.value}>{ss.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>👥 Гости</label>
          <input type="number" min={1} max={100} value={adults} onChange={e => setAdults(Math.max(1,+e.target.value))} style={inp} />
        </div>
        <div>
          <label style={lbl}>📊 Сортировка</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inp as any}>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="size">Размер</option>
            <option value="capacity">Вместимость</option>
          </select>
        </div>
        <div style={{ gridColumn: isMob ? '1 / -1' : 'auto' }}>
          <button onClick={doSearch} disabled={loading} className="os-btn-search"
            style={{ width: isMob ? '100%' : 'auto', padding: isMob ? '10px' : '10px 28px', fontSize: isMob ? 13 : 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading ? '⏳ Поиск...' : '🔍 Найти лодки'}
          </button>
        </div>
      </div>
    </div>
  );
}
