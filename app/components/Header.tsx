'use client';

import { Lang } from '../lib/i18n';

interface HeaderProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export default function Header({ lang, setLang }: HeaderProps) {
  return (
    <header style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', color: 'white', padding: '20px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🚤 Phuket Charter Pro</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>Профессиональный калькулятор чартеров</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }} className="import-dropdown">
            <a href="/import-all" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📦 Импорт
            </a>
          </div>
          <a href="/partners" style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            👥 Партнёры
          </a>
          <div style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "2px" }}>
            <button onClick={() => setLang("ru")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: lang === "ru" ? "white" : "transparent", color: lang === "ru" ? "#1e40af" : "rgba(255,255,255,0.7)" }}>RU</button>
            <button onClick={() => setLang("en")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: lang === "en" ? "white" : "transparent", color: lang === "en" ? "#1e40af" : "rgba(255,255,255,0.7)" }}>EN</button>
          </div>
        </div>
      </div>
    </header>
  );
}
