'use client';
import { useEffect, useState } from 'react';
import { supabase as sb } from '../../../lib/supabase';

type Partner = {
  id: number; name: string; contact_name: string; contact_phone: string;
  contact_email: string; commission_percent: number; website: string;
  contract_valid_from: string; contract_valid_until: string;
  bank_name: string; bank_account_number: string; swift_code: string; notes: string;
};
type Boat = { id: number; name: string; boat_type: string; model: string; active: boolean; main_photo_url: string };
type ImportRecord = {
  id: number; created_at: string; import_type: string;
  boats_added: number; routes_added: number; status: string;
  notes: string; error_message: string; boat_names: string;
};

const inp: React.CSSProperties = {
  padding: '6px 10px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 4,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none', width: '100%',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 14px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: '#fff',
});

export default function PartnerDetail({ partnerId, partnerName, onBack }: {
  partnerId: number; partnerName: string; onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'boats' | 'contract' | 'info'>('boats');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editingBoat, setEditingBoat] = useState<Partial<Boat & { partner_id: number }> | null>(null);

  useEffect(() => {
    Promise.all([
      sb.from('partners').select('*').eq('id', partnerId).single(),
      sb.from('boats').select('id,name,boat_type,model,active,main_photo_url').eq('partner_id', partnerId).order('name'),
      sb.from('import_history').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }),
    ]).then(([p, b, h]) => {
      setPartner(p.data);
      setBoats(b.data || []);
      setHistory(h.data || []);
      setLoading(false);
    });
  }, [partnerId]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const savePartner = async () => {
    if (!partner) return;
    const { error } = await sb.from('partners').update(partner).eq('id', partnerId);
    flash(error ? '❌ ' + error.message : '✅ Сохранено');
  };

  const saveBoat = async () => {
    if (!editingBoat) return;
    const { id, ...fields } = editingBoat;
    const payload = { ...fields, partner_id: partnerId };
    const { error } = id
      ? await sb.from('boats').update(payload).eq('id', id)
      : await sb.from('boats').insert(payload);
    if (error) { flash('❌ ' + error.message); return; }
    flash('✅ Сохранено');
    const { data } = await sb.from('boats').select('id,name,boat_type,model,active,main_photo_url').eq('partner_id', partnerId).order('name');
    setBoats(data || []);
    setEditingBoat(null);
  };

  const toggleBoatActive = async (boat: Boat) => {
    await sb.from('boats').update({ active: !boat.active }).eq('id', boat.id);
    setBoats(bs => bs.map(b => b.id === boat.id ? { ...b, active: !b.active } : b));
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;
  if (selectedBoat) return <BoatDetail boatId={selectedBoat.id} boatName={selectedBoat.name} onBack={() => setSelectedBoat(null)} />;

  const SUBTABS = [
    { id: 'boats', label: `⛵ Лодки (${boats.length})` },
    { id: 'contract', label: `📄 Контракты & Импорт (${history.length})` },
    { id: 'info', label: '📋 Реквизиты' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--os-aqua)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Все партнёры</button>
        <span style={{ color: 'var(--os-text-3)' }}>/</span>
        <span style={{ fontWeight: 700 }}>{partnerName}</span>
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

      {/* BOATS */}
      {activeTab === 'boats' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setEditingBoat({ active: true, boat_type: 'catamaran' })} style={btn('var(--os-aqua)')}>+ Добавить лодку</button>
          </div>

          {editingBoat && (
            <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>
                {editingBoat.id ? `✏️ ${editingBoat.name}` : '➕ Новая лодка'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {([
                  ['Название', 'name', 'text'], ['Тип', 'boat_type', 'text'], ['Модель', 'model', 'text'],
                  ['Фото (URL)', 'main_photo_url', 'text'],
                ] as [string, string, string][]).map(([label, field, type]) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                    <input value={(editingBoat as any)[field] || ''} type={type}
                      onChange={e => setEditingBoat({ ...editingBoat, [field]: e.target.value })} style={inp} />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                  <input type="checkbox" checked={!!editingBoat.active} onChange={e => setEditingBoat({ ...editingBoat, active: e.target.checked })} />
                  <label style={{ fontSize: 13 }}>Активна</label>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={saveBoat} style={btn('var(--os-green)')}>💾 Сохранить</button>
                <button onClick={() => setEditingBoat(null)} style={btn('#666')}>Отмена</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {boats.map(boat => (
              <div key={boat.id} style={{
                backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
                borderRadius: 10, overflow: 'hidden', opacity: boat.active ? 1 : 0.6,
              }}>
                {boat.main_photo_url
                  ? <img src={boat.main_photo_url} alt={boat.name} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: 130, backgroundColor: 'var(--os-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⛵</div>
                }
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{boat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--os-text-3)', marginBottom: 10 }}>{boat.boat_type} {boat.model && `· ${boat.model}`}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSelectedBoat({ id: boat.id, name: boat.name })}
                      style={{ ...btn('var(--os-aqua)'), flex: 1 }}>⚙️ Управление</button>
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
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--os-text-3)', fontSize: 14 }}>
              Нет лодок. Добавьте первую или импортируйте через контракт.
            </div>
          )}
        </div>
      )}

      {/* CONTRACT & IMPORT HISTORY */}
      {activeTab === 'contract' && (
        <div>
          <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--os-text-1)' }}>
              🤖 Парсинг контракта
            </div>
            <p style={{ fontSize: 13, color: 'var(--os-text-3)', marginBottom: 12 }}>
              Для парсинга и импорта контракта используйте AI-парсер. Партнёр <strong style={{ color: 'var(--os-text-1)' }}>{partnerName}</strong> будет предвыбран автоматически.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`/import?partner_id=${partnerId}`}
                style={{ ...btn('var(--os-aqua)'), textDecoration: 'none', display: 'inline-block' }}>
                🤖 Открыть AI-парсер яхт
              </a>
              <a href={`/import-all?partner_id=${partnerId}`}
                style={{ ...btn('#555'), textDecoration: 'none', display: 'inline-block' }}>
                📦 Импорт меню / водных развлечений
              </a>
            </div>
          </div>

          {/* Import History */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 История импорта</div>
          {history.length === 0
            ? <div style={{ color: 'var(--os-text-3)', fontSize: 13 }}>История пуста.</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map(h => (
                  <div key={h.id} style={{
                    backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
                    borderRadius: 8, padding: '12px 16px',
                  }}>
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
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* PARTNER INFO */}
      {activeTab === 'info' && partner && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {([
              ['Название', 'name'], ['Контактное лицо', 'contact_name'], ['Телефон', 'contact_phone'],
              ['Email', 'contact_email'], ['Сайт', 'website'], ['Комиссия %', 'commission_percent'],
              ['Договор от', 'contract_valid_from'], ['Договор до', 'contract_valid_until'],
              ['Банк', 'bank_name'], ['Номер счёта', 'bank_account_number'], ['SWIFT', 'swift_code'],
            ] as [string, string][]).map(([label, field]) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>{label}</div>
                <input value={(partner as any)[field] || ''}
                  onChange={e => setPartner({ ...partner, [field]: e.target.value })} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Примечания</div>
            <textarea value={partner.notes || ''} onChange={e => setPartner({ ...partner, notes: e.target.value })}
              rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <button onClick={savePartner} style={btn('var(--os-green)')}>💾 Сохранить реквизиты</button>
        </div>
      )}
    </div>
  );
}
