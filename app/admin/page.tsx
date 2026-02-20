'use client';
import { useState } from 'react';
import PartnersTab  from './components/PartnersTab';
import BoatsTab     from './components/BoatsTab';
import UsersTab     from './components/UsersTab';
import StatsTab     from './components/StatsTab';
import OptionsTab   from './components/OptionsTab';
import CalendarTab  from './components/CalendarTab';

const TABS = [
  { id: 'partners', label: '🤝 Партнёры & Контракты' },
  { id: 'boats',    label: '⛵ Все лодки' },
  { id: 'options',  label: '⚙️ Опции' },
  { id: 'users',    label: '👥 Пользователи' },
  { id: 'stats',    label: '📊 Статистика' },
  { id: 'calendar', label: '📅 Календари' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('partners');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--os-bg)', color: 'var(--os-text-1)', fontFamily: 'var(--font-sans, sans-serif)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--os-card)', borderBottom: '1px solid var(--os-border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--os-aqua)', letterSpacing: '0.3px' }}>⚙️ ONLYSEA ADMIN</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/import" style={{ fontSize: 12, color: 'var(--os-text-3)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--os-border)', borderRadius: 4 }}>🤖 AI-парсер яхт</a>
          <a href="/import-all" style={{ fontSize: 12, color: 'var(--os-text-3)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--os-border)', borderRadius: 4 }}>📦 Центр импорта</a>
          <a href="/" style={{ fontSize: 12, color: 'var(--os-text-3)', textDecoration: 'none' }}>← На главную</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'var(--os-card)', borderBottom: '1px solid var(--os-border)', padding: '0 24px', display: 'flex', gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            backgroundColor: 'transparent',
            color: tab === t.id ? 'var(--os-aqua)' : 'var(--os-text-2)',
            borderBottom: tab === t.id ? '2px solid var(--os-aqua)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: 1300, margin: '0 auto' }}>
        {tab === 'partners' && <PartnersTab />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'boats'    && <BoatsTab />}
        {tab === 'options'  && <OptionsTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'stats'    && <StatsTab />}
      </div>
    </div>
  );
}
