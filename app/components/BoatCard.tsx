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
          {isAdmin && boat.calendar_url && (
            <a href={boat.calendar_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title="Календарь партнёра"
              style={{marginLeft:'auto',fontSize:'17px',textDecoration:'none',lineHeight:1,display:'flex',alignItems:'center'}}
            >📅</a>
          )}
          {isAdmin && boat.chat_url && (
            <a href={boat.chat_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title="WhatsApp чат с партнёром"
              style={{marginLeft: boat.calendar_url ? '4px' : 'auto',fontSize:'18px',textDecoration:'none',lineHeight:1,display:'flex',alignItems:'center'}}
            ><svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
          )}
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
