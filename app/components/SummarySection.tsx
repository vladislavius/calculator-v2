'use client';

import { SearchResult } from '../lib/types';

interface Totals {
  agent: number; client: number; extras: number; catering: number;
  drinks: number; toys: number; services: number; transfer: number;
  fees: number; partnerWatersports: number; markup: number;
  totalAgent: number; totalClient: number;
}

interface SummarySectionProps {
  selectedBoat: SearchResult;
  totals: Totals;
  markupMode: 'percent' | 'fixed';
  setMarkupMode: (v: 'percent' | 'fixed') => void;
  boatMarkup: number;
  setBoatMarkup: (v: number) => void;
  fixedMarkup: number;
  setFixedMarkup: (v: number) => void;
  extraAdults: number;
  children3to11: number;
  customPrices: Record<string, number>;
  customNotes: string;
  setCustomNotes: (v: string) => void;
  generatePDF: () => void;
  generateWhatsApp: () => void;
}

export default function SummarySection({
  selectedBoat, totals, markupMode, setMarkupMode,
  boatMarkup, setBoatMarkup, fixedMarkup, setFixedMarkup,
  extraAdults, children3to11, customPrices,
  customNotes, setCustomNotes, generatePDF, generateWhatsApp
}: SummarySectionProps) {
  const baseLine = (label: string, value: number) => (
    value > 0 ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: '600' }}>+{value.toLocaleString()} THB</span>
      </div>
    ) : null
  );

  const guestSurcharge = (extraAdults + children3to11) > 0
    ? (extraAdults * (customPrices["extra_adult"] || selectedBoat?.extra_pax_price || 0)) +
      (children3to11 * (customPrices["child_3_11"] || Math.round((selectedBoat?.extra_pax_price || 0) * 0.5)))
    : 0;

  return (
    <div id="summary" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', borderRadius: '16px', color: 'white' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700' }}>📊 ИТОГО</h3>
      
      {/* Markup controls */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: '600' }}>Наша наценка</span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '2px' }}>
            <button onClick={() => setMarkupMode('percent')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: markupMode === 'percent' ? 'white' : 'transparent', color: markupMode === 'percent' ? '#1e40af' : 'rgba(255,255,255,0.7)' }}>%</button>
            <button onClick={() => setMarkupMode('fixed')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: markupMode === 'fixed' ? 'white' : 'transparent', color: markupMode === 'fixed' ? '#1e40af' : 'rgba(255,255,255,0.7)' }}>THB</button>
          </div>
        </div>
        {markupMode === 'percent' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <input type="number" min="0" max="500" value={boatMarkup} onChange={(e) => setBoatMarkup(Number(e.target.value) || 0)} style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }} />
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>%</span>
              <span style={{ fontSize: '13px', opacity: 0.7 }}>= +{Math.round((selectedBoat?.calculated_total || 0) * boatMarkup / 100).toLocaleString()} THB</span>
            </div>
            <input type="range" min="0" max="200" value={boatMarkup} onChange={(e) => setBoatMarkup(Number(e.target.value))} style={{ width: '100%', height: '6px', cursor: 'pointer' }} />
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="number" min="0" step="1000" value={fixedMarkup} onChange={(e) => setFixedMarkup(Number(e.target.value) || 0)} style={{ width: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }} />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>THB</span>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>= {((selectedBoat?.calculated_total || 0) > 0 ? (fixedMarkup / (selectedBoat?.calculated_total || 1) * 100).toFixed(1) : 0)}%</span>
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <span>Яхта (базовая цена)</span>
          <span style={{ fontWeight: '600' }}>{(selectedBoat.calculated_total || 0).toLocaleString()} THB</span>
        </div>

        {guestSurcharge > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <span>Доп. гости ({extraAdults} взр + {children3to11} дет)</span>
            <span style={{ fontWeight: '600' }}>+{guestSurcharge.toLocaleString()} THB</span>
          </div>
        )}

        {baseLine('Парковые сборы', totals.fees)}
        {baseLine('Питание', totals.catering)}
        {baseLine('Напитки', totals.drinks)}
        {baseLine('Водные развлечения', totals.toys)}
        {baseLine('Водные услуги', totals.partnerWatersports || 0)}
        {baseLine('Персонал', totals.services)}
        {baseLine('Трансфер', totals.transfer)}
        {baseLine('Дополнительные опции', totals.extras)}

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#fcd34d' }}>
          <span>Наценка {markupMode === 'fixed' ? '(' + fixedMarkup.toLocaleString() + ' THB)' : '(' + boatMarkup + '%)'}</span>
          <span style={{ fontWeight: '600' }}>+{markupMode === 'fixed' ? fixedMarkup.toLocaleString() : Math.round((selectedBoat.calculated_total || 0) * boatMarkup / 100).toLocaleString()} THB</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: '24px', fontWeight: 'bold' }}>
          <span>💰 ЦЕНА ДЛЯ КЛИЕНТА</span>
          <span>{(totals.totalClient || 0).toLocaleString()} THB</span>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'white' }}>📝 Заметки / Примечания:</label>
        <textarea
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Например: Обед в ресторане - кэш-ваучер 500 THB/чел для спидбота..."
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', minHeight: '80px', resize: 'vertical', backgroundColor: 'rgba(255,255,255,0.95)' }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <button onClick={generatePDF} style={{ flex: 1, padding: '16px', backgroundColor: 'white', color: '#1e40af', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          📄 Создать PDF
        </button>
        <button onClick={generateWhatsApp} style={{ flex: 1, padding: '16px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          💬 Отправить в WhatsApp
        </button>
      </div>
    </div>
  );
}
