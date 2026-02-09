const STORAGE_KEY = 'admin_session_token';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

interface ProxyResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

async function dbWrite(body: {
  action: 'insert' | 'update' | 'delete' | 'upsert';
  table: string;
  data?: any;
  match?: Record<string, any>;
  select?: string;
}): Promise<ProxyResult> {
  const token = getAdminToken();
  if (!token) return { data: null, error: { message: 'Not authorized' } };

  const res = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token
    },
    body: JSON.stringify(body)
  });

  const result = await res.json();
  if (!res.ok) return { data: null, error: { message: result.error } };
  return { data: result.data, error: null };
}

// Drop-in replacements matching Supabase syntax
export const adminDb = {
  from: (table: string) => ({
    insert: (data: any) => ({
      select: (fields?: string) => ({
        single: () => dbWrite({ action: 'insert', table, data, select: fields || '*' })
          .then(r => ({ data: r.data?.[0] || r.data, error: r.error })),
        maybeSingle: () => dbWrite({ action: 'insert', table, data, select: fields || '*' })
          .then(r => ({ data: r.data?.[0] || null, error: r.error })),
      }),
      then: (resolve: any) => dbWrite({ action: 'insert', table, data }).then(resolve),
    }),
    update: (data: any) => ({
      eq: (key: string, value: any) => ({
        select: (fields?: string) => ({
          single: () => dbWrite({ action: 'update', table, data, match: { [key]: value }, select: fields || '*' })
            .then(r => ({ data: r.data?.[0] || r.data, error: r.error })),
        }),
        then: (resolve: any) => dbWrite({ action: 'update', table, data, match: { [key]: value } }).then(resolve),
        eq: (key2: string, value2: any) => ({
          then: (resolve: any) => dbWrite({ action: 'update', table, data, match: { [key]: value, [key2]: value2 } }).then(resolve),
        }),
      }),
    }),
    delete: () => ({
      eq: (key: string, value: any) => ({
        then: (resolve: any) => dbWrite({ action: 'delete', table, match: { [key]: value } }).then(resolve),
        eq: (key2: string, value2: any) => ({
          then: (resolve: any) => dbWrite({ action: 'delete', table, match: { [key]: value, [key2]: value2 } }).then(resolve),
        }),
      }),
    }),
    upsert: (data: any) => ({
      select: (fields?: string) => ({
        single: () => dbWrite({ action: 'upsert', table, data, select: fields || '*' })
          .then(r => ({ data: r.data?.[0] || r.data, error: r.error })),
      }),
      then: (resolve: any) => dbWrite({ action: 'upsert', table, data }).then(resolve),
    }),
  }),
};
