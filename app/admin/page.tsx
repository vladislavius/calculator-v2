'use client';
import { useState } from 'react';
import PartnersTab  from './components/PartnersTab';
import BoatsTab     from './components/BoatsTab';
import UsersTab     from './components/UsersTab';
import StatsTab     from './components/StatsTab';
import OptionsTab   from './components/OptionsTab';
import CalendarTab  from './components/CalendarTab';
import ProductsTab  from './components/ProductsTab';

const TABS = [
  { id: 'partners', label: '🤝 Партнёры' },
  { id: 'products', label: '📦 Продукты' },
  { id: 'boats',    label: '⛵ Лодки' },
  { id: 'options',  label: '⚙️ Опции' },
  { id: 'users',    label: '👥 Пользователи' },
  { id: 'stats',    label: '📊 Статистика' },
  { id: 'calendar', label: '📅 Календари' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('partners');

  return (
    <div style={{minHeight: '100vh', backgroundColor: 'var(--os-bg)', padding: '24px'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        {/* Header */}
        <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
          <div>
            <h1 style={{fontSize: '20px', fontWeight: '800', color: 'var(--os-text-1)'}}>⚙️ Управление партнёрами</h1>
            <p style={{color: 'var(--os-text-3)', marginTop: '4px', fontSize: '13px'}}>Партнёры, лодки, цены и опции</p>
          </div>
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            <a href="/import" style={{padding:'8px 16px',backgroundColor:'var(--os-surface)',borderRadius:'8px',color:'var(--os-text-1)',textDecoration:'none',fontWeight:'500',border:'1px solid var(--os-border)',fontSize:'13px'}}>🤖 AI-парсер яхт</a>
            <a href="/import-all" style={{padding:'8px 16px',backgroundColor:'var(--os-surface)',borderRadius:'8px',color:'var(--os-text-1)',textDecoration:'none',fontWeight:'500',border:'1px solid var(--os-border)',fontSize:'13px'}}>📦 Центр импорта</a>
            <a href="/" style={{padding:'8px 16px',backgroundColor:'var(--os-surface)',borderRadius:'8px',color:'var(--os-text-1)',textDecoration:'none',fontWeight:'500',border:'1px solid var(--os-border)',fontSize:'13px'}}>← Калькулятор</a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px',
              border: '1px solid ' + (tab === t.id ? 'var(--os-aqua)' : 'var(--os-border)'),
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              backgroundColor: tab === t.id ? 'var(--os-aqua-glow)' : 'var(--os-surface)',
              color: tab === t.id ? 'var(--os-aqua)' : 'var(--os-text-2)',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{backgroundColor: 'var(--os-card)', borderRadius: '12px', border: '1px solid var(--os-border)', padding: '20px'}}>
          {tab === 'partners' && <PartnersTab />}
          {tab === 'products' && <ProductsTab />}
          {tab === 'calendar' && <CalendarTab />}
          {tab === 'boats'    && <BoatsTab />}
          {tab === 'options'  && <OptionsTab />}
          {tab === 'users'    && <UsersTab />}
          {tab === 'stats'    && <StatsTab />}
        </div>
      </div>
    </div>
  );
}
