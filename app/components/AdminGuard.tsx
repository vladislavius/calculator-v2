'use client';
import { useState, useEffect, createContext, useContext } from 'react';

const STORAGE_KEY = 'os_session';

export type UserRole = 'admin' | 'manager' | 'agent';
export type SessionUser = { id: number; email: string; name: string; role: UserRole };

type AuthCtx = {
  user: SessionUser | null;
  token: string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({ user: null, token: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

function LoginForm({ onLogin }: { onLogin: (token: string, user: SessionUser) => void }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Ошибка входа');
        setPin('');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--os-bg, #0C1825)',
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'var(--os-card, #112233)',
        border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
        padding: '40px', borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        textAlign: 'center', minWidth: '340px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚓</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--os-aqua, #00D4B4)', marginBottom: 6 }}>
          OnlySea Admin
        </div>
        <div style={{ fontSize: 13, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 28 }}>
          Войдите чтобы продолжить
        </div>

        <div style={{ marginBottom: 14, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@onlysea.com" autoFocus required
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              backgroundColor: 'var(--os-surface, #0f2235)',
              border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
              borderRadius: 8, color: 'var(--os-text-1, #e2e8f0)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIN-код</div>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            placeholder="••••" required
            style={{
              width: '100%', padding: '12px 14px', fontSize: 18,
              backgroundColor: 'var(--os-surface, #0f2235)',
              border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
              borderRadius: 8, color: 'var(--os-text-1, #e2e8f0)',
              outline: 'none', letterSpacing: 8, textAlign: 'center', boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--os-red, #f87171)', fontSize: 13, marginBottom: 14, padding: '8px 12px', backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
            ❌ {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px', fontSize: 15, fontWeight: 700,
          color: '#0C1825', backgroundColor: loading ? '#666' : 'var(--os-aqua, #00D4B4)',
          border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          transition: 'opacity 0.15s',
        }}>
          {loading ? '⏳ Проверка...' : '🔓 Войти'}
        </button>
      </form>
    </div>
  );
}

export default function AdminGuard({ children, requireRole }: {
  children: React.ReactNode;
  requireRole?: UserRole | UserRole[];
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { setChecking(false); return; }
    try {
      const { token: t, user: u } = JSON.parse(stored);
      // Верифицируем токен на сервере
      fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      }).then(r => r.json()).then(data => {
        if (data.valid) {
          setToken(t);
          setUser(data.user);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setChecking(false);
      }).catch(() => setChecking(false));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setChecking(false);
    }
  }, []);

  const handleLogin = (t: string, u: SessionUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--os-bg, #0C1825)' }}>
      <div style={{ color: 'var(--os-text-3, #6b7a8d)', fontSize: 14 }}>⏳ Проверка сессии...</div>
    </div>
  );

  if (!user) return <LoginForm onLogin={handleLogin} />;

  // Проверка роли
  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowed.includes(user.role)) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--os-bg, #0C1825)' }}>
          <div style={{ textAlign: 'center', color: 'var(--os-text-1, #e2e8f0)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Доступ запрещён</div>
            <div style={{ fontSize: 13, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 20 }}>Недостаточно прав (требуется: {allowed.join(', ')})</div>
            <button onClick={logout} style={{ padding: '8px 20px', backgroundColor: 'var(--os-aqua, #00D4B4)', color: '#0C1825', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Выйти
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
