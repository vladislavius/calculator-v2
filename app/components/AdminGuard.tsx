'use client';
import { useState, useEffect } from 'react';

const ADMIN_PIN = '2026';
const STORAGE_KEY = 'admin_auth';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === ADMIN_PIN) setAuthorized(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem(STORAGE_KEY, pin);
      setAuthorized(true);
      setError('');
    } else {
      setError('Неверный пин-код');
      setPin('');
    }
  };

  if (checking) return null;

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', minWidth: '320px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1e293b' }}>Доступ ограничен</h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>Введите пин-код для доступа</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Пин-код"
            autoFocus
            style={{ width: '100%', padding: '14px', fontSize: '18px', border: '2px solid #e2e8f0', borderRadius: '10px', textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box', outline: 'none' }}
          />
          {error && <p style={{ color: '#ef4444', margin: '12px 0 0', fontSize: '14px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '16px', fontWeight: '600', color: 'white', background: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            Войти
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
