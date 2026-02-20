'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminGuard from '../components/AdminGuard';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UnavailableDate { date_from: string; date_to: string; title: string; source: string; }
interface BoatAvailability { id: number; name: string; partner_name: string; unavailable: UnavailableDate[]; has_calendar: boolean; }

function getNextNDays(fromDate?: Date, n: number = 7): Date[] {
  const days = [];
  const start = fromDate || new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isDateUnavailable(date: Date, unavailable: UnavailableDate[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return unavailable.some(u => dateStr >= u.date_from && dateStr <= u.date_to);
}

function getUnavailableTitle(date: Date, unavailable: UnavailableDate[]): string {
  const dateStr = date.toISOString().split('T')[0];
  const found = unavailable.find(u => dateStr >= u.date_from && dateStr <= u.date_to);
  return found?.title || '';
}

const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

export default function CalendarPage() {
  const [boats, setBoats] = useState<BoatAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Вс, 1=Пн...
    const diff = day === 0 ? -6 : 1 - day; // сдвиг до понедельника
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [partners, setPartners] = useState<{id: number, name: string}[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [selectedBoat, setSelectedBoat] = useState<BoatAvailability | null>(null);
  const [monthDate, setMonthDate] = useState(new Date());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Загружаем лодки
      const { data: boatsData } = await sb.from('boats')
        .select('id, name, partner_id, partners(name)')
        .eq('active', true)
        .order('name');

      // Загружаем все занятые даты
      const today = new Date();
      const monthLater = new Date(today);
      monthLater.setMonth(monthLater.getMonth() + 3);

      const { data: unavailData } = await sb.from('boat_unavailable_dates')
        .select('boat_id, date_from, date_to, title, source')
        .gte('date_to', today.toISOString().split('T')[0])
        .lte('date_from', monthLater.toISOString().split('T')[0]);

      // Загружаем какие лодки имеют календарь
      const { data: calData } = await sb.from('boat_calendars')
        .select('boat_id').eq('active', true);

      const calBoatIds = new Set((calData || []).map((c: any) => c.boat_id));

      const boatList: BoatAvailability[] = (boatsData || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        partner_name: b.partners?.name || '',
        unavailable: (unavailData || []).filter((u: any) => u.boat_id === b.id),
        has_calendar: calBoatIds.has(b.id)
      }));

      // Партнёры для фильтра
      const partnerMap = new Map<number, string>();
      (boatsData || []).forEach((b: any) => {
        if (b.partner_id && b.partners?.name) partnerMap.set(b.partner_id, b.partners.name);
      });
      setPartners(Array.from(partnerMap.entries()).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name)));

      setBoats(boatList);
    } finally {
      setLoading(false);
    }
  }

  const viewDays = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 90;
  const days = getNextNDays(weekStart, viewDays);
  
  const filteredBoats = boats.filter(b => {
    const matchName = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPartner = !filterPartner || b.partner_name === filterPartner;
    return matchName && matchPartner;
  });

  // Месячный календарь для выбранной лодки
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function renderMonthCalendar(boat: BoatAvailability) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayRaw = new Date(year, month, 1).getDay();
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // Пн=0, Вс=6
    const today = new Date().toISOString().split('T')[0];

    const cells = [];
    // Пустые ячейки до первого дня
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth()-1); setMonthDate(d); }}
            style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-text-1)', padding: '4px 12px', cursor: 'pointer' }}>‹</button>
          <span style={{ fontWeight: 600, color: 'var(--os-text-1)' }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth()+1); setMonthDate(d); }}
            style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-text-1)', padding: '4px 12px', cursor: 'pointer' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--os-text-3)', padding: '4px 0', fontWeight: 600 }}>{d}</div>
          ))}
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const unavail = boat.unavailable.some(u => dateStr >= u.date_from && dateStr <= u.date_to);
            const isToday = dateStr === today;
            const isPast = dateStr < today;
            return (
              <div key={day} title={unavail ? getUnavailableTitle(new Date(dateStr), boat.unavailable) : 'Свободно'}
                style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: 4, fontSize: 12,
                  backgroundColor: isPast ? 'transparent' : unavail ? 'rgba(239,68,68,0.25)' : boat.has_calendar ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                  color: isPast ? 'var(--os-text-3)' : unavail ? '#f87171' : boat.has_calendar ? '#4ade80' : 'rgba(255,255,255,0.2)',
                  border: isToday ? '1px solid var(--os-aqua)' : '1px solid transparent',
                  fontWeight: isToday ? 700 : 400,
                  cursor: 'default'
                }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <>
        {/* Шапка */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--os-card)', borderBottom: '1px solid var(--os-border)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'var(--os-aqua)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>🔍 Поиск</a>
          
          <span style={{ color: 'var(--os-text-1)', fontSize: 14, fontWeight: 700 }}>📅 Календарь доступности</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <a href="/admin#calendar" style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-text-2)', padding: '4px 12px', fontSize: 12, textDecoration: 'none' }}>⚙️ Управление</a>
            <button onClick={loadData} style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-aqua)', padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>🔄 Обновить</button>
          </div>
        </div>

        <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>
          {/* Фильтры */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="🔍 Поиск лодки..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', background: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13, width: 200 }}
            />
            <select value={filterPartner} onChange={e => setFilterPartner(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--os-border)', background: 'var(--os-surface)', color: 'var(--os-text-1)', fontSize: 13 }}>
              <option value="">Все партнёры</option>
              {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {(['day','week','month','quarter'] as const).map(mode => {
                const labels = { day: '1 день', week: '7 дней', month: 'Месяц', quarter: '3 месяца' };
                return (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--os-border)', background: viewMode === mode ? 'var(--os-aqua)' : 'var(--os-surface)', color: viewMode === mode ? '#000' : 'var(--os-text-1)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Навигация по неделе */}
          {viewMode === 'week' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - viewDays); setWeekStart(d); }}
                style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-text-1)', padding: '4px 14px', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <span style={{ color: 'var(--os-text-2)', fontSize: 13 }}>
                {days[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — {days[days.length-1].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + viewDays); setWeekStart(d); }}
                style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-text-1)', padding: '4px 14px', cursor: 'pointer', fontSize: 16 }}>›</button>
              <button onClick={() => {
                  const d = new Date();
                  const day = d.getDay();
                  const diff = day === 0 ? -6 : 1 - day;
                  d.setDate(d.getDate() + diff);
                  d.setHours(0,0,0,0);
                  setWeekStart(d);
                }}
                style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 6, color: 'var(--os-aqua)', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Сегодня</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--os-text-3)' }}>Загрузка...</div>
          ) : (
            <>
              {/* Легенда */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'rgba(34,197,94,0.4)', display: 'inline-block' }} />
                  <span style={{ color: 'var(--os-text-2)' }}>Свободна</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.4)', display: 'inline-block' }} />
                  <span style={{ color: 'var(--os-text-2)' }}>Занята</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'var(--os-surface)', border: '1px solid var(--os-border)', display: 'inline-block' }} />
                  <span style={{ color: 'var(--os-text-2)' }}>Нет данных</span>
                </span>
              </div>

              {/* Таблица лодок */}
              {(viewMode === 'day' || viewMode === 'week' || viewMode === 'month' || viewMode === 'quarter') && viewMode !== 'month' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--os-text-2)', borderBottom: '1px solid var(--os-border)', minWidth: 200 }}>Лодка</th>
                        {days.map(d => (
                          <th key={d.toISOString()} style={{ padding: '8px 6px', color: d.toDateString() === new Date().toDateString() ? 'var(--os-aqua)' : 'var(--os-text-2)', borderBottom: '1px solid var(--os-border)', textAlign: 'center', minWidth: 52 }}>
                            <div style={{ fontSize: 10 }}>{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]}</div>
                            <div style={{ fontSize: 13, fontWeight: d.toDateString() === new Date().toDateString() ? 700 : 400 }}>{d.getDate()}</div>
                          </th>
                        ))}
                        <th style={{ padding: '8px 12px', color: 'var(--os-text-3)', borderBottom: '1px solid var(--os-border)', fontSize: 11 }}>Источник</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBoats.map(boat => (
                        <tr key={boat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                          onClick={() => { setSelectedBoat(boat); setViewMode('month'); setMonthDate(new Date()); }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 500, color: 'var(--os-text-1)' }}>{boat.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{boat.partner_name}</div>
                          </td>
                          {days.map(d => {
                            const unavail = isDateUnavailable(d, boat.unavailable);
                            const noData = !boat.has_calendar;
                            const title = getUnavailableTitle(d, boat.unavailable);
                            return (
                              <td key={d.toISOString()} title={unavail ? title : noData ? 'Нет календаря' : 'Свободна'}
                                style={{ padding: '6px', textAlign: 'center' }}>
                                <div style={{
                                  width: 36, height: 28, borderRadius: 4, margin: '0 auto',
                                  backgroundColor: noData ? 'rgba(255,255,255,0.03)' : unavail ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)',
                                  border: noData ? '1px dashed rgba(255,255,255,0.1)' : unavail ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(34,197,94,0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                                  color: noData ? 'rgba(255,255,255,0.2)' : unavail ? '#f87171' : '#4ade80'
                                }}>
                                  {noData ? '?' : unavail ? '✗' : '✓'}
                                </div>
                              </td>
                            );
                          })}
                          <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--os-text-3)' }}>
                            {boat.has_calendar ? '📅 iCal' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBoats.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--os-text-3)' }}>Лодки не найдены</div>
                  )}
                </div>
              )}

              {/* Месячный вид */}
              {(viewMode === 'month') && (
                <div>
                  {selectedBoat ? (
                    <div style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, padding: 20, maxWidth: 400 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--os-text-1)' }}>{selectedBoat.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--os-text-3)' }}>{selectedBoat.partner_name}</div>
                        </div>
                        <button onClick={() => { setSelectedBoat(null); setViewMode('week'); }}
                          style={{ background: 'none', border: 'none', color: 'var(--os-text-3)', cursor: 'pointer', fontSize: 20 }}>×</button>
                      </div>
                      {renderMonthCalendar(selectedBoat)}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {filteredBoats.map(boat => (
                        <div key={boat.id} style={{ backgroundColor: 'var(--os-card)', borderRadius: 12, padding: 16 }}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, color: 'var(--os-text-1)' }}>{boat.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--os-text-3)' }}>{boat.partner_name}</div>
                          </div>
                          {renderMonthCalendar(boat)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </>
    </AdminGuard>
  );
}
