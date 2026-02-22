'use client';
import { SearchResult } from '../lib/types';
import { useCharterStore } from '../store/useCharterStore';
import { useBoatAvailability } from '../hooks/useBoatAvailability';

interface Props { boat: SearchResult; showAgentPrice: boolean; markupPercent: number; onSelect: (b: SearchResult) => void; searchDate?: string; }

const seasonLabel = (s: string) => ({ peak:'🔥 Пик', high:'☀️ Высокий', low:'🌧️ Низкий', all:'📅 Все' }[s] || s);
const typeIcon    = (t: string) => ({ catamaran:'⛵', sailing_catamaran:'⛵', speedboat:'🚤', yacht:'🛥️' }[t] || '🚢');

const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

export default function BoatCard({ boat, showAgentPrice, markupPercent, onSelect, searchDate }: Props) {
  const clientPrice = Math.round((boat.calculated_total || 0) * (1 + markupPercent / 100));
  const agentPrice  = boat.calculated_agent_total || boat.base_price || 0;
  const availDays   = useBoatAvailability(boat.boat_id, searchDate);
  const isAdmin = useCharterStore(s => s.isAdmin);

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
            {boat.website_url 
              ? <a href={boat.website_url} target="_blank" rel="noopener noreferrer" className="os-boat-card__name" style={{color:'inherit',textDecoration:'none'}} onClick={e => e.stopPropagation()} onMouseEnter={e => (e.currentTarget.style.color='var(--os-aqua)')} onMouseLeave={e => (e.currentTarget.style.color='inherit')}>{boat.boat_name} <span style={{fontSize:'10px',opacity:0.5}}>↗</span></a>
              : <div className="os-boat-card__name">{boat.boat_name}</div>}
            {isAdmin && <div className="os-boat-card__partner">{boat.partner_name}</div>}
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

        {/* 7 квадратиков доступности */}
        {availDays.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 8, marginBottom: 4 }} onClick={e => e.stopPropagation()}>
            {availDays.map((d, i) => (
              <div key={i} title={`${DAY_SHORT[d.date.getDay()]} ${d.date.getDate()}.${String(d.date.getMonth()+1).padStart(2,'0')} — ${d.status === 'free' ? 'Свободна' : d.status === 'busy' ? 'Занята' : 'Нет данных'}`}
                style={{
                  flex: 1,
                  height: 20,
                  borderRadius: 3,
                  backgroundColor:
                    d.status === 'free'    ? 'rgba(34,197,94,0.35)'  :
                    d.status === 'busy'    ? 'rgba(239,68,68,0.45)'  :
                    'rgba(255,255,255,0.07)',
                  border: d.isSearchDate
                    ? '1.5px solid var(--os-aqua)'
                    : d.status === 'free'  ? '1px solid rgba(34,197,94,0.5)'
                    : d.status === 'busy'  ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 600,
                  color:
                    d.status === 'free' ? '#4ade80' :
                    d.status === 'busy' ? '#f87171' :
                    'rgba(255,255,255,0.2)',
                  cursor: 'default',
                  position: 'relative'
                }}>
                {d.date.getDate()}
              </div>
            ))}
          </div>
        )}
        {availDays.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <a href="/calendar" onClick={e => e.stopPropagation()}
              style={{ fontSize: 10, color: 'var(--os-aqua)', textDecoration: 'none', opacity: 0.7 }}>
              📅 полный календарь
            </a>
          </div>
        )}

        <button className="os-btn-select">Выбрать и рассчитать →</button>
      </div>
    </div>
  );
}
