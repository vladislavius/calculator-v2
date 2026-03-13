'use client';
import { useState } from 'react';
import { useCharterStore } from '../store/useCharterStore';

export default function Header() {
  const lang = useCharterStore(s => s.lang);
  const isAdmin = useCharterStore(s => s.isAdmin);
  const set = useCharterStore(s => s.set);

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
        if (data.user?.role === 'admin') {
          set({ isAdmin: true });
        }
        setShowLogin(false);
        setEmail('');
        setPin('');
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ isAdmin: false });
  };

  return (
    <>
      <header className="os-header">
        <div className="os-header__inner">
          <a href="/" className="os-logo">
            <div className="os-logo__icon">🚤</div>
            <div className="os-logo__wrap hidden md:block">
              <span className="os-logo__name">OnlySea Charter</span>
              <span className="os-logo__sub">Phuket · Calculator Pro</span>
            </div>
          </a>
          <nav className="os-nav">
            <a href="/" className="os-nav__link active">🧮<span className="hidden md:inline"> Калькулятор</span></a>
            <a href="/calendar" className="os-nav__link">📅<span className="hidden md:inline"> Календарь</span></a>
            <a href="/admin" className="os-nav__link">⚙️<span className="hidden md:inline"> Админ</span></a>
          </nav>
          <div className="os-header__spacer" />
          <div className="os-lang-switch">
            <button className={`os-lang-btn${lang === 'ru' ? ' active' : ''}`} onClick={() => set({ lang: 'ru' })}>RU</button>
            <button className={`os-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => set({ lang: 'en' })}>EN</button>
          </div>
          {isAdmin ? (
            <button onClick={handleLogout} title="Выйти из админа" style={{
              background: 'none', border: '1px solid rgba(0,212,180,0.3)', cursor: 'pointer',
              fontSize: '13px', color: 'var(--os-aqua, #00D4B4)', padding: '5px 12px',
              marginLeft: '8px', borderRadius: '6px', fontWeight: 600,
            }}>
              🔓 Админ · Выйти
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} title="Войти как администратор" style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              fontSize: '13px', color: 'var(--os-text-3, #6b7a8d)', padding: '5px 12px',
              marginLeft: '8px', borderRadius: '6px',
            }}>
              🔑 Войти
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}>
          <form onSubmit={handleLogin} style={{
            backgroundColor: 'var(--os-card, #112233)',
            border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
            padding: '40px', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            textAlign: 'center', minWidth: '320px', maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--os-aqua, #00D4B4)', marginBottom: 4 }}>
              OnlySea Admin
            </div>
            <div style={{ fontSize: 12, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 24 }}>
              Войдите чтобы добавить наценку
            </div>

            <div style={{ marginBottom: 12, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Ваш email" autoFocus required
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 14,
                  backgroundColor: 'var(--os-surface, #0f2235)',
                  border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
                  borderRadius: 8, color: 'var(--os-text-1, #e2e8f0)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 18, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'var(--os-text-3, #6b7a8d)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIN-код</div>
              <input
                type="password" value={pin} onChange={e => setPin(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 18,
                  backgroundColor: 'var(--os-surface, #0f2235)',
                  border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
                  borderRadius: 8, color: 'var(--os-text-1, #e2e8f0)',
                  outline: 'none', letterSpacing: 8, textAlign: 'center', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--os-red, #f87171)', fontSize: 13, marginBottom: 12, padding: '8px 12px', backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                ❌ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowLogin(false)} style={{
                flex: 1, padding: '12px', fontSize: 14, fontWeight: 600,
                color: 'var(--os-text-3, #6b7a8d)', backgroundColor: 'transparent',
                border: '1px solid var(--os-border, rgba(255,255,255,0.08))',
                borderRadius: 8, cursor: 'pointer',
              }}>
                Отмена
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: '12px', fontSize: 14, fontWeight: 700,
                color: '#0C1825', backgroundColor: loading ? '#666' : 'var(--os-aqua, #00D4B4)',
                border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              }}>
                {loading ? '⏳ Проверка...' : '🔓 Войти'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
