'use client';
import { useState } from 'react';

type Role = 'admin' | 'manager' | 'agent';

type User = {
  id: number; name: string; email: string; role: Role; active: boolean; pin?: string;
};

const MOCK_USERS: User[] = [
  { id: 1, name: 'Admin',   email: 'admin@onlysea.com',   role: 'admin',   active: true },
  { id: 2, name: 'Manager', email: 'manager@onlysea.com', role: 'manager', active: true },
  { id: 3, name: 'Agent 1', email: 'agent1@onlysea.com',  role: 'agent',   active: true },
];

const ROLE_COLORS: Record<Role, string> = {
  admin: 'var(--os-red)', manager: 'var(--os-gold)', agent: 'var(--os-aqua)',
};

const ROLE_PERMS: Record<Role, string[]> = {
  admin:   ['Все разделы', 'Редактирование БД', 'Управление пользователями', 'Статистика', 'Наценка менеджера'],
  manager: ['Расчёт', 'PDF генерация', 'Наценка менеджера', 'Все секции'],
  agent:   ['Расчёт', 'PDF генерация', 'Только просмотр цен'],
};

const btn = (color: string): React.CSSProperties => ({ padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, backgroundColor: color, color: '#fff' });
const inp: React.CSSProperties = { padding: '6px 10px', backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 4, color: 'var(--os-text-1)', fontSize: 13, outline: 'none', width: '100%' };

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [editing, setEditing] = useState<Partial<User> | null>(null);
  const [newPin, setNewPin] = useState('');

  const save = () => {
    if (!editing) return;
    if (editing.id) {
      setUsers(users.map(u => u.id === editing.id ? { ...u, ...editing } : u));
    } else {
      setUsers([...users, { ...editing as User, id: Date.now() }]);
    }
    setEditing(null);
    setNewPin('');
  };

  return (
    <div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--os-gold)' }}>
        ⚠️ Система пользователей использует PIN-аутентификацию через <code>ADMIN_PIN</code> в .env.local. Полноценная мультипользовательская система требует отдельной таблицы users в Supabase.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setEditing({ role: 'agent', active: true })} style={btn('var(--os-aqua)')}>+ Добавить пользователя</button>
      </div>

      {editing && (
        <div style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--os-aqua)' }}>
            {editing.id ? '✏️ Редактировать' : '➕ Новый пользователь'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div><div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Имя</div>
              <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} style={inp} /></div>
            <div><div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Email</div>
              <input value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} style={inp} /></div>
            <div><div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>Роль</div>
              <select value={editing.role || 'agent'} onChange={e => setEditing({ ...editing, role: e.target.value as Role })} style={inp}>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="agent">agent</option>
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--os-text-3)', marginBottom: 4 }}>PIN (новый)</div>
              <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="4-8 цифр" style={inp} /></div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={save} style={btn('var(--os-green)')}>💾 Сохранить</button>
            <button onClick={() => setEditing(null)} style={btn('#666')}>Отмена</button>
          </div>
        </div>
      )}

      {/* Role permissions matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {(Object.entries(ROLE_PERMS) as [Role, string[]][]).map(([role, perms]) => (
          <div key={role} style={{ backgroundColor: 'var(--os-card)', border: `1px solid var(--os-border)`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: ROLE_COLORS[role], marginBottom: 10, textTransform: 'uppercase' }}>
              {role === 'admin' ? '👑' : role === 'manager' ? '🧑‍💼' : '🧑‍💻'} {role}
            </div>
            {perms.map(p => <div key={p} style={{ fontSize: 12, color: 'var(--os-text-2)', padding: '3px 0' }}>✓ {p}</div>)}
          </div>
        ))}
      </div>

      {/* Users list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{ backgroundColor: 'var(--os-card)', border: '1px solid var(--os-border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {u.role === 'admin' ? '👑' : u.role === 'manager' ? '🧑‍💼' : '🧑‍💻'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--os-text-3)' }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role] }}>{u.role}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: u.active ? 'rgba(0,212,180,0.1)' : 'rgba(255,60,60,0.1)', color: u.active ? 'var(--os-green)' : 'var(--os-red)' }}>{u.active ? 'Активен' : 'Отключён'}</span>
            <button onClick={() => setEditing(u)} style={btn('var(--os-aqua)')}>✏️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
