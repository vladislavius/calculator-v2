'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';

export default function StatsTab() {
  const [counts, setCounts] = useState({ boats: 0, partners: 0, options: 0, activeBoats: 0 });
  const [topBoats, setTopBoats] = useState<{name:string; count:number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.from('boats').select('id, name, active', { count: 'exact' }),
      sb.from('partners').select('id', { count: 'exact' }),
      sb.from('boat_options').select('id', { count: 'exact' }),
      sb.from('boats').select('id, name, active').eq('active', true),
    ]).then(([boats, partners, opts, activeBoats]) => {
      setCounts({
        boats: boats.count || 0,
        partners: partners.count || 0,
        options: opts.count || 0,
        activeBoats: activeBoats.data?.length || 0,
      });
      setLoading(false);
    });
  }, []);

  const statCard = (label: string, value: number | string, color: string, icon: string) => (
    <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--os-text-3)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );

  if (loading) return <div style={{ color: 'var(--os-text-3)', padding: 20 }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCard('Всего лодок', counts.boats, 'var(--os-aqua)', '⛵')}
        {statCard('Активных лодок', counts.activeBoats, 'var(--os-green)', '✅')}
        {statCard('Партнёров', counts.partners, 'var(--os-purple)', '🤝')}
        {statCard('Опций в БД', counts.options, 'var(--os-gold)', '⚙️')}
      </div>

      <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--os-text-1)' }}>📊 Информация о базе данных</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            ['Supabase Project', 'jcidlaaqyehcohwzmwnz'],
            ['Таблицы', 'boats, partners, routes, route_prices, boat_options, options_catalog'],
            ['Лодок скрыто', String(counts.boats - counts.activeBoats)],
            ['Статус', '🟢 Online'],
          ].map(([k, v]) => (
            <div key={k} style={{ backgroundColor: 'var(--os-surface)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13, color: 'var(--os-text-1)', wordBreak: 'break-all' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
