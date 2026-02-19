'use client';
import { SearchResult } from '../lib/types';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props { boat: SearchResult; showAgentPrice: boolean; markupPercent: number; onSelect: (b: SearchResult) => void; }

const seasonLabel = (s: string) => ({ peak:'🔥 Пик', high:'☀️ Высокий', low:'🌧️ Низкий', all:'📅 Все' }[s] || s);
const typeIcon    = (t: string) => ({ catamaran:'⛵', sailing_catamaran:'⛵', speedboat:'🚤', yacht:'🛥️' }[t] || '🚢');

export default function BoatCard({ boat, showAgentPrice, markupPercent, onSelect }: Props) {
  const isMobile    = useIsMobile();
  const clientPrice = Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100));
  const agentPrice  = boat.calculated_agent_total || boat.base_price || 0;

  return (
    <div className="os-boat-card" onClick={() => onSelect(boat)}>
      <div className="os-boat-card__img-wrap">
        {boat.main_photo_url
          ? <img src={boat.main_photo_url} alt={boat.boat_name} className="os-boat-card__img" loading="lazy" />
          : <div className="os-boat-card__no-photo">{typeIcon(boat.boat_type)}</div>
        }
        <div className="os-boat-card__badges">
          <span className="os-badge os-badge--type">{typeIcon(boat.boat_type)} {boat.boat_type}</span>
          {boat.season && boat.season !== 'all' && <span className="os-badge os-badge--season">{seasonLabel(boat.season)}</span>}
        </div>
      </div>
      <div className="os-boat-card__body">
        <div className="os-boat-card__header">
          <div style={{ minWidth: 0 }}>
            <div className="os-boat-card__name">{boat.boat_name}</div>
            <div className="os-boat-card__partner">{boat.partner_name}</div>
          </div>
          <div className="os-boat-card__price-wrap">
            {showAgentPrice && <div className="os-boat-card__agent">Агент: {agentPrice.toLocaleString()} ฿</div>}
            <div className="os-boat-card__price">{clientPrice.toLocaleString()} ฿</div>
          </div>
        </div>
        <div className="os-boat-card__specs">
          <span className="os-spec">📏 {boat.length_ft}ft</span>
          <span className="os-spec">👥 до {boat.max_guests}</span>
          {boat.cabin_count > 0 && <span className="os-spec">🛏️ {boat.cabin_count}</span>}
          {boat.crew_count > 0  && <span className="os-spec">👨‍✈️ {boat.crew_count}</span>}
        </div>
        <div className="os-boat-card__route">
          <span>🗺️</span><span>{boat.route_name}</span>
          {boat.fuel_surcharge > 0 && <span className="os-fuel-badge">⛽ +{boat.fuel_surcharge.toLocaleString()}</span>}
        </div>
        <button className="os-btn-select">Выбрать и рассчитать →</button>
      </div>
    </div>
  );
}
