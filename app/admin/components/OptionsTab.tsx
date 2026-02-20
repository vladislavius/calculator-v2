'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase as sb } from '../../../lib/supabase';

type BoatOption = {
  id: number; boat_id: number; option_id: number; status: string;
  price: number; available: boolean;
  options_catalog: { name_en: string; name_ru: string } | null;
};
type Boat = { id: number; name: string; partner_id: number };
type Partner = { id: number; name: string };
type CatalogItem = { id: number; name_en: string; name_ru: string };

const inp: React.CSSProperties = {
  padding: '7px 12px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 6,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 12px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});
const cell: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid var(--os-border)', fontSize: 13 };
const hcell: React.CSSProperties = { ...cell, fontWeight: 700, fontSize: 11, color: 'var(--os-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'var(--os-surface)' };

const STATUS_COLORS: Record<string, string> = {
  included: 'var(--os-green)', paid_optional: 'var(--os-gold)', excluded: 'var(--os-red)',
};

export default function OptionsTab() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [options, setOptions] = useState<BoatOption[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [boatSearch, setBoatSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('id,name,partner_id').order('name'),
      sb.from('partners').select('id,name').order('name'),
      sb.from('options_catalog').select('id,name_en,name_ru').order('name_en'),
    ]).then(([b, p, c]) => {
      setBoats(b.data || []);
      setPartners(p.data || []);
      setCatalog(c.data || []);
    });
  }, []);

  // Закрываем подсказки при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = boatSearch.length >= 1
    ? boats.filter(b => b.name.toLowerCase().includes(boatSearch.toLowerCase())).slice(0, 10)
    : [];

  const selectBoat = async (boat: Boat) => {
    setSelectedBoat(boat);
    setBoatSearch(boat.name);
    setShowSuggestions(false);
    setLoading(true);
    const { data } = await sb.from('boat_options')
      .select('id,boat_id,option_id,status,price,available,options_catalog(name_en,name_ru)')
      .eq('boat_id', boat.id).order('status');
    setOptions((data as unknown as BoatOption[]) || []);
    setLoading(false);
  };

  const clearBoat = () => {
    setSelectedBoat(null);
    setBoatSearch('');
    setOptions([]);
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const updateOption = async (id: number, field: string, value: unknown) => {
    await sb.from('boat_options').update({ [field]: value }).eq('id', id);
    setOptions(opts => opts.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addOption = async () => {
    if (!selectedBoat) return;
    const { data, error } = await sb.from('boat_options')
      .insert({ boat_id: selectedBoat.id, option_id: catalog[0]?.id, status: 'included', price: 0, available: true })
      .select('id,boat_id,option_id,status,price,available,options_catalog(name_en,name_ru)');
    if (!error && data) setOptions(o => [...o, ...(data as unknown as BoatOption[])]);
  };

  const deleteOption = async (id: number) => {
    if (!confirm('Удалить опцию?')) return;
    await sb.from('boat_options').delete().eq('id', id);
    setOptions(o => o.filter(x => x.id !== id));
    flash('✅ Удалено');
  };

  const partner = selectedBoat ? partners.find(p => p.id === selectedBoat.partner_id) : null;

  // Группируем опции по статусу
  const grouped = {
    included: options.filter(o => o.status === 'included'),
    paid_optional: options.filter(o => o.status === 'paid_optional'),
    excluded: options.filter(o => o.status === 'excluded'),
  };

  return (
    <div>
      {/* Поиск лодки */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 8 }}>
          Выберите лодку для управления опциями:
        </div>
        <div ref={suggestRef} style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="🔍 Начните вводить название лодки..."
              value={boatSearch}
              onChange={e => { setBoatSearch(e.target.value); setShowSuggestions(true); if (!e.target.value) clearBoat(); }}
              onFocus={() => setShowSuggestions(true)}
              style={{ ...inp, minWidth: 340, paddingRight: selectedBoat ? 32 : 12 }}
            />
            {selectedBoat && (
              <button onClick={clearBoat} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--os-text-3)', fontSize: 16, lineHeight: 1, padding: 0,
              }}>✕</button>
            )}
          </div>

          {/* Подсказки */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 200, minWidth: 340,
              backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 4,
              maxHeight: 320, overflowY: 'auto',
            }}>
              {suggestions.map(b => {
                const p = partners.find(x => x.id === b.partner_id);
                return (
                  <div key={b.id} onClick={() => selectBoat(b)} style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--os-border)',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--os-surface)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>⛵ {b.name}</div>
                    {p && <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginTop: 2 }}>🤝 {p.name}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Выбранная лодка */}
        {selectedBoat && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginLeft: 12,
            backgroundColor: 'rgba(0,212,180,0.08)', border: '1px solid rgba(0,212,180,0.2)',
            borderRadius: 6, padding: '6px 14px', fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: 'var(--os-aqua)' }}>⛵ {selectedBoat.name}</span>
            {partner && <span style={{ color: 'var(--os-text-3)' }}>· 🤝 {partner.name}</span>}
            <span style={{ color: 'var(--os-text-3)' }}>· {options.length} опций</span>
          </div>
        )}
      </div>

      {/* Контент */}
      {!selectedBoat && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--os-text-3)',
          backgroundColor: 'var(--os-card)', borderRadius: 10, border: '1px solid var(--os-border)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 14 }}>Введите название лодки в поиске выше</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Доступно лодок: {boats.length}</div>
        </div>
      )}

      {loading && <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка опций...</div>}

      {selectedBoat && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={addOption} style={btn('var(--os-aqua)')}>+ Добавить опцию</button>
            {msg && <span style={{ fontSize: 12, color: msg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)' }}>{msg}</span>}
          </div>

          {/* Статистика по статусам */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              ['included', '✅ Включено', grouped.included.length],
              ['paid_optional', '💰 Платные', grouped.paid_optional.length],
              ['excluded', '❌ Исключено', grouped.excluded.length],
            ].map(([status, label, count]) => (
              <div key={status as string} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                backgroundColor: `${STATUS_COLORS[status as string]}18`,
                color: STATUS_COLORS[status as string],
                border: `1px solid ${STATUS_COLORS[status as string]}44`,
              }}>{label as string}: {count as number}</div>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Опция (EN)', 'Русское название', 'Статус', 'Цена', 'Доступно', ''].map(h =>
                  <th key={h} style={hcell}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {options.map(opt => (
                  <tr key={opt.id} style={{ borderLeft: `3px solid ${STATUS_COLORS[opt.status] || 'transparent'}` }}>
                    <td style={cell}>
                      <select value={opt.option_id} onChange={e => updateOption(opt.id, 'option_id', +e.target.value)}
                        style={{ ...inp, width: 220, padding: '4px 8px', fontSize: 12 }}>
                        {catalog.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                      </select>
                    </td>
                    <td style={{ ...cell, color: 'var(--os-text-3)', fontSize: 12 }}>
                      {opt.options_catalog?.name_ru || '—'}
                    </td>
                    <td style={cell}>
                      <select value={opt.status} onChange={e => updateOption(opt.id, 'status', e.target.value)}
                        style={{ ...inp, width: 140, padding: '4px 8px', fontSize: 12, color: STATUS_COLORS[opt.status] }}>
                        <option value="included">✅ included</option>
                        <option value="paid_optional">💰 paid_optional</option>
                        <option value="excluded">❌ excluded</option>
                      </select>
                    </td>
                    <td style={cell}>
                      <input type="number" value={opt.price || 0}
                        onChange={e => updateOption(opt.id, 'price', +e.target.value)}
                        style={{ ...inp, width: 80, padding: '4px 8px', fontSize: 12 }} />
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <input type="checkbox" checked={!!opt.available}
                        onChange={e => updateOption(opt.id, 'available', e.target.checked)} />
                    </td>
                    <td style={cell}>
                      <button onClick={() => deleteOption(opt.id)} style={btn('var(--os-red)')}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {options.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--os-text-3)', fontSize: 13 }}>
                У этой лодки нет опций. Нажмите «+ Добавить опцию».
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
