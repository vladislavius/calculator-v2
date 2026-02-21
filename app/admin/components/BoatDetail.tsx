'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';

type Route = { id: number; name: string; name_ru: string; duration_hours: number; code: string };
type RoutePrice = {
  id: number; boat_id: number; route_id: number; time_slot: string; season: string;
  base_price: number; base_pax: number; extra_pax_price: number;
  fuel_surcharge: number; agent_price: number; client_price: number;
  valid_from: string; valid_to: string;
};
type BoatOption = {
  id: number; option_id: number; status: string; price: number; available: boolean;
  options_catalog: { name_en: string; name_ru: string } | null;
};
type CatalogItem = { id: number; name_en: string; name_ru: string };

const inp: React.CSSProperties = {
  padding: '6px 10px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 4,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none', width: '100%',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 12px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});
const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--os-border)', fontSize: 12, color: 'var(--os-text-1)' };
const hcell: React.CSSProperties = { ...cell, fontWeight: 700, fontSize: 11, color: 'var(--os-text-3)', textTransform: 'uppercase', backgroundColor: 'var(--os-surface)' };
const STATUS_COLOR: Record<string, string> = {
  included: 'var(--os-green)', paid_optional: 'var(--os-gold)', excluded: 'var(--os-red)',
};

export default function BoatDetail({ boatId, boatName, onBack }: {
  boatId: number; boatName: string; onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'prices' | 'options' | 'info'>('prices');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routePrices, setRoutePrices] = useState<RoutePrice[]>([]);
  const [options, setOptions] = useState<BoatOption[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [boat, setBoat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editingPrice, setEditingPrice] = useState<Partial<RoutePrice> | null>(null);

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('*').eq('id', boatId).single(),
      sb.from('routes').select('*').order('name'),
      sb.from('route_prices').select('*').eq('boat_id', boatId).order('route_id'),
      sb.from('boat_options').select('id,option_id,status,price,available,options_catalog(name_en,name_ru)').eq('boat_id', boatId),
      sb.from('options_catalog').select('id,name_en,name_ru').order('name_en'),
    ]).then(([b, r, rp, bo, cat]) => {
      setBoat(b.data);
      setRoutes(r.data || []);
      setRoutePrices(rp.data || []);
      setOptions((bo.data as unknown as BoatOption[]) || []);
      setCatalog(cat.data || []);
      setLoading(false);
    });
  }, [boatId]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const savePrice = async () => {
    if (!editingPrice) return;
    const { id, ...fields } = editingPrice;
    const payload = { ...fields, boat_id: boatId };
    const { error } = id
      ? await sb.from('route_prices').update(payload).eq('id', id)
      : await sb.from('route_prices').insert(payload);
    if (error) { flash('❌ ' + error.message); return; }
    flash('✅ Сохранено');
    const { data } = await sb.from('route_prices').select('*').eq('boat_id', boatId).order('route_id');
    setRoutePrices(data || []);
    setEditingPrice(null);
  };

  const deletePrice = async (id: number) => {
    if (!confirm('Удалить цену маршрута?')) return;
    await sb.from('route_prices').delete().eq('id', id);
    setRoutePrices(rp => rp.filter(r => r.id !== id));
    flash('✅ Удалено');
  };

  const updateOption = async (id: number, field: string, value: unknown) => {
    await sb.from('boat_options').update({ [field]: value }).eq('id', id);
    setOptions(opts => opts.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addOption = async () => {
    const { data, error } = await sb.from('boat_options')
      .insert({ boat_id: boatId, option_id: catalog[0]?.id, status: 'included', price: 0, available: true })
      .select('id,option_id,status,price,available,options_catalog(name_en,name_ru)');
    if (!error && data) setOptions(o => [...o, ...(data as unknown as BoatOption[])]);
  };

  const deleteOption = async (id: number) => {
    await sb.from('boat_options').delete().eq('id', id);
    setOptions(o => o.filter(x => x.id !== id));
    flash('✅ Удалено');
  };

  const saveBoatInfo = async () => {
    const { error } = await sb.from('boats').update(boat).eq('id', boatId);
    flash(error ? '❌ ' + error.message : '✅ Сохранено');
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;

  const SUBTABS = [
    { id: 'prices', label: '💰 Маршруты & Цены' },
    { id: 'options', label: '⚙️ Опции' },
    { id: 'info', label: '📋 Данные лодки' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--os-aqua)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Назад к лодкам</button>
        <span style={{ color: 'var(--os-text-3)' }}>/</span>
        <span style={{ fontWeight: 700 }}>{boatName}</span>
        {msg && <span style={{ marginLeft: 'auto', fontSize: 12, color: msg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)' }}>{msg}</span>}
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--os-border)' }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            backgroundColor: 'transparent',
            color: activeTab === t.id ? 'var(--os-aqua)' : 'var(--os-text-2)',
            borderBottom: activeTab === t.id ? '2px solid var(--os-aqua)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* PRICES */}
      {activeTab === 'prices' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setEditingPrice({ time_slot: 'full_day', season: 'regular', base_price: 0 })}
              style={btn('var(--os-aqua)')}>+ Добавить маршрут/цену</button>
          </div>
          {editingPrice && (
            <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>
                {editingPrice.id ? '✏️ Редактировать' : '➕ Новый маршрут'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Маршрут</div>
                  <select value={editingPrice.route_id || ''} onChange={e => setEditingPrice({ ...editingPrice, route_id: +e.target.value })} style={inp}>
                    <option value="">— выбрать маршрут —</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Тайм-слот</div>
                  <select value={editingPrice.time_slot || 'full_day'} onChange={e => setEditingPrice({ ...editingPrice, time_slot: e.target.value })} style={inp}>
                    <option value="full_day">full_day</option>
                    <option value="half_day">half_day</option>
                    <option value="overnight">overnight</option>
                    <option value="multi_day">multi_day</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Сезон</div>
                  <select value={editingPrice.season || 'regular'} onChange={e => setEditingPrice({ ...editingPrice, season: e.target.value })} style={inp}>
                    <option value="regular">Обычный</option>
                    <option value="high">Высокий</option>
                    <option value="peak">Пиковый</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>
                {([
                  ['Базовая цена (THB)', 'base_price'], ['Цена агента', 'agent_price'],
                  ['Цена клиента', 'client_price'], ['Базовых гостей', 'base_pax'],
                  ['Доп. гость', 'extra_pax_price'], ['Топливный сбор', 'fuel_surcharge'],
                ] as [string, string][]).map(([label, field]) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                    <input type="number" value={(editingPrice as any)[field] || 0}
                      onChange={e => setEditingPrice({ ...editingPrice, [field]: +e.target.value })} style={inp} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Действует от</div>
                  <input type="date" value={editingPrice.valid_from || ''} onChange={e => setEditingPrice({ ...editingPrice, valid_from: e.target.value })} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Действует до</div>
                  <input type="date" value={editingPrice.valid_to || ''} onChange={e => setEditingPrice({ ...editingPrice, valid_to: e.target.value })} style={inp} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={savePrice} style={btn('var(--os-green)')}>💾 Сохранить</button>
                <button onClick={() => setEditingPrice(null)} style={btn('#666')}>Отмена</button>
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Маршрут', 'Слот', 'База', 'Агент', 'Клиент', '+Гость', 'Сезон', 'Действует до', ''].map(h =>
                <th key={h} style={hcell}>{h}</th>)}</tr></thead>
              <tbody>
                {routePrices.map(rp => {
                  const route = routes.find(r => r.id === rp.route_id);
                  return (
                    <tr key={rp.id}>
                      <td style={{ ...cell, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={route?.name}>{route?.name || `#${rp.route_id}`}</td>
                      <td style={cell}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--os-surface)' }}>{rp.time_slot}</span></td>
                      <td style={{ ...cell, fontWeight: 700, color: 'var(--os-aqua)' }}>{rp.base_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.agent_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.client_price?.toLocaleString() || '—'}</td>
                      <td style={cell}>{rp.extra_pax_price || '—'}</td>
                      <td style={cell}>{rp.season}</td>
                      <td style={cell}>{rp.valid_to ? rp.valid_to.slice(0,10) : '—'}</td>
                      <td style={cell}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setEditingPrice(rp)} style={btn('var(--os-aqua)')}>✏️</button>
                          <button onClick={() => deletePrice(rp.id)} style={btn('var(--os-red)')}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {routePrices.length === 0 && (
              <div style={{ padding: 20, color: 'var(--os-text-3)', textAlign: 'center', fontSize: 13 }}>
                Нет маршрутов. Нажмите «+ Добавить».
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPTIONS */}
      {activeTab === 'options' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={addOption} style={btn('var(--os-aqua)')}>+ Добавить опцию</button>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Опция (EN)', 'RU', 'Статус', 'Цена', 'Доступно', ''].map(h =>
                <th key={h} style={hcell}>{h}</th>)}</tr></thead>
              <tbody>
                {options.map(opt => (
                  <tr key={opt.id}>
                    <td style={cell}>
                      <select value={opt.option_id} onChange={e => updateOption(opt.id, 'option_id', +e.target.value)}
                        style={{ ...inp, width: 210 }}>
                        {catalog.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                      </select>
                    </td>
                    <td style={{ ...cell, color: 'var(--os-text-3)', fontSize: 11 }}>{opt.options_catalog?.name_ru || '—'}</td>
                    <td style={cell}>
                      <select value={opt.status} onChange={e => updateOption(opt.id, 'status', e.target.value)}
                        style={{ ...inp, width: 140, color: STATUS_COLOR[opt.status] }}>
                        <option value="included">included</option>
                        <option value="paid_optional">paid_optional</option>
                        <option value="excluded">excluded</option>
                      </select>
                    </td>
                    <td style={cell}>
                      <input type="number" value={opt.price || 0}
                        onChange={e => updateOption(opt.id, 'price', +e.target.value)}
                        style={{ ...inp, width: 80 }} />
                    </td>
                    <td style={cell}>
                      <input type="checkbox" checked={!!opt.available}
                        onChange={e => updateOption(opt.id, 'available', e.target.checked)} />
                    </td>
                    <td style={cell}><button onClick={() => deleteOption(opt.id)} style={btn('var(--os-red)')}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {options.length === 0 && <div style={{ padding: 20, color: 'var(--os-text-3)', textAlign: 'center', fontSize: 13 }}>Нет опций.</div>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginTop: 8 }}>Опций: {options.length}</div>
        </div>
      )}

      {/* INFO */}
      {activeTab === 'info' && boat && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            {([
              ['Название', 'name', 'text'], ['Тип', 'boat_type', 'text'], ['Модель', 'model', 'text'],
              ['Длина (ft)', 'length_ft', 'number'], ['Год постройки', 'year_built', 'number'], ['Каюты', 'cabins', 'number'],
              ['Туалеты', 'toilets', 'number'], ['Макс/день', 'max_pax_day', 'number'], ['Скорость (узлы)', 'speed_knots', 'number'],
              ['Причал', 'default_pier', 'text'], ['Фото (URL)', 'main_photo_url', 'text'],
            ] as [string, string, string][]).map(([label, field, type]) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                <input type={type} value={boat[field] || ''}
                  onChange={e => setBoat({ ...boat, [field]: type === 'number' ? +e.target.value : e.target.value })}
                  style={inp} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 20 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.has_flybridge} onChange={e => setBoat({ ...boat, has_flybridge: e.target.checked })} />
                Флайбридж
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.has_jacuzzi} onChange={e => setBoat({ ...boat, has_jacuzzi: e.target.checked })} />
                Джакузи
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!boat.active} onChange={e => setBoat({ ...boat, active: e.target.checked })} />
                Активна
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Примечания</div>
            <textarea value={boat.notes || ''} onChange={e => setBoat({ ...boat, notes: e.target.value })}
              rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
          {boat.main_photo_url && (
            <div style={{ marginBottom: 16 }}>
              <img src={boat.main_photo_url} alt={boat.name}
                style={{ maxHeight: 160, borderRadius: 8, border: '1px solid var(--os-border)' }} />
            </div>
          )}
          <button onClick={saveBoatInfo} style={btn('var(--os-green)')}>💾 Сохранить данные лодки</button>
        </div>
      )}
    </div>
  );
}
