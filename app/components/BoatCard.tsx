'use client';

import { SearchResult } from '../lib/types';
import { cardStyle } from '../lib/styles';

interface BoatCardProps {
  boat: SearchResult;
  showAgentPrice: boolean;
  markupPercent: number;
  onSelect: (boat: SearchResult) => void;
}

const seasonLabel = (s: string) => {
  const map: Record<string, string> = {
    'peak': '🔥 Пик',
    'high': '☀️ Высокий',
    'low': '🌧️ Низкий',
    'all': '📅 Все сезоны',
  };
  return map[s] || s;
};

export default function BoatCard({ boat, showAgentPrice, markupPercent, onSelect }: BoatCardProps) {
  return (
    <div
      style={{ ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid transparent' }}
      onClick={() => onSelect(boat)}
      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
      onMouseOut={(e) => (e.currentTarget.style.borderColor = 'transparent')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111' }}>{boat.boat_name}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{boat.partner_name}</p>
        </div>
        <span style={{ padding: '4px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '12px', fontWeight: '500', height: 'fit-content' }}>
          {boat.boat_type}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
        <span>📏 {boat.length_ft} ft</span>
        <span>👥 до {boat.max_guests} чел</span>
        {boat.cabin_count > 0 && <span>🛏️ {boat.cabin_count} каюты</span>}
      </div>
      <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>🗺️ {boat.route_name}</p>
        {boat.season && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8b5cf6' }}>{seasonLabel(boat.season || "")}</p>}
        {boat.fuel_surcharge > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>⛽ +{boat.fuel_surcharge.toLocaleString()} THB топливо</p>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {showAgentPrice ? (
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Agent: <span style={{ fontWeight: '600' }}>{(boat.calculated_agent_total || boat.base_price).toLocaleString()}</span></p>
            <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>Client: {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB{markupPercent > 0 && <span style={{ fontSize: '11px', color: '#8b5cf6' }}> (+{markupPercent}%)</span>}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed' }}>
              Profit: {(Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)) - (boat.calculated_agent_total || boat.base_price)).toLocaleString()} THB
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
            {Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100)).toLocaleString()} THB
          </p>
        )}
        <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
          Выбрать →
        </button>
      </div>
    </div>
  );
}
