'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase as sb } from '../../../lib/supabase';

type Boat = {
  id: number; name: string; boat_type: string; model: string;
  active: boolean; partner_id: number; main_photo_url: string;
  cabins: number; max_pax_day: number;
};
type Partner = { id: number; name: string };

const inp: React.CSSProperties = {
  padding: '7px 12px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 6,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 14px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});
const cell: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--os-border)', fontSize: 13, color: 'var(--os-text-1)' };
const hcell: React.CSSProperties = { ...cell, fontWeight: 700, color: 'var(--os-text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'var(--os-surface)' };

export default function BoatsTab() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<number | null>(null);
  const [partnerFilterName, setPartnerFilterName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<{ id: number; name: string } | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'hidden'>('all');
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('id,name,boat_type,model,active,partner_id,main_photo_url,cabins,max_pax_day').order('name'),
      sb.from('partners').select('id,name').order('name'),
    ]).then(([b, p]) => {
      setBoats(b.data || []);
      setPartners(p.data || []);
      setLoading(false);
    });
  }, []);

  // Закрываем подсказки при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const partnerSuggestions = partnerSearch.length > 0
    ? partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase())).slice(0, 8)
    : [];

  const selectPartner = (p: Partner) => {
    setPartnerFilter(p.id);
    setPartnerFilterName(p.name);
    setPartnerSearch(p.name);
    setShowSuggestions(false);
  };

  const clearPartnerFilter = () => {
    setPartnerFilter(null);
    setPartnerFilterName('');
    setPartnerSearch('');
  };

  const filtered = boats.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.model?.toLowerCase().includes(search.toLowerCase());
    const matchPartner = !partnerFilter || b.partner_id === partnerFilter;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? b.active : !b.active);
    return matchSearch && matchPartner && matchActive;
  });

  const toggleActive = async (boat: Boat) => {
    await sb.from('boats').update({ active: !boat.active }).eq('id', boat.id);
    setBoats(bs => bs.map(b => b.id === boat.id ? { ...b, active: !b.active } : b));
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;
  if (selectedBoat) return <BoatDetail boatId={selectedBoat.id} boatName={selectedBoat.name} onBack={() => setSelectedBoat(null)} />;

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Поиск по названию */}
        <input
          placeholder="🔍 Название / модель..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, minWidth: 200 }}
        />

        {/* Поиск по партнёру с подсказками */}
        <div ref={suggestRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="🤝 Партнёр..."
              value={partnerSearch}
              onChange={e => { setPartnerSearch(e.target.value); setShowSuggestions(true); if (!e.target.value) clearPartnerFilter(); }}
              onFocus={() => setShowSuggestions(true)}
              style={{ ...inp, minWidth: 220, paddingRight: partnerFilter ? 28 : 12 }}
            />
            {partnerFilter && (
              <button onClick={clearPartnerFilter} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--os-text-3)', fontSize: 14, lineHeight: 1,
              }}>✕</button>
            )}
          </div>
          {showSuggestions && partnerSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 100, minWidth: 260,
              backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
              borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', marginTop: 2,
            }}>
              {partnerSuggestions.map(p => (
                <div key={p.id} onClick={() => selectPartner(p)} style={{
                  padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid var(--os-border)',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--os-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  🤝 {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Фильтр активности */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'active', 'hidden'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)} style={{
              ...btn(filterActive === f ? 'var(--os-aqua)' : 'var(--os-surface)'),
              color: filterActive === f ? '#fff' : 'var(--os-text-2)',
              border: '1px solid var(--os-border)',
            }}>
              {f === 'all' ? 'Все' : f === 'active' ? '✅ Активные' : '🙈 Скрытые'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--os-text-3)', marginLeft: 'auto' }}>
          {filtered.length} из {boats.length} лодок
          {partnerFilter && <span style={{ color: 'var(--os-aqua)', marginLeft: 6 }}>· {partnerFilterName}</span>}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Лодка', 'Тип', 'Каюты', 'Макс/день', 'Партнёр', 'Статус', 'Действия'].map(h => (
                <th key={h} style={hcell}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(boat => {
              const partner = partners.find(p => p.id === boat.partner_id);
              return (
                <tr key={boat.id} style={{ backgroundColor: boat.active ? 'transparent' : 'rgba(255,60,60,0.03)' }}>
                  <td style={cell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {boat.main_photo_url
                        ? <img src={boat.main_photo_url} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 30, backgroundColor: 'var(--os-surface)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>⛵</div>
                      }
                      <span style={{ fontWeight: 600 }}>{boat.name}</span>
                    </div>
                  </td>
                  <td style={{ ...cell, color: 'var(--os-text-3)' }}>{boat.boat_type}</td>
                  <td style={cell}>{boat.cabins || '—'}</td>
                  <td style={cell}>{boat.max_pax_day || '—'}</td>
                  <td style={cell}>
                    {partner
                      ? <span style={{ fontSize: 12, color: 'var(--os-aqua)', cursor: 'pointer' }}>{partner.name}</span>
                      : <span style={{ color: 'var(--os-text-3)' }}>—</span>
                    }
                  </td>
                  <td style={cell}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      backgroundColor: boat.active ? 'rgba(0,212,180,0.12)' : 'rgba(255,60,60,0.12)',
                      color: boat.active ? 'var(--os-green)' : 'var(--os-red)',
                    }}>
                      {boat.active ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td style={cell}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setSelectedBoat({ id: boat.id, name: boat.name })}
                        style={btn('var(--os-aqua)')}>⚙️ Управление</button>
                      <button onClick={() => toggleActive(boat)}
                        style={btn(boat.active ? '#f59e0b' : 'var(--os-green)')}>
                        {boat.active ? '🙈' : '👁'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--os-text-3)', fontSize: 14 }}>
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}
