'use client';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with the large component
const PartnersPageContent = dynamic(() => import('../../partners/page').then(mod => {
  // Return the default export as component
  return { default: mod.default };
}), { 
  ssr: false,
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: 'var(--os-text-3)' }}>⏳ Загрузка...</div>
});

export default function ProductsTab() {
  return <PartnersPageContent embedded />;
}
