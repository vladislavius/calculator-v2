'use client';

import { SearchResult } from '../lib/types';
import BoatCard from './BoatCard';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  searchDate: string;
  showAgentPrice: boolean;
  markupPercent: number;
  onSelectBoat: (boat: SearchResult) => void;
}

export default function SearchResults({ results, loading, searchDate, showAgentPrice, markupPercent, onSelectBoat }: SearchResultsProps) {
  if (results.length > 0) {
    return (
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
          Найдено: {results.length} вариантов на {searchDate}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {results.map((boat, idx) => (
            <BoatCard
              key={idx}
              boat={boat}
              showAgentPrice={showAgentPrice}
              markupPercent={markupPercent}
              onSelect={onSelectBoat}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🚤</p>
        <p style={{ fontSize: '18px' }}>Выберите параметры и нажмите &quot;Найти лодки&quot;</p>
      </div>
    );
  }

  return null;
}
