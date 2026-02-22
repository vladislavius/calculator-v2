'use client';
import { useCharterStore } from '../store/useCharterStore';
import { useAuth } from './AdminGuard';

export default function Header() {
  const lang = useCharterStore(s => s.lang);
  const { user, logout } = useAuth();
  const set  = useCharterStore(s => s.set);

  return (
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
          <a href="/partners" style={{display:"none"}} className="os-nav__link">👥<span className="hidden md:inline"> Партнёры</span></a>
          <a href="/admin" className="os-nav__link">⚙️<span className="hidden md:inline"> Админ</span></a>
          <a href="/import-all" className="os-nav__link" style={{display:"none"}}>📦<span className="hidden md:inline"> Импорт</span></a>
        </nav>
        <div className="os-header__spacer" />
        <div className="os-lang-switch">
          <button className={`os-lang-btn${lang === 'ru' ? ' active' : ''}`} onClick={() => set({ lang: 'ru' })}>RU</button>
          <button className={`os-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => set({ lang: 'en' })}>EN</button>
        </div>
        {user && (
          <button onClick={logout} title="Выйти" style={{background:'none',border:'none',cursor:'pointer',fontSize:'15px',color:'var(--os-text-3, #6b7a8d)',opacity:0.8,padding:'6px 10px',marginLeft:'4px'}}>🚪 Выйти</button>
        )}
      </div>
    </header>
  );
}
