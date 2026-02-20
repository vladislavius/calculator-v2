export const inputStyle = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', color: '#1f2937', width: '100%', fontSize: '14px' };

export const labelStyle = { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' as const };

export const cardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };

export const tabStyle = (active: boolean) => ({
  padding: '10px 16px', border: 'none', borderRadius: '8px',
  backgroundColor: active ? '#2563eb' : '#f3f4f6',
  color: active ? 'white' : '#6b7280',
  cursor: 'pointer', fontSize: '13px', fontWeight: '500' as const
});
