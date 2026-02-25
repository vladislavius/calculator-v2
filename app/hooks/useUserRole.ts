import { useState, useEffect } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token is in httpOnly cookie — browser sends it automatically
    fetch('/api/auth/me', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        setRole(data.user?.role ?? null);
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
