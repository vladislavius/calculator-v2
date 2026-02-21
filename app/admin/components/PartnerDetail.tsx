'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';
import BoatDetail from './BoatDetail';

type Partner = {
  id: number; name: string; contact_name: string; contact_phone: string;
  contact_email: string; website: string; address: string;
  commission_percent: number; tax_id: string;
  bank_name: string; bank_account_name: string; bank_account_number: string;
  bank_branch: string; swift_code: string;
  contract_valid_from: string; contract_valid_until: string;
  notes: string;
  telegram: string; instagram: string; facebook: string;
  line_id: string; whatsapp: string; booking_url: string;
  logo_url: string; description: string;
};

type Boat = {
  id: number; name: string; code: string; boat_type: string; model: string;
  length_ft: number; year_built: number; cabins: number; toilets: number;
  max_pax_day: number; max_pax_overnight: number;
  speed_knots: number; default_pier: string;
  has_flybridge: boolean; has_jacuzzi: boolean;
  active: boolean; main_photo_url: string; photos_url: string; notes: string;
};

type ImportRecord = {
  id: number; status: string; import_type: string;
  boats_added: number; routes_added: number;
  boat_names: string; notes: string; error_message: string; created_at: string;
};

type UnavailDate = {
  id: number; date_from: string; date_to: string; title: string; source: string;
};

type BoatCalendar = {
  id: number; boat_id: number; calendar_type: string; ical_url: string; last_synced: string; active: boolean;
};

const SUBTABS = [
  { id: 'info',     label: '📋 Инфо' },
  { id: 'boats',    label: '🚢 Лодки' },
  { id: 'calendar', label: '📅 Календарь' },
  { id: 'contract', label: '📄 Контракт' },
  { id: 'notes',    label: '📝 Заметки' },
];

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)',
  color: 'var(--os-text-1)', fontSize: 13, boxSizing: 'border-box',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 6, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: color === '#555' || color === '#666' ? '#ccc' : '#fff',
  whiteSpace: 'nowrap',
});
const label = (text: string) => (
  <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4, fontWeight: 600 }}>{text}</div>
);
const card: React.CSSProperties = {
  backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
  borderRadius: 10, padding: 20, marginBottom: 16,
};

export default function PartnerDetail({ partnerId, partnerName, onBack }: {
  partnerId: number; partnerName: string; onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'info'|'boats'|'calendar'|'contract'|'notes'>('info');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editingBoat, setEditingBoat] = useState<Partial<Boat> | null>(null);

  // Calendar state
  const [unavailDates, setUnavailDates] = useState<UnavailDate[]>([]);
  const [boatCalendars, setBoatCalendars] = useState<BoatCalendar[]>([]);
  const [calBoatId, setCalBoatId] = useState<number | ''>('');
  const [manualForm, setManualForm] = useState({ date_from: '', date_to: '', title: '' });
  const [icalForm, setIcalForm] = useState({ boat_id: '', ical_url: '' });
  const [calMsg, setCalMsg] = useState('');
  const [calLoading, setCalLoading] = useState(false);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const showCalMsg = (m: string) => { setCalMsg(m); setTimeout(() => setCalMsg(''), 3000); };

  const getToken = () => JSON.parse(localStorage.getItem('os_session') || '{}').token || '';

  useEffect(() => { loadData(); }, [partnerId]);

  async function loadData() {
    setLoading(true);
    const [{ data: p }, { data: b }, { data: h }] = await Promise.all([
      sb.from('partners').select('*').eq('id', partnerId).single(),
      sb.from('boats').select('*').eq('partner_id', partnerId).order('name'),
      sb.from('import_history').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(20),
    ]);
    setPartner(p);
    setBoats(b || []);
    setHistory(h || []);
    setLoading(false);
  }

  async function loadCalendarData(boatId?: number) {
    const bId = boatId || calBoatId;
    if (!bId) return;
    setCalLoading(true);
    const [{ data: ud }, { data: bc }] = await Promise.all([
      sb.from('boat_unavailable_dates').select('*').eq('boat_id', bId).order('date_from'),
      sb.from('boat_calendars').select('*').eq('boat_id', bId),
    ]);
    setUnavailDates(ud || []);
    setBoatCalendars(bc || []);
    setCalLoading(false);
  }

  async function savePartner() {
    if (!partner) return;
    const { error } = await sb.from('partners').update(partner).eq('id', partnerId);
    showMsg(error ? `❌ ${error.message}` : '✅ Сохранено');
  }

  async function saveBoat() {
    if (!editingBoat) return;
    const payload = { ...editingBoat, partner_id: partnerId };
    let error;
    if (editingBoat.id) {
      ({ error } = await sb.from('boats').update(payload).eq('id', editingBoat.id));
    } else {
      ({ error } = await sb.from('boats').insert(payload));
    }
    if (error) { showMsg(`❌ ${error.message}`); return; }
    showMsg('✅ Лодка сохранена');
    setEditingBoat(null);
    loadData();
  }

  async function toggleBoatActive(boat: Boat) {
    await sb.from('boats').update({ active: !boat.active }).eq('id', boat.id);
    loadData();
  }

  async function addManualDate() {
    if (!calBoatId || !manualForm.date_from || !manualForm.date_to) {
      showCalMsg('❌ Выберите лодку и даты'); return;
    }
    const token = getToken();
    const res = await fetch('/api/calendar/unavailable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ boat_id: calBoatId, ...manualForm, source: 'manual' }),
    });
    if (res.ok) {
      showCalMsg('✅ Дата добавлена');
      setManualForm({ date_from: '', date_to: '', title: '' });
      loadCalendarData();
    } else {
      showCalMsg('❌ Ошибка сохранения');
    }
  }

  async function deleteUnavailDate(id: number) {
    const token = getToken();
    await fetch('/api/calendar/unavailable', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-session-token': token }, body: JSON.stringify({ id }),
    });
    loadCalendarData();
  }

  async function saveIcalLink() {
    if (!icalForm.boat_id || !icalForm.ical_url) {
      showCalMsg('❌ Выберите лодку и введите ссылку'); return;
    }
    const token = getToken();
    const res = await fetch('/api/calendar/boats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ boat_id: Number(icalForm.boat_id), calendar_type: 'ical', ical_url: icalForm.ical_url, active: true }),
    });
    if (res.ok) {
      showCalMsg('✅ iCal ссылка сохранена');
      setIcalForm({ boat_id: '', ical_url: '' });
      if (calBoatId) loadCalendarData();
    } else {
      showCalMsg('❌ Ошибка');
    }
  }

  async function syncIcal(boatId: number) {
    const token = getToken();
    setCalLoading(true);
    const res = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ boat_id: boatId }),
    });
    const data = await res.json();
    showCalMsg(data.synced > 0 ? `✅ Синхронизировано: ${data.synced} событий` : `⚠️ ${data.errors?.[0] || 'Нет данных'}`);
    loadCalendarData();
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;
  if (selectedBoat) return <BoatDetail boatId={selectedBoat.id} boatName={selectedBoat.name} onBack={() => setSelectedBoat(null)} />;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--os-aqua)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Все партнёры</button>
        <span style={{ color: 'var(--os-text-3)' }}>/</span>
        {partner?.logo_url && <img src={partner.logo_url} alt="" style={{ height: 20, borderRadius: 3 }} />}
        <span style={{ fontWeight: 700, fontSize: 15 }}>{partnerName}</span>
        {msg && <span style={{ marginLeft: 'auto', fontSize: 12, color: msg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)' }}>{msg}</span>}
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--os-border)', flexWrap: 'wrap' }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            backgroundColor: 'transparent',
            color: activeTab === t.id ? 'var(--os-aqua)' : 'var(--os-text-2)',
            borderBottom: activeTab === t.id ? '2px solid var(--os-aqua)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── INFO ── */}
      {activeTab === 'info' && partner && (
        <div>
          {/* Основные контакты */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>👤 Основные контакты</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {([
                ['Название компании', 'name'],
                ['Контактное лицо', 'contact_name'],
                ['Телефон', 'contact_phone'],
                ['Email', 'contact_email'],
                ['Сайт', 'website'],
                ['Адрес', 'address'],
                ['Ссылка на бронирование', 'booking_url'],
                ['Логотип (URL)', 'logo_url'],
              ] as [string, string][]).map(([lbl, field]) => (
                <div key={field}>
                  {label(lbl)}
                  <input value={(partner as any)[field] || ''} onChange={e => setPartner({ ...partner, [field]: e.target.value })} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              {label('Описание')}
              <textarea value={partner.description || ''} onChange={e => setPartner({ ...partner, description: e.target.value })}
                rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
          </div>

          {/* Соцсети */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>🌐 Мессенджеры и соцсети</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {([
                ['📱 WhatsApp', 'whatsapp'],
                ['✈️ Telegram', 'telegram'],
                ['💬 LINE ID', 'line_id'],
                ['📸 Instagram', 'instagram'],
                ['👥 Facebook', 'facebook'],
              ] as [string, string][]).map(([lbl, field]) => (
                <div key={field}>
                  {label(lbl)}
                  <input value={(partner as any)[field] || ''} onChange={e => setPartner({ ...partner, [field]: e.target.value })} style={inp} placeholder={field === 'whatsapp' ? '+66 XX XXX XXXX' : field === 'telegram' ? '@username' : ''} />
                </div>
              ))}
            </div>
          </div>

          {/* Реквизиты */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>🏦 Реквизиты и договор</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {([
                ['Комиссия %', 'commission_percent'],
                ['ИНН / Tax ID', 'tax_id'],
                ['Банк', 'bank_name'],
                ['Имя счёта', 'bank_account_name'],
                ['Номер счёта', 'bank_account_number'],
                ['Отделение банка', 'bank_branch'],
                ['SWIFT', 'swift_code'],
                ['Договор от', 'contract_valid_from'],
                ['Договор до', 'contract_valid_until'],
              ] as [string, string][]).map(([lbl, field]) => (
                <div key={field}>
                  {label(lbl)}
                  <input value={(partner as any)[field] || ''} type={field.includes('date') || field.includes('valid') ? 'date' : 'text'}
                    onChange={e => setPartner({ ...partner, [field]: e.target.value })} style={inp} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={savePartner} style={{ ...btn('var(--os-green)'), padding: '10px 24px', fontSize: 14 }}>💾 Сохранить все изменения</button>
        </div>
      )}

      {/* ── BOATS ── */}
      {activeTab === 'boats' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--os-text-2)' }}>Лодок: <strong style={{ color: 'var(--os-text-1)' }}>{boats.length}</strong></span>
            <button onClick={() => setEditingBoat({ active: true, boat_type: 'yacht' })} style={btn('var(--os-aqua)')}>+ Добавить лодку</button>
          </div>

          {editingBoat && (
            <div style={{ ...card, borderColor: 'var(--os-aqua)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>
                {editingBoat.id ? `✏️ Редактирование: ${editingBoat.name}` : '➕ Новая лодка'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {([
                  ['Название *', 'name', 'text'],
                  ['Код', 'code', 'text'],
                  ['Тип', 'boat_type', 'text'],
                  ['Модель', 'model', 'text'],
                  ['Длина (ft)', 'length_ft', 'number'],
                  ['Год постройки', 'year_built', 'number'],
                  ['Каюты', 'cabins', 'number'],
                  ['Туалеты', 'toilets', 'number'],
                  ['Макс. гостей (день)', 'max_pax_day', 'number'],
                  ['Макс. гостей (ночь)', 'max_pax_overnight', 'number'],
                  ['Скорость (узлы)', 'speed_knots', 'number'],
                  ['Причал', 'default_pier', 'text'],
                  ['Фото (URL)', 'main_photo_url', 'text'],
                  ['Галерея (URL)', 'photos_url', 'text'],
                ] as [string, string, string][]).map(([lbl, field, type]) => (
                  <div key={field}>
                    {label(lbl)}
                    <input value={(editingBoat as any)[field] || ''} type={type}
                      onChange={e => setEditingBoat({ ...editingBoat, [field]: type === 'number' ? Number(e.target.value) : e.target.value })}
                      style={inp} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  {label('Опции')}
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <input type="checkbox" checked={!!editingBoat.has_flybridge} onChange={e => setEditingBoat({ ...editingBoat, has_flybridge: e.target.checked })} />
                    Flybridge
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <input type="checkbox" checked={!!editingBoat.has_jacuzzi} onChange={e => setEditingBoat({ ...editingBoat, has_jacuzzi: e.target.checked })} />
                    Jacuzzi
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <input type="checkbox" checked={!!editingBoat.active} onChange={e => setEditingBoat({ ...editingBoat, active: e.target.checked })} />
                    Активна
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                {label('Заметки о лодке')}
                <textarea value={editingBoat.notes || ''} onChange={e => setEditingBoat({ ...editingBoat, notes: e.target.value })}
                  rows={2} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={saveBoat} style={btn('var(--os-green)')}>💾 Сохранить</button>
                <button onClick={() => setEditingBoat(null)} style={btn('#666')}>Отмена</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {boats.map(boat => (
              <div key={boat.id} style={{
                backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
                borderRadius: 10, overflow: 'hidden', opacity: boat.active ? 1 : 0.55,
                transition: 'opacity 0.2s',
              }}>
                {boat.main_photo_url
                  ? <img src={boat.main_photo_url} alt={boat.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: 150, backgroundColor: 'var(--os-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'var(--os-text-3)' }}>⛵</div>
                }
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{boat.name}</div>
                      {boat.code && <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{boat.code}</div>}
                    </div>
                    {!boat.active && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, backgroundColor: 'rgba(255,60,60,0.15)', color: 'var(--os-red)' }}>неактивна</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 8 }}>
                    {boat.boat_type}{boat.model ? ` · ${boat.model}` : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, fontSize: 12 }}>
                    {boat.length_ft > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--os-surface)', color: 'var(--os-text-2)' }}>📏 {boat.length_ft}ft</span>}
                    {boat.max_pax_day > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--os-surface)', color: 'var(--os-text-2)' }}>👥 {boat.max_pax_day}</span>}
                    {boat.cabins > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--os-surface)', color: 'var(--os-text-2)' }}>🛏 {boat.cabins}</span>}
                    {boat.has_flybridge && <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(0,212,180,0.1)', color: 'var(--os-aqua)' }}>Flybridge</span>}
                    {boat.has_jacuzzi && <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(0,212,180,0.1)', color: 'var(--os-aqua)' }}>Jacuzzi</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSelectedBoat({ id: boat.id, name: boat.name })}
                      style={{ ...btn('var(--os-aqua)'), flex: 1 }}>⚙️ Маршруты и цены</button>
                    <button onClick={() => setEditingBoat(boat)} style={btn('#555')}>✏️</button>
                    <button onClick={() => toggleBoatActive(boat)}
                      style={btn(boat.active ? '#f59e0b' : 'var(--os-green)')}>
                      {boat.active ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {boats.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--os-text-3)', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⛵</div>
              Нет лодок. Добавьте первую или используйте AI-парсер.
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div>
          {calMsg && <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13,
            backgroundColor: calMsg.startsWith('✅') ? 'rgba(0,212,180,0.1)' : 'rgba(255,60,60,0.1)',
            color: calMsg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)',
          }}>{calMsg}</div>}

          {/* Выбор лодки */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>🚢 Выберите лодку</div>
            <select value={calBoatId} onChange={e => { setCalBoatId(Number(e.target.value)); loadCalendarData(Number(e.target.value)); }}
              style={{ ...inp, maxWidth: 320 }}>
              <option value="">-- выберите лодку --</option>
              {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {calBoatId !== '' && (
            <>
              {/* iCal ссылка */}
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>🔗 iCal / Google Calendar</div>
                {boatCalendars.length > 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    {boatCalendars.map(bc => (
                      <div key={bc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        backgroundColor: 'var(--os-surface)', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--os-aqua)' }}>{bc.ical_url}</span>
                        {bc.last_synced && <span style={{ color: 'var(--os-text-3)', whiteSpace: 'nowrap' }}>
                          🕐 {new Date(bc.last_synced).toLocaleDateString('ru')}
                        </span>}
                        <button onClick={() => syncIcal(bc.boat_id)} style={btn('var(--os-aqua)')}>🔄 Sync</button>
                        <button onClick={async () => {
                          if (!confirm('Удалить календарь и все синхронизированные даты?')) return;
                          const token = getToken();
                          await fetch('/api/calendar/boats', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-session-token': token }, body: JSON.stringify({ id: bc.id }) });
                          await fetch('/api/calendar/unavailable', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-session-token': token }, body: JSON.stringify({ boat_id: bc.boat_id, source: 'all_synced' }) });
                          loadCalendarData();
                        }} style={btn('#ef4444')}>🗑</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--os-text-3)', marginBottom: 12 }}>iCal ссылка не добавлена</p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={icalForm.ical_url} onChange={e => setIcalForm({ ...icalForm, ical_url: e.target.value, boat_id: String(calBoatId) })}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    style={{ ...inp, flex: 1 }} />
                  <button onClick={saveIcalLink} style={btn('var(--os-green)')}>💾 Сохранить</button>
                </div>
              </div>

              {/* Ручной ввод */}
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>✏️ Добавить занятые даты вручную</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, alignItems: 'flex-end' }}>
                  <div>
                    {label('Дата от')}
                    <input type="date" value={manualForm.date_from} onChange={e => setManualForm({ ...manualForm, date_from: e.target.value })} style={inp} />
                  </div>
                  <div>
                    {label('Дата до')}
                    <input type="date" value={manualForm.date_to} onChange={e => setManualForm({ ...manualForm, date_to: e.target.value })} style={inp} />
                  </div>
                  <div>
                    {label('Название / причина')}
                    <input value={manualForm.title} onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                      placeholder="Например: Бронирование Ивановых" style={inp} />
                  </div>
                  <button onClick={addManualDate} style={{ ...btn('var(--os-green)'), height: 36 }}>+ Добавить</button>
                </div>
              </div>

              {/* Список занятых дат */}
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>
                  📋 Занятые даты ({unavailDates.length}) {calLoading && <span style={{ fontSize: 12, color: 'var(--os-text-3)' }}>загрузка...</span>}
                  {unavailDates.some(d => ['ical','teamup','url_import'].includes(d.source)) && (
                    <button onClick={async () => {
                      if (!confirm('Удалить все синхронизированные даты (ical/teamup)?')) return;
                      const token = getToken();
                      await fetch('/api/calendar/unavailable', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json', 'x-session-token': token },
                        body: JSON.stringify({ boat_id: calBoatId, source: 'all_synced' }),
                      });
                      loadCalendarData();
                    }} style={{ ...btn('#ef4444'), marginLeft: 8, fontSize: 11 }}>🗑 Очистить синхр.</button>
                  )}
                </div>
                {unavailDates.length === 0
                  ? <div style={{ color: 'var(--os-text-3)', fontSize: 13, padding: '12px 0' }}>Нет занятых дат</div>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {unavailDates.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                          backgroundColor: 'var(--os-surface)', borderRadius: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: 'var(--os-red)' }}>
                            {d.date_from} → {d.date_to}
                          </span>
                          <span style={{ flex: 1, color: 'var(--os-text-2)' }}>{d.title || '—'}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8,
                            backgroundColor: d.source === 'ical' ? 'rgba(0,212,180,0.1)' : 'rgba(255,180,0,0.1)',
                            color: d.source === 'ical' ? 'var(--os-aqua)' : '#f59e0b' }}>
                            {d.source}
                          </span>
                          <button onClick={() => deleteUnavailDate(d.id)} style={btn('#c0392b')}>🗑</button>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CONTRACT ── */}
      {activeTab === 'contract' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>🤖 AI-парсер контракта</div>
            <p style={{ fontSize: 13, color: 'var(--os-text-3)', marginBottom: 16 }}>
              Партнёр <strong style={{ color: 'var(--os-text-1)' }}>{partnerName}</strong> будет предвыбран автоматически.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`/import?partner_id=${partnerId}`}
                style={{ ...btn('var(--os-aqua)'), textDecoration: 'none', display: 'inline-block' }}>
                🤖 AI-парсер яхт
              </a>
              <a href={`/import-all?partner_id=${partnerId}`}
                style={{ ...btn('#555'), textDecoration: 'none', display: 'inline-block' }}>
                📦 Импорт меню / водных развлечений
              </a>
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 История импорта</div>
          {history.length === 0
            ? <div style={{ color: 'var(--os-text-3)', fontSize: 13 }}>История пуста.</div>
            : history.map(h => (
              <div key={h.id} style={{ ...card, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    backgroundColor: h.status === 'success' ? 'rgba(0,212,180,0.15)' : 'rgba(255,60,60,0.15)',
                    color: h.status === 'success' ? 'var(--os-green)' : 'var(--os-red)' }}>
                    {h.status === 'success' ? '✅ Успешно' : '❌ Ошибка'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{h.import_type}</span>
                  <span style={{ fontSize: 11, color: 'var(--os-text-3)', marginLeft: 'auto' }}>
                    {new Date(h.created_at).toLocaleString('ru')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  {h.boats_added > 0 && <span>⛵ Лодок: <strong>{h.boats_added}</strong></span>}
                  {h.routes_added > 0 && <span>🗺 Маршрутов: <strong>{h.routes_added}</strong></span>}
                  {h.boat_names && <span style={{ color: 'var(--os-text-3)' }}>{h.boat_names}</span>}
                </div>
                {h.notes && <div style={{ fontSize: 12, color: 'var(--os-text-2)', marginTop: 6 }}>{h.notes}</div>}
                {h.error_message && <div style={{ fontSize: 12, color: 'var(--os-red)', marginTop: 6 }}>❌ {h.error_message}</div>}
              </div>
            ))
          }
        </div>
      )}

      {/* ── NOTES ── */}
      {activeTab === 'notes' && partner && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-aqua)' }}>📝 Внутренние заметки</div>
            <p style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 12 }}>
              Заметки видны только сотрудникам. Не отображаются клиентам и агентам.
            </p>
            <textarea value={partner.notes || ''} onChange={e => setPartner({ ...partner, notes: e.target.value })}
              rows={12} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              placeholder="Особые условия, контакты, договорённости, история общения..." />
            <div style={{ marginTop: 12 }}>
              <button onClick={savePartner} style={{ ...btn('var(--os-green)'), padding: '10px 24px', fontSize: 14 }}>💾 Сохранить заметки</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
