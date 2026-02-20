'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BoatOption = {
  id: number; boat_id: number; option_id: number; status: string;
  price: number; available: boolean;
  options_catalog: { name_en: string; name_ru: string } | null;
};
type Boat = { id: number; name: string };
type CatalogItem = { id: number; name_en: string; name_ru: string };

const inp: React.CSSProperties = { padding: '6px 10px', backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 4, color: 'var(--os-text-1)', fontSize: 13, outline: 'none' };
const btn = (color: string): React.CSSProperties => ({ padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, backgroundColor: color, color: '#fff' });
const cell: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid var(--os-border)', fontSize: 13 };
const hcell: React.CSSProperties = { ...cell, fontWeight: 700, fontSize: 11, color: 'var(--os-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'var(--os-surface)' };

const STATUS_COLORS: Record<string, string> = {
  included: 'var(--os-green)', paid_optional: 'var(--os-gold)', excluded: 'var(--os-red)',
};

export default function OptionsTab() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [options, setOptions] = useState<BoatOption[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('id, name').order('name'),
      sb.from('options_catalog').select('id, name_en, name_ru').order('name_en'),
    ]).then(([b, c]) => {
      setBoats(b.data || []);
      setCatalog(c.data || []);
    });
  }, []);

  const loadOptions = async (boatId: number) => {
    setLoading(true);
    const { data } = await sb.from('boat_options')
      .select('id, boat_id, option_id, status, price, available, options_catalog(name_en, name_ru)')
      .eq('boat_id', boatId).order('status');
    setOptions((data as unknown as BoatOption[]) || []);
    setLoading(false);
  };

  const updateOption = async (id: number, field: string, value: unknown) => {
    await sb.from('boat_options').update({ [field]: value }).eq('id', id);
    setOptions(opts => opts.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addOption = async () => {
    if (!selectedBoat) return;
    const { data, error } = await sb.from('boat_options').insert({
      boat_id: selectedBoat, option_id: catalog[0]?.id, status: 'included', price: 0, available: true,
    }).select('id, boat_id, option_id, status, price, available, options_catalog(name_en, name_ru)');
    if (!error && data) setOptions([...options, ...(data as unknown as BoatOption[])]);
  };

  const deleteOption = async (id: number) => {
    if (!confirm('Удалить опцию?')) return;
    await sb.from('boat_options').delete().eq('id', id);
    setOptions(opts => opts.filter(o => o.id !== id));
    setMsg('✅ Удалено');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedBoat} onChange={e => { const v = +e.target.value; setSelectedBoat(v); loadOptions(v); }}
          style={{ ...inp, minWidth: 220 }}>
          <option value="">— выбрать лодку —</option>
          {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {selectedBoat && <button onClick={addOption} style={btn('var(--os-aqua)')}>+ Добавить опцию</button>}
        {msg && <span style={{ fontSize: 13, color: 'var(--os-green)' }}>{msg}</span>}
      </div>

      {loading && <div style={{ color: 'var(--os-text-3)' }}>Загрузка...</div>}

      {!loading && selectedBoat && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Опция (EN)', 'Опция (RU)', 'Статус', 'Цена', 'Доступно', ''].map(h => <th key={h} style={hcell}>{h}</th>)}</tr></thead>
            <tbody>
              {options.map(opt => (
                <tr key={opt.id}>
                  <td style={cell}>
                    <select value={opt.option_id} onChange={e => updateOption(opt.id, 'option_id', +e.target.value)}
                      style={{ ...inp, width: 200 }}>
                      {catalog.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                    </select>
                  </td>
                  <td style={{ ...cell, color: 'var(--os-text-3)', fontSize: 12 }}>
                    {opt.options_catalog?.name_ru || '—'}
                  </td>
                  <td style={cell}>
                    <select value={opt.status} onChange={e => updateOption(opt.id, 'status', e.target.value)}
                      style={{ ...inp, width: 130, color: STATUS_COLORS[opt.status] || 'inherit' }}>
                      <option value="included">included</option>
                      <option value="paid_optional">paid_optional</option>
                      <option value="excluded">excluded</option>
                    </select>
                  </td>
                  <td style={cell}>
                    <input type="number" value={opt.price || 0} onChange={e => updateOption(opt.id, 'price', +e.target.value)}
                      style={{ ...inp, width: 80 }} />
                  </td>
                  <td style={cell}>
                    <input type="checkbox" checked={!!opt.available} onChange={e => updateOption(opt.id, 'available', e.target.checked)} />
                  </td>
                  <td style={cell}>
                    <button onClick={() => deleteOption(opt.id)} style={btn('var(--os-red)')}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--os-text-3)', padding: '8px 12px' }}>Опций: {options.length}</div>
        </div>
      )}
    </div>
  );
}
