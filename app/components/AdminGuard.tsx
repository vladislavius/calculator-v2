'use client';
import { useState, useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Validate session via server — token is in an httpOnly cookie, not readable by JS
    fetch('/api/auth/check')
      .then(res => {
        if (res.ok) setAuthorized(true);
      })
      .catch(() => {/* network error — show login form */})
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (data.success) {
        // Session token is set as httpOnly cookie by the server — not accessible to JS
        setAuthorized(true);
      } else {
        setError('Неверный пин-код');
        setPin('');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
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
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '16px', fontWeight: '600', color: 'white', background: loading ? '#94a3b8' : '#2563eb', border: 'none', borderRadius: '10px', cursor: loading ? 'default' : 'pointer' }}>
            {loading ? '⏳ Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
