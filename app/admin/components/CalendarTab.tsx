'use client';
import { useState, useEffect } from 'react';
import { supabase as sb } from '../../../lib/supabase';

interface BoatCalendar {
  id: number;
  boat_id: number;
  calendar_type: string;
  ical_url: string;
  last_synced: string;
  active: boolean;
  boats?: { name: string; partners?: { name: string } };
}

interface Boat { id: number; name: string; partner_name: string; }

export default function CalendarTab() {
  const [calendars, setCalendars] = useState<BoatCalendar[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [boatSearch, setBoatSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unavailDates, setUnavailDates] = useState<any[]>([]);
  const [selectedBoatForDates, setSelectedBoatForDates] = useState<{id: number, name: string} | null>(null);
  const [boatSearchDates, setBoatSearchDates] = useState('');
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [manualForm, setManualForm] = useState({ date_from: '', date_to: '', title: 'Занято' });
  const [importUrl, setImportUrl] = useState('');
  const [importReplace, setImportReplace] = useState(false);
  const [importingUrl, setImportingUrl] = useState(false);
  const [form, setForm] = useState({
    boat_id: 0,
    boat_name: '',
    calendar_type: 'ical',
    ical_url: '',
    active: true
  });

  useEffect(() => { loadData(); }, []);

  async function loadUnavailDates(boatId: number) {
    const { data } = await sb.from('boat_unavailable_dates')
      .select('*').eq('boat_id', boatId).order('date_from');
    setUnavailDates(data || []);
  }

  async function addManualDate() {
    if (!selectedBoatForDates || !manualForm.date_from || !manualForm.date_to) {
      setMsg('❌ Выберите лодку и укажите даты'); return;
    }
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    const r = await fetch('/api/calendar/unavailable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ ...manualForm, boat_id: selectedBoatForDates.id, source: 'manual' })
    });
    const data = await r.json();
    if (data.error) { setMsg('❌ ' + data.error); return; }
    setMsg('✅ Дата добавлена');
    setManualForm({ date_from: '', date_to: '', title: 'Занято' });
    loadUnavailDates(selectedBoatForDates.id);
  }

  async function deleteUnavailDate(id: number) {
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    await fetch('/api/calendar/unavailable', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ id })
    });
    if (selectedBoatForDates) loadUnavailDates(selectedBoatForDates.id);
  }

  async function importFromUrl() {
    if (!selectedBoatForDates || !importUrl) {
      setMsg('❌ Выберите лодку и укажите URL'); return;
    }
    setImportingUrl(true);
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    const r = await fetch('/api/calendar/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ boat_id: selectedBoatForDates.id, url: importUrl, replace: importReplace })
    });
    const data = await r.json();
    setImportingUrl(false);
    if (data.error) { setMsg('❌ ' + data.error); return; }
    setMsg(`✅ Импортировано ${data.imported} событий`);
    setImportUrl('');
    loadUnavailDates(selectedBoatForDates.id);
  }

  async function loadData() {
    setLoading(true);
    const [{ data: cals }, { data: boatsData }] = await Promise.all([
      sb.from('boat_calendars')
        .select('*, boats(name, partners(name))')
        .order('boat_id'),
      sb.from('boats')
        .select('id, name, partner_id, partners(name)')
        .eq('active', true)
        .order('name')
    ]);
    setCalendars(cals || []);
    setBoats((boatsData || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      partner_name: b.partners?.name || ''
    })));
    setLoading(false);
  }

  async function syncAll() {
    setSyncing(true);
    setSyncResult(null);
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    try {
      const r = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-token': token || '' },
        body: JSON.stringify({})
      });
      const data = await r.json();
      setSyncResult(data);
      loadData();
    } finally {
      setSyncing(false);
    }
  }

  async function syncOne(boatId: number) {
    setSyncing(true);
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    try {
      const r = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-token': token || '' },
        body: JSON.stringify({ boat_id: boatId })
      });
      const data = await r.json();
      setMsg(data.error ? `❌ ${data.error}` : `✅ Синхронизировано ${data.synced} календарей`);
      loadData();
    } finally {
      setSyncing(false);
    }
  }

  async function saveCalendar() {
    if (!form.boat_id || !form.ical_url) {
      setMsg('❌ Выберите лодку и укажите ссылку'); return;
    }
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    const r = await fetch('/api/calendar/boats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token || '' },
      body: JSON.stringify(form)
    });
    const data = await r.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg('✅ Календарь сохранён');
    setShowAdd(false);
    setForm({ boat_id: 0, boat_name: '', calendar_type: 'ical', ical_url: '', active: true });
    setBoatSearch('');
    loadData();
  }

  async function deleteCalendar(id: number) {
    if (!confirm('Удалить календарь?')) return;
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    await fetch('/api/calendar/boats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token || '' },
      body: JSON.stringify({ id })
    });
    setMsg('✅ Удалено');
    loadData();
  }

  const suggestions = boatSearch.length > 1
    ? boats.filter(b => b.name.toLowerCase().includes(boatSearch.toLowerCase()) ||
        b.partner_name.toLowerCase().includes(boatSearch.toLowerCase())).slice(0, 8)
    : [];

  const calBoatIds = new Set(calendars.map(c => c.boat_id));
  const boatsWithoutCalendar = boats.filter(b => !calBoatIds.has(b.id));

  return (
    <div style={{ padding: 20 }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--os-text-1)', margin: 0, fontSize: 20 }}>📅 Управление календарями</h2>
          <p style={{ color: 'var(--os-text-3)', fontSize: 13, marginTop: 4 }}>
            {calendars.length} лодок с календарём · {boatsWithoutCalendar.length} без календаря
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/calendar" target="_blank"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-aqua)', textDecoration: 'none', fontSize: 13 }}>
            👁 Открыть календарь
          </a>
          <button onClick={syncAll} disabled={syncing}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: syncing ? 'var(--os-surface)' : 'var(--os-aqua)', color: syncing ? 'var(--os-text-3)' : '#000', cursor: syncing ? 'default' : 'pointer', fontWeight: 600, fontSize: 13 }}>
            {syncing ? '⏳ Синхронизация...' : '🔄 Синхронизировать все'}
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--os-green)', color: '#000', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            + Добавить
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: msg.startsWith('✅') ? 'rgba(0,212,180,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'var(--os-aqua)' : '#ef4444'}`, color: msg.startsWith('✅') ? 'var(--os-aqua)' : '#f87171', marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Результат синхронизации */}
      {syncResult && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(0,212,180,0.08)', border: '1px solid var(--os-aqua)', marginBottom: 16, fontSize: 13 }}>
          <div style={{ color: 'var(--os-aqua)', fontWeight: 600, marginBottom: 4 }}>
            ✅ Синхронизировано: {syncResult.synced} из {syncResult.total} календарей
          </div>
          {syncResult.errors?.length > 0 && (
            <div style={{ color: '#f87171', marginTop: 4 }}>
              ❌ Ошибки: {syncResult.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Форма добавления */}
      {showAdd && (
        <div style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid var(--os-border)' }}>
          <h3 style={{ color: 'var(--os-text-1)', marginTop: 0, fontSize: 16 }}>Добавить календарь лодки</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Поиск лодки */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Лодка *</label>
              <input
                placeholder="Введите название лодки..."
                value={boatSearch}
                onChange={e => { setBoatSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, boxSizing: 'border-box' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                  {suggestions.map(b => (
                    <div key={b.id} onClick={() => { setForm(f => ({ ...f, boat_id: b.id, boat_name: b.name })); setBoatSearch(b.name); setShowSuggestions(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', color: 'var(--os-text-1)', fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--os-surface)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <div>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{b.partner_name}</div>
                    </div>
                  ))}
                </div>
              )}
              {form.boat_id > 0 && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--os-aqua)' }}>✓ ID: {form.boat_id}</div>
              )}
            </div>

            {/* Тип календаря */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Тип</label>
              <select value={form.calendar_type} onChange={e => setForm(f => ({ ...f, calendar_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13 }}>
                <option value="ical">📅 iCal (Google Calendar / TeamUp)</option>
                <option value="manual">✏️ Ручной ввод</option>
                <option value="sheets">📊 Google Sheets</option>
              </select>
            </div>

            {/* iCal URL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>iCal ссылка *</label>
              <input
                placeholder="https://calendar.google.com/calendar/ical/..."
                value={form.ical_url}
                onChange={e => setForm(f => ({ ...f, ical_url: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginTop: 4 }}>
                Google Calendar: Настройки → Интеграция календаря → Адрес в формате iCal
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} id="cal-active" />
              <label htmlFor="cal-active" style={{ color: 'var(--os-text-2)', fontSize: 13 }}>Активен</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={saveCalendar}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--os-aqua)', color: '#000', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              💾 Сохранить
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'transparent', color: 'var(--os-text-2)', cursor: 'pointer', fontSize: 13 }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Таблица календарей */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--os-text-3)' }}>Загрузка...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--os-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--os-surface)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>Лодка</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>Партнёр</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>Тип</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>iCal URL</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>Синхронизирован</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--os-text-2)', fontWeight: 600 }}>Статус</th>
                <th style={{ padding: '10px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {calendars.map(cal => (
                <tr key={cal.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--os-text-1)', fontWeight: 500 }}>
                    {(cal.boats as any)?.name || `boat_id: ${cal.boat_id}`}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--os-text-3)', fontSize: 12 }}>
                    {(cal.boats as any)?.partners?.name || '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--os-text-2)' }}>
                    {cal.calendar_type === 'ical' ? '📅 iCal' : cal.calendar_type === 'manual' ? '✏️ Ручной' : '📊 Sheets'}
                  </td>
                  <td style={{ padding: '10px 16px', maxWidth: 300 }}>
                    {cal.ical_url ? (
                      <a href={cal.ical_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--os-aqua)', textDecoration: 'none', fontSize: 11, wordBreak: 'break-all' }}>
                        {cal.ical_url.substring(0, 50)}...
                      </a>
                    ) : <span style={{ color: 'var(--os-text-3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--os-text-3)', fontSize: 12 }}>
                    {cal.last_synced ? new Date(cal.last_synced).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Никогда'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: cal.active ? 'rgba(0,212,180,0.15)' : 'rgba(239,68,68,0.15)', color: cal.active ? 'var(--os-aqua)' : '#f87171' }}>
                      {cal.active ? 'Активен' : 'Отключён'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => syncOne(cal.boat_id)} disabled={syncing}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--os-aqua)', backgroundColor: 'transparent', color: 'var(--os-aqua)', cursor: 'pointer', fontSize: 11 }}>
                        🔄
                      </button>
                      <button onClick={() => deleteCalendar(cal.id)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 11 }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {calendars.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--os-text-3)' }}>
                    Нет добавленных календарей. Нажмите + Добавить
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Лодки без календаря */}
      {boatsWithoutCalendar.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: 'var(--os-text-2)', fontSize: 14, marginBottom: 12 }}>
            ⚠️ Лодки без календаря ({boatsWithoutCalendar.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {boatsWithoutCalendar.slice(0, 30).map(b => (
              <button key={b.id} onClick={() => { setBoatSearch(b.name); setForm(f => ({ ...f, boat_id: b.id, boat_name: b.name })); setShowAdd(true); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px dashed var(--os-border)', backgroundColor: 'transparent', color: 'var(--os-text-3)', cursor: 'pointer', fontSize: 12 }}>
                {b.name}
              </button>
            ))}
            {boatsWithoutCalendar.length > 30 && (
              <span style={{ color: 'var(--os-text-3)', fontSize: 12, padding: '4px 0' }}>и ещё {boatsWithoutCalendar.length - 30}...</span>
            )}
          </div>
        </div>
      )}
    {/* ===== СЕКЦИЯ РУЧНОГО УПРАВЛЕНИЯ ДАТАМИ ===== */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--os-text-1)', margin: 0, fontSize: 16 }}>📆 Управление занятыми датами</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowManualForm(!showManualForm); setShowUrlImport(false); setShowApiDocs(false); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: showManualForm ? 'var(--os-aqua)' : 'var(--os-surface)', color: showManualForm ? '#000' : 'var(--os-text-1)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              ✏️ Ручной ввод
            </button>
            <button onClick={() => { setShowUrlImport(!showUrlImport); setShowManualForm(false); setShowApiDocs(false); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: showUrlImport ? 'var(--os-aqua)' : 'var(--os-surface)', color: showUrlImport ? '#000' : 'var(--os-text-1)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              🔗 По ссылке
            </button>
            <button onClick={() => { setShowApiDocs(!showApiDocs); setShowManualForm(false); setShowUrlImport(false); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: showApiDocs ? 'var(--os-aqua)' : 'var(--os-surface)', color: showApiDocs ? '#000' : 'var(--os-text-1)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              🔌 API
            </button>
          </div>
        </div>

        {/* Выбор лодки для дат */}
        {(showManualForm || showUrlImport) && (
          <div style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid var(--os-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Поиск лодки */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Лодка *</label>
                <input
                  placeholder="Введите название лодки..."
                  value={boatSearchDates}
                  onChange={e => { setBoatSearchDates(e.target.value); setShowDateSuggestions(true); }}
                  onFocus={() => setShowDateSuggestions(true)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, boxSizing: 'border-box' }}
                />
                {showDateSuggestions && boatSearchDates.length > 1 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                    {boats.filter(b => b.name.toLowerCase().includes(boatSearchDates.toLowerCase()) || b.partner_name.toLowerCase().includes(boatSearchDates.toLowerCase())).slice(0, 8).map(b => (
                      <div key={b.id} onClick={() => {
                        setSelectedBoatForDates({ id: b.id, name: b.name });
                        setBoatSearchDates(b.name);
                        setShowDateSuggestions(false);
                        loadUnavailDates(b.id);
                      }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--os-border)', color: 'var(--os-text-1)', fontSize: 13 }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--os-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <div>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{b.partner_name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedBoatForDates && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--os-aqua)' }}>✓ {selectedBoatForDates.name}</div>
                )}
              </div>

              {/* Ручной ввод дат */}
              {showManualForm && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Название события</label>
                  <input value={manualForm.title} onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {showManualForm && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginTop: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Дата от *</label>
                  <input type="date" value={manualForm.date_from} onChange={e => setManualForm(f => ({ ...f, date_from: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, colorScheme: 'dark', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>Дата до *</label>
                  <input type="date" value={manualForm.date_to} onChange={e => setManualForm(f => ({ ...f, date_to: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, colorScheme: 'dark', boxSizing: 'border-box' }} />
                </div>
                <button onClick={addManualDate}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--os-aqua)', color: '#000', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                  + Добавить
                </button>
              </div>
            )}

            {/* Импорт по URL */}
            {showUrlImport && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--os-text-3)', marginBottom: 4 }}>URL файла (.ics или JSON) *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="https://calendar.google.com/...basic.ics" value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', backgroundColor: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13 }} />
                  <button onClick={importFromUrl} disabled={importingUrl}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: importingUrl ? 'var(--os-surface)' : 'var(--os-aqua)', color: importingUrl ? 'var(--os-text-3)' : '#000', cursor: importingUrl ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {importingUrl ? '⏳ Загрузка...' : '📥 Импорт'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input type="checkbox" checked={importReplace} onChange={e => setImportReplace(e.target.checked)} id="replace-check" />
                  <label htmlFor="replace-check" style={{ fontSize: 12, color: 'var(--os-text-3)' }}>Заменить существующие данные из URL</label>
                </div>
                <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginTop: 4 }}>
                  Поддерживаются: iCal (.ics) от Google Calendar, TeamUp, Airbnb и JSON массив
                </div>
              </div>
            )}

            {/* Список занятых дат выбранной лодки */}
            {selectedBoatForDates && unavailDates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 8 }}>Занятые даты: {unavailDates.length}</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--os-surface)' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--os-text-3)' }}>От</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--os-text-3)' }}>До</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--os-text-3)' }}>Название</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--os-text-3)' }}>Источник</th>
                        <th style={{ padding: '6px 10px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unavailDates.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: 'var(--os-text-1)' }}>{d.date_from}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--os-text-1)' }}>{d.date_to}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--os-text-2)' }}>{d.title}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: d.source === 'manual' ? 'rgba(139,92,246,0.2)' : d.source === 'ical' ? 'rgba(0,212,180,0.2)' : 'rgba(251,191,36,0.2)', color: d.source === 'manual' ? '#a78bfa' : d.source === 'ical' ? 'var(--os-aqua)' : '#fbbf24' }}>
                              {d.source === 'manual' ? '✏️ Ручной' : d.source === 'ical' ? '📅 iCal' : '🔗 URL'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <button onClick={() => deleteUnavailDate(d.id)}
                              style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 11 }}>
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {selectedBoatForDates && unavailDates.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--os-text-3)' }}>Нет занятых дат для {selectedBoatForDates.name}</div>
            )}
          </div>
        )}

        {/* API Документация */}
        {showApiDocs && (
          <div style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, padding: 20, border: '1px solid var(--os-border)' }}>
            <h4 style={{ color: 'var(--os-aqua)', marginTop: 0, fontSize: 14 }}>🔌 REST API для управления занятыми датами</h4>
            <p style={{ color: 'var(--os-text-3)', fontSize: 12, marginBottom: 16 }}>
              Используйте этот API для интеграции с внешними системами бронирования.
              Добавьте <code style={{ backgroundColor: 'var(--os-surface)', padding: '1px 6px', borderRadius: 3 }}>CALENDAR_API_TOKEN</code> в .env.local
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* GET */}
              <div style={{ backgroundColor: 'var(--os-surface)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: 11, fontWeight: 700 }}>GET</span>
                  <code style={{ color: 'var(--os-aqua)', fontSize: 12 }}>/api/calendar/unavailable?boat_id=41</code>
                </div>
                <p style={{ color: 'var(--os-text-3)', fontSize: 12, margin: 0 }}>Получить все занятые даты лодки</p>
              </div>

              {/* POST */}
              <div style={{ backgroundColor: 'var(--os-surface)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>POST</span>
                  <code style={{ color: 'var(--os-aqua)', fontSize: 12 }}>/api/calendar/unavailable</code>
                </div>
                <pre style={{ color: 'var(--os-text-2)', fontSize: 11, margin: 0, overflowX: 'auto' }}>{`Headers:
  x-api-token: YOUR_CALENDAR_API_TOKEN

Body:
{
  "boat_id": 41,
  "date_from": "2026-03-01",
  "date_to": "2026-03-05",
  "title": "Бронирование #123"
}`}</pre>
              </div>

              {/* POST import-url */}
              <div style={{ backgroundColor: 'var(--os-surface)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>POST</span>
                  <code style={{ color: 'var(--os-aqua)', fontSize: 12 }}>/api/calendar/import-url</code>
                </div>
                <pre style={{ color: 'var(--os-text-2)', fontSize: 11, margin: 0, overflowX: 'auto' }}>{`Headers:
  x-api-token: YOUR_CALENDAR_API_TOKEN

Body:
{
  "boat_id": 41,
  "url": "https://calendar.google.com/...basic.ics",
  "replace": true
}`}</pre>
              </div>

              {/* DELETE */}
              <div style={{ backgroundColor: 'var(--os-surface)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, fontWeight: 700 }}>DELETE</span>
                  <code style={{ color: 'var(--os-aqua)', fontSize: 12 }}>/api/calendar/unavailable</code>
                </div>
                <pre style={{ color: 'var(--os-text-2)', fontSize: 11, margin: 0 }}>{`Body: { "id": 123 }`}</pre>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)' }}>
              <div style={{ fontSize: 12, color: '#fbbf24' }}>
                ⚠️ Добавьте в .env.local:<br/>
                <code>CALENDAR_API_TOKEN=your_secret_token_here</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MANUAL DATES SECTION — добавляется внизу компонента ============
