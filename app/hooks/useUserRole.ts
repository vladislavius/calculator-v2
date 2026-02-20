import { useState, useEffect } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('os_session') || '{}').token || '';
    if (!token) {
      setRole(null);
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', {
      headers: { 'x-session-token': token }
    })
      .then(r => r.json())
      .then(data => {
        setRole(data.user?.role ?? null);
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
