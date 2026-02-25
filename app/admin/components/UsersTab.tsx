'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AdminGuard';

type UserRole = 'admin' | 'manager' | 'agent';
type AppUser = {
  id: number; email: string; name: string; role: UserRole;
  active: boolean; created_at: string; last_login: string | null;
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'var(--os-red)', manager: 'var(--os-gold)', agent: 'var(--os-aqua)',
};
const ROLE_ICONS: Record<UserRole, string> = {
  admin: '👑', manager: '🧑‍💼', agent: '🧑‍💻',
};
const ROLE_PERMS: Record<UserRole, string[]> = {
  admin:   ['Полный доступ к админке', 'Управление пользователями', 'Редактирование БД', 'Все секции калькулятора', 'Без наценки'],
  manager: ['Калькулятор (все секции)', 'PDF генерация', 'Наценка менеджера', 'Без доступа к партнёрам'],
  agent:   ['Калькулятор (просмотр)', 'PDF генерация', 'Без наценки', 'Без доступа к партнёрам'],
};

const inp: React.CSSProperties = {
  padding: '7px 10px', backgroundColor: 'var(--os-surface)',
  border: '1px solid var(--os-border)', borderRadius: 5,
  color: 'var(--os-text-1)', fontSize: 13, outline: 'none', width: '100%',
};
const btn = (color: string): React.CSSProperties => ({
  padding: '5px 14px', borderRadius: 4, border: 'none',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  backgroundColor: color, color: color === 'var(--os-aqua)' || color === 'var(--os-green)' ? '#0C1825' : '#fff',
});

export default function UsersTab() {
  useAuth(); // Ensure we're inside AdminGuard context
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AppUser & { pin: string }> | null>(null);
  const [msg, setMsg] = useState('');

  // Token is in httpOnly cookie — no need to send it manually in headers
  const headers = { 'Content-Type': 'application/json' };
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const load = () => {
    fetch('/api/users', { headers }).then(r => r.json()).then(data => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { id, pin, ...fields } = editing;
    const body = { ...fields, ...(pin ? { pin } : {}), ...(id ? { id } : {}) };
    const res = await fetch('/api/users', {
      method: id ? 'PATCH' : 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) { flash('❌ ' + data.error); return; }
    flash('✅ Сохранено');
    load();
    setEditing(null);
  };

  const toggleActive = async (u: AppUser) => {
    await fetch('/api/users', { method: 'PATCH', headers, body: JSON.stringify({ id: u.id, active: !u.active }) });
    setUsers(us => us.map(x => x.id === u.id ? { ...x, active: !u.active } : x));
  };

  const deleteUser = async (u: AppUser) => {
    if (!confirm(`Удалить ${u.name}?`)) return;
    const res = await fetch('/api/users', { method: 'DELETE', headers, body: JSON.stringify({ id: u.id }) });
    const data = await res.json();
    if (data.error) { flash('❌ ' + data.error); return; }
    flash('✅ Удалён');
    load();
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--os-text-3)' }}>Загрузка...</div>;

  return (
    <div>
      {/* Role matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {(Object.entries(ROLE_PERMS) as [UserRole, string[]][]).map(([role, perms]) => (
          <div key={role} style={{ backgroundColor: 'var(--os-card)', border: `1px solid var(--os-border)`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: ROLE_COLORS[role], marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {ROLE_ICONS[role]} {role}
            </div>
            {perms.map(p => <div key={p} style={{ fontSize: 12, color: 'var(--os-text-2)', padding: '2px 0' }}>✓ {p}</div>)}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <button onClick={() => setEditing({ role: 'agent', active: true })} style={btn('var(--os-aqua)')}>+ Добавить пользователя</button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('✅') ? 'var(--os-green)' : 'var(--os-red)' }}>{msg}</span>}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--os-aqua)' }}>
            {editing.id ? `✏️ ${editing.name}` : '➕ Новый пользователь'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Имя</div>
              <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Email</div>
              <input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Роль</div>
              <select value={editing.role || 'agent'} onChange={e => setEditing({ ...editing, role: e.target.value as UserRole })} style={inp}>
                <option value="admin">👑 admin</option>
                <option value="manager">🧑‍💼 manager</option>
                <option value="agent">🧑‍💻 agent</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>
                PIN {editing.id ? '(оставьте пустым чтобы не менять)' : '(обязательно)'}
              </div>
              <input type="password" value={editing.pin || ''} onChange={e => setEditing({ ...editing, pin: e.target.value })}
                placeholder={editing.id ? '••••' : 'Новый PIN'} style={{ ...inp, letterSpacing: 4, textAlign: 'center' }} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={save} style={btn('var(--os-green)')}>💾 Сохранить</button>
            <button onClick={() => setEditing(null)} style={btn('#555')}>Отмена</button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{
            backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)',
            borderRadius: 8, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as any,
            opacity: u.active ? 1 : 0.6,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              backgroundColor: `${ROLE_COLORS[u.role]}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{ROLE_ICONS[u.role]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--os-text-3)' }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              backgroundColor: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role] }}>
              {u.role}
            </span>
            {u.last_login && (
              <span style={{ fontSize: 11, color: 'var(--os-text-3)' }}>
                🕐 {new Date(u.last_login).toLocaleDateString('ru')}
              </span>
            )}
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10,
              backgroundColor: u.active ? 'rgba(0,212,180,0.1)' : 'rgba(255,60,60,0.1)',
              color: u.active ? 'var(--os-green)' : 'var(--os-red)' }}>
              {u.active ? 'Активен' : 'Отключён'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(u)} style={btn('var(--os-aqua)')}>✏️</button>
              <button onClick={() => toggleActive(u)} style={btn(u.active ? '#f59e0b' : 'var(--os-green)')}>
                {u.active ? '🙈' : '👁'}
              </button>
              <button onClick={() => deleteUser(u)} style={btn('var(--os-red)')}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
