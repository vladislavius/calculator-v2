'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';
import PartnerDetail from './PartnerDetail';

type Partner = {
  id: number; name: string; contact_name: string; contact_phone: string;
  contact_email: string; commission_percent: number;
  contract_valid_until: string; notes: string;
};

const btn = (color: string): React.CSSProperties => ({
  padding: '5px 14px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});
const inp: React.CSSProperties = {
  padding: '7px 12px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 6,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none',
};

export default function PartnersTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    sb.from('partners').select('id,name,contact_name,contact_phone,contact_email,commission_percent,contract_valid_until,notes')
      .order('name').then(({ data }) => {
        setPartners(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = partners.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const addPartner = async () => {
    if (!newName.trim()) return;
    const { data, error } = await sb.from('partners').insert({ name: newName.trim() }).select('id,name,contact_name,contact_phone,contact_email,commission_percent,contract_valid_until,notes').single();
    if (error) { setMsg('❌ ' + error.message); return; }
    setPartners(ps => [...ps, data]);
    setSelected({ id: data.id, name: data.name });
    setAdding(false);
    setNewName('');
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;

  if (selected) return (
    <PartnerDetail
      partnerId={selected.id}
      partnerName={selected.name}
      onBack={() => {
        setSelected(null);
        sb.from('partners').select('id,name,contact_name,contact_phone,contact_email,commission_percent,contract_valid_until,notes')
          .order('name').then(({ data }) => setPartners(data || []));
      }}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="🔍 Поиск партнёра..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, minWidth: 260 }} />
        <button onClick={() => setAdding(true)} style={btn('var(--os-aqua)')}>+ Добавить партнёра</button>
        {msg && <span style={{ fontSize: 13, color: 'var(--os-red)' }}>{msg}</span>}
      </div>

      {adding && (
        <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input placeholder="Название партнёра" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPartner()}
            style={{ ...inp, minWidth: 280 }} autoFocus />
          <button onClick={addPartner} style={btn('var(--os-green)')}>✅ Создать</button>
          <button onClick={() => { setAdding(false); setNewName(''); }} style={btn('#666')}>Отмена</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(p => {
          const expired = p.contract_valid_until && new Date(p.contract_valid_until) < new Date();
          const expiringSoon = p.contract_valid_until && !expired &&
            (new Date(p.contract_valid_until).getTime() - Date.now()) < 30 * 24 * 3600 * 1000;
          return (
            <div key={p.id} style={{
              backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
              borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
              onClick={() => setSelected({ id: p.id, name: p.name })}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--os-aqua)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--os-border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                {p.commission_percent && (
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, backgroundColor: 'rgba(0,212,180,0.1)', color: 'var(--os-aqua)' }}>
                    {p.commission_percent}%
                  </span>
                )}
              </div>
              {p.contact_name && <div style={{ fontSize: 12, color: 'var(--os-text-2)', marginBottom: 2 }}>👤 {p.contact_name}</div>}
              {p.contact_phone && <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 2 }}>📞 {p.contact_phone}</div>}
              {p.contract_valid_until && (
                <div style={{ fontSize: 11, marginTop: 8, padding: '3px 8px', borderRadius: 6, display: 'inline-block',
                  backgroundColor: expired ? 'rgba(255,60,60,0.1)' : expiringSoon ? 'rgba(245,158,11,0.1)' : 'rgba(0,212,180,0.08)',
                  color: expired ? 'var(--os-red)' : expiringSoon ? 'var(--os-gold)' : 'var(--os-text-3)' }}>
                  📄 Договор до: {p.contract_valid_until.slice(0, 10)}
                  {expired && ' ⚠️ Истёк'}
                  {expiringSoon && ' ⚠️ Скоро истекает'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginTop: 12 }}>Партнёров: {filtered.length}</div>
    </div>
  );
}
