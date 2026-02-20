'use client';
import { useCharterStore } from '../store/useCharterStore';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Header() {
  const lang = useCharterStore(s => s.lang);
  const set  = useCharterStore(s => s.set);
  const isMobile = useIsMobile();

  return (
    <header className="os-header">
      <div className="os-header__inner">
        <a href="/" className="os-logo">
          <div className="os-logo__icon">🚤</div>
          {!isMobile && (
            <div className="os-logo__wrap">
              <span className="os-logo__name">OnlySea Charter</span>
              <span className="os-logo__sub">Phuket · Calculator Pro</span>
            </div>
          )}
        </a>
        <nav className="os-nav">
          <a href="/" className="os-nav__link active">🔍{!isMobile && <span> Поиск</span>}</a>
          <a href="/partners" style={{display:"none"}} className="os-nav__link">👥{!isMobile && <span> Партнёры</span>}</a>
          <a href="/admin" className="os-nav__link">⚙️{!isMobile && <span> Админ</span>}</a>
          <a href="/import-all" className="os-nav__link" style={{display:"none"}}>📦{!isMobile && <span> Импорт</span>}</a>
        </nav>
        <div className="os-header__spacer" />
        <div className="os-lang-switch">
          <button className={`os-lang-btn${lang === 'ru' ? ' active' : ''}`} onClick={() => set({ lang: 'ru' })}>RU</button>
          <button className={`os-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => set({ lang: 'en' })}>EN</button>
        </div>
      </div>
    </header>
  );
}
