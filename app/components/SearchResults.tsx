'use client';
import { useCharterStore } from '../store/useCharterStore';
import { SearchResult } from '../lib/types';
import BoatCard from './BoatCard';

export default function SearchResults({ onSelectBoat }: { onSelectBoat: (b: SearchResult) => void }) {
  const results        = useCharterStore(s => s.results);
  const loading        = useCharterStore(s => s.loading);
  const searchDate     = useCharterStore(s => s.searchDate);
  const showAgentPrice = useCharterStore(s => s.showAgentPrice);
  const markupPercent  = useCharterStore(s => s.markupPercent);

  if (loading) return (
    <div className="os-boat-grid">
      {[...Array(6)].map((_,i) => (
        <div key={i} className="os-boat-card" style={{ minHeight: 280 }}>
          <div className="os-skeleton" style={{ height: 190 }} />
          <div style={{ padding: 16, display:'flex', flexDirection:'column', gap: 10 }}>
            <div className="os-skeleton" style={{ height: 18, width:'65%' }} />
            <div className="os-skeleton" style={{ height: 14, width:'40%' }} />
            <div className="os-skeleton" style={{ height: 40 }} />
            <div className="os-skeleton" style={{ height: 36 }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (results.length > 0) return (
    <div>
      <div className="os-results-header">
        <div className="os-results-count">Найдено: <strong>{results.length}</strong> лодок на {searchDate}</div>
      </div>
      <div className="os-boat-grid">
        {results.map((boat, i) => (
          <BoatCard key={i} boat={boat} showAgentPrice={showAgentPrice} markupPercent={markupPercent} onSelect={onSelectBoat} searchDate={searchDate} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="os-empty">
      <div className="os-empty__icon">🌊</div>
      <div className="os-empty__title">Лодки ещё не найдены</div>
      <div className="os-empty__sub">Выберите дату, направление и нажмите «Найти лодки»</div>
    </div>
  );
}
