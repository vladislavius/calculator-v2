'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Offer = {
  id: string; boat_name: string; search_date: string; guests: number;
  time_slot: string; total_client: number; total_agent: number;
  lang: string; snapshot: any; notes: string; created_at: string; expires_at: string;
};

const TIME_SLOT_LABELS: Record<string, string> = {
  full_day: 'Полный день', half_day_am: 'Утро (полдня)', half_day_pm: 'Вечер (полдня)',
  overnight: 'Ночёвка', custom: 'Индивидуально',
};

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/offers?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setOffer(d);
        setLoading(false);
      });
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0C1825', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: 16 }}>Загрузка предложения...</div>
    </div>
  );

  if (error || !offer) return (
    <div style={{ minHeight: '100vh', background: '#0C1825', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😔</div>
      <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Предложение не найдено</div>
      <div style={{ color: '#64748b', fontSize: 14 }}>{error === 'Offer expired' ? 'Срок действия предложения истёк' : 'Ссылка недействительна'}</div>
      <a href="/" style={{ marginTop: 8, padding: '10px 24px', borderRadius: 8, backgroundColor: '#0891b2', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← На главную</a>
    </div>
  );

  const snap = offer.snapshot || {};
  const boat = snap.boat || {};
  const lines: { label: string; val: number }[] = snap.lines || [];
  const expiresDate = new Date(offer.expires_at).toLocaleDateString('ru-RU');
  const createdDate = new Date(offer.created_at).toLocaleDateString('ru-RU');

  return (
    <div style={{ minHeight: '100vh', background: '#0C1825', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0891b2' }}>ONLYSEA</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>· Предложение для клиента</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyLink} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: copied ? 'rgba(0,212,180,0.15)' : 'rgba(255,255,255,0.05)', color: copied ? '#00d4b4' : '#e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {copied ? '✅ Скопировано!' : '🔗 Скопировать ссылку'}
          </button>
          <a href="/" style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#0891b2', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Открыть калькулятор →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Boat hero */}
        {boat.main_photo_url && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24, height: 280 }}>
            <img src={boat.main_photo_url} alt={offer.boat_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Main info */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{offer.boat_name}</div>
          {boat.partner_name && <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{boat.partner_name}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { icon: '📅', label: 'Дата', val: offer.search_date ? new Date(offer.search_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { icon: '👥', label: 'Гостей', val: `${offer.guests} чел.` },
              { icon: '⏱', label: 'Формат', val: TIME_SLOT_LABELS[offer.time_slot] || offer.time_slot },
              ...(boat.length_ft ? [{ icon: '📏', label: 'Длина', val: `${boat.length_ft} ft` }] : []),
              ...(boat.route_name_ru || boat.route_name ? [{ icon: '🗺', label: 'Маршрут', val: boat.route_name_ru || boat.route_name }] : []),
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Boat specs */}
          {(boat.max_guests || boat.cabin_count || boat.crew_count) && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
              {boat.max_guests && <span>👥 До {boat.max_guests} гостей</span>}
              {boat.cabin_count > 0 && <span>🛏 {boat.cabin_count} каюты</span>}
              {boat.crew_count > 0 && <span>👨‍✈️ {boat.crew_count} экипаж</span>}
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0891b2' }}>💰 Состав стоимости</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.filter(l => l.val > 0).map((line, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>{line.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{line.val.toLocaleString()} ฿</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>💰 Итого</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0891b2' }}>{(offer.total_client || 0).toLocaleString()} ฿</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                ≈ {Math.round((offer.total_client || 0) / 34).toLocaleString()} USD · ≈ {Math.round((offer.total_client || 0) * 2.7).toLocaleString()} ₽
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {offer.notes && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#0891b2' }}>📝 Заметки</div>
            <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{offer.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 12 }}>
          <div>Предложение создано {createdDate} · Действительно до {expiresDate}</div>
          <div style={{ marginTop: 4 }}>ONLYSEA · Phuket · onlysea.com</div>
        </div>
      </div>
    </div>
  );
}
