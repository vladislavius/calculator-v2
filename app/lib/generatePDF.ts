import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder, CalcResult, DetailedCalcResult, BoatDrink, SelectedToy, SelectedService, SelectedFee, SelectedPartnerWatersport, PartnerMenu, BoatMenu } from './types';
// import { CalcResult } from './calculateTotals'; // Removed
import { t, Lang } from './i18n';

interface PDFParams {
  selectedBoat: SearchResult;
  totals: CalcResult;
  boatOptions: BoatOption[];
  selectedExtras: SelectedExtra[];
  cateringOrders: CateringOrder[];
  drinkOrders: DrinkOrder[];
  boatDrinks: BoatDrink[];
  selectedToys: SelectedToy[];
  selectedServices: SelectedService[];
  selectedFees: SelectedFee[];
  selectedPartnerWatersports: SelectedPartnerWatersport[];
  transferPickup: TransferOrder;
  transferDirection: 'round_trip' | 'one_way';
  partnerMenus: PartnerMenu[];
  boatMenu: BoatMenu[];
  selectedDishes: Record<string, number>;
  customPrices: Record<string, number>;
  lang: Lang;
  markupMode: 'percent' | 'fixed';
  fixedMarkup: number;
  boatMarkup: number;
  extraAdults: number;
  children3to11: number;
  childrenUnder3: number;
  adults: number;
  totalGuests: number;
  customAdultPrice: number | null;
  customChildPrice: number | null;
  customNotes: string;
}

export function generatePDFContent(p: PDFParams): string {
  const { selectedBoat, totals, lang } = p;

  // Cast totals to DetailedCalcResult to access items
  // In a real scenario, we should ensure the type is correct upstream, 
  // but for now we assume calculateTotals returning DetailedCalcResult is passed here.
  const detailedTotals = totals as DetailedCalcResult;
  const items = detailedTotals.items || []; // Fallback if items missing (e.g. old caller)

  // Calculate final total from items if available, or fallback to legacy totals
  const finalTotal = items.length > 0
    ? items.reduce((sum, i) => sum + i.total, 0) + (detailedTotals.markup || 0)
    : totals.totalClient;

  // Helper to format currency
  const fmt = (n: number) => n.toLocaleString() + ' THB';

  // 1. Boat Section
  const boatItem = items.find(i => i.category === 'boat' && i.id === 'boat_base');
  const boatPrice = boatItem ? boatItem.total : (totals.client || 0); console.log("PDF debug:", {itemCount: items.length, boatPrice, finalTotal, extraGuests: items.filter(i => i.category === "boat" && i.id !== "boat_base").length, markup: detailedTotals.markup, allItems: items.map(i => i.id + ":" + i.total)}); // Fallback

  // 2. Included Options
  const includedOptions = p.boatOptions
    .filter(opt => opt.status === 'included')
    .map(opt => lang === 'en' ? (opt.option_name || opt.option_name_ru || '') : (opt.option_name_ru || opt.option_name || ''))
    .filter(Boolean);

  // 3. Generate HTML Sections from Items
  const generateSection = (title: string, category: string, headers: string[]) => {
    const categoryItems = items.filter(i => i.category === category);
    if (categoryItems.length === 0) return '';

    const rows = categoryItems.map(i => {
      const name = lang === 'en' ? i.name : (i.nameRu || i.name);
      return `<tr><td>${name}${i.details ? ` <br><span style="color:#666;font-size:9px">(${i.details})</span>` : ''}</td><td>${i.quantity} ${i.unit}</td><td>${fmt(i.total)}</td></tr>`;
    }).join('');

    return `<div class="section"><div class="section-title">${title}</div><table><tr><th>${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th></tr>${rows}</table></div>`;
  };

  // Special Handling for Extra Guests (they are category 'boat' but not base price)
  const extraGuestsHtml = (() => {
    const guests = items.filter(i => i.category === 'boat' && i.id !== 'boat_base');
    if (guests.length === 0) return '';
    // We usually show extra guests in the summary, not as a separate section in the body, 
    // but the original PDF showed them in the summary. 
    // Let's keep them for the summary section primarily.
    return '';
  })();

  const extrasHtml = generateSection(t('pdf.extras', lang), 'extra', [t('pdf.name', lang), t('pdf.qty', lang), t('pdf.amount', lang)]);
  const cateringHtml = generateSection(t('pdf.catering', lang), 'catering', [t('pdf.name', lang), t('pdf.qty', lang), t('pdf.amount', lang)]);
  const drinksHtml = generateSection(t('pdf.drinks', lang), 'drink', [t('pdf.name', lang), t('pdf.qty', lang), t('pdf.amount', lang)]);
  const toysHtml = generateSection(t('pdf.waterToys', lang), 'toy', [t('pdf.name', lang), t('pdf.time', lang), t('pdf.amount', lang)]);
  const watersportsHtml = generateSection(t('pdf.watersports', lang) || (lang === 'en' ? 'Watersports' : 'Водные развлечения'), 'watersport', [t('pdf.name', lang), t('pdf.time', lang), t('pdf.amount', lang)]);
  const servicesHtml = generateSection(t('pdf.services', lang), 'service', [t('pdf.service', lang), t('pdf.qty', lang), t('pdf.amount', lang)]);
  const feesHtml = generateSection(t('pdf.fees', lang), 'fee', [t('pdf.name', lang), t('pdf.guestsLabel', lang), t('pdf.amount', lang)]);
  const transferHtml = generateSection(t('pdf.transfer', lang), 'transfer', [t('pdf.type', lang), t('pdf.address', lang), t('pdf.amount', lang)]);

  // Dishes HTML (Logic remains same as it relies on selectedDishes, not calculated items)
  const dishesHtml = (() => {
    const dishEntries = Object.entries(p.selectedDishes).filter(([, v]) => v > 0);
    if (dishEntries.length === 0) return '';
    let html = '<div class="section"><div class="section-title">' + t('pdf.dishes', lang) + '</div><table><tr><th>' + t('pdf.dish', lang) + '</th><th>' + t('pdf.qty', lang) + '</th></tr>';
    dishEntries.forEach(([key, count]) => {
      const parts = key.split('_');
      const setId = parts.slice(0, -2).join('_');
      const dishIdx = parseInt(parts[parts.length - 2]);
      const optIdx = parseInt(parts[parts.length - 1]);
      const menuSet = p.boatMenu.find((m) => String(m.id) === setId);
      if (menuSet && menuSet.dishes && menuSet.dishes[dishIdx]) {
        const opts = menuSet.dishes[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim());
        const optsRu = menuSet.dishes_ru && menuSet.dishes_ru[dishIdx] ? menuSet.dishes_ru[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim()) : [];
        if (opts[optIdx]) html += '<tr><td>' + (optsRu[optIdx] || opts[optIdx]) + '</td><td>' + count + ' чел</td></tr>';
      }
    });
    return html + '</table></div>';
  })();

  const conditionsHtml = (() => {
    const menu = p.partnerMenus.find(pm => pm.partner_id === selectedBoat.partner_id);
    return menu?.conditions_ru || menu?.conditions ? '<div style="margin-bottom:10px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e"><strong>⚠️ ' + t('pdf.conditions', lang) + '</strong> ' + (menu.conditions_ru || menu.conditions) + '</div>' : '';
  })();

  // Summary Rows
  const boatBaseRow = `<div class="total-row"><span>${t('total.boatBase', lang)}</span><span>${fmt(boatPrice)}</span></div>`;

  const extraGuestsRows = items.filter(i => i.category === 'boat' && i.id !== 'boat_base').map(i => {
    const name = lang === 'en' ? i.name : (i.nameRu || i.name);
    return `<div class="total-row"><span>${name}</span><span>+${fmt(i.total)}</span></div>`;
  }).join('');

  // Helper for summary rows by category
  const summaryRow = (label: string, category: string) => {
    const total = items.filter(i => i.category === category).reduce((sum, i) => sum + i.total, 0);
    if (total <= 0) return '';
    return `<div class="total-row"><span>${label}</span><span>+${fmt(total)}</span></div>`;
  };

  const summaryHtml = [
    boatBaseRow,
    extraGuestsRows,
    summaryRow(t('total.extras', lang), 'extra'),
    summaryRow(t('total.catering', lang), 'catering'),
    summaryRow(t('total.drinks', lang), 'drink'),
    summaryRow(t('total.waterToys', lang), 'toy'),
    summaryRow(t('total.watersports', lang) || (lang === 'en' ? 'Watersports' : 'Водные развлечения'), 'watersport'),
    summaryRow(t('total.services', lang), 'service'),
    summaryRow(t('total.fees', lang), 'fee'),
    summaryRow(t('total.transfer', lang), 'transfer'),
  ].join('');

  const css = '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:Arial,sans-serif;padding:20px 28px;background:#0C1825;color:#e2e8f0;max-width:580px;margin:0 auto;font-size:11px;line-height:1.5}' +
    '.header{text-align:center;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #00D4B4}' +
    '.logo{font-size:20px;font-weight:900;color:#00D4B4;margin-bottom:3px;letter-spacing:0.05em}' +
    '.subtitle{color:#94a3b8;font-size:10px}' +
    '.date{color:#64748b;font-size:10px;margin-top:6px}' +
    '.yacht-info{background:linear-gradient(135deg,#132840 0%,#0f2337 100%);border:1px solid rgba(0,212,180,0.3);padding:14px 16px;border-radius:8px;margin-bottom:14px}' +
    '.yacht-name{font-size:17px;font-weight:800;color:#00D4B4;margin-bottom:8px}' +
    '.yacht-details{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:10px}' +
    '.yacht-detail{display:flex;flex-direction:column}' +
    '.yacht-detail-label{color:#64748b;margin-bottom:2px;font-size:9px;text-transform:uppercase;letter-spacing:0.05em}' +
    '.yacht-detail-value{font-weight:700;color:#e2e8f0}' +
    '.section{margin-bottom:12px;background:#132840;border-radius:6px;overflow:hidden;border:1px solid #1e3a5f}' +
    '.section-title{font-size:10px;font-weight:800;color:#00D4B4;padding:8px 12px;background:#0f2337;border-bottom:1px solid #1e3a5f;text-transform:uppercase;letter-spacing:0.08em}' +
    '.included-list{display:flex;flex-wrap:wrap;gap:5px;padding:10px 12px}' +
    '.included-item{background:rgba(0,212,180,0.1);color:#00D4B4;padding:3px 8px;border-radius:3px;font-size:9px;border:1px solid rgba(0,212,180,0.25)}' +
    'table{width:100%;border-collapse:collapse;table-layout:fixed}' +
    'th,td{padding:6px 12px;border-bottom:1px solid #1e3a5f;font-size:10px;color:#e2e8f0}' +
    'th{text-align:left;font-weight:700;color:#94a3b8;background:#0f2337;font-size:9px;text-transform:uppercase;letter-spacing:0.05em}' +
    'th:first-child,td:first-child{width:auto}' +
    'th:nth-child(2),td:nth-child(2){width:70px;text-align:center}' +
    'th:last-child,td:last-child{width:90px;text-align:right;color:#00D4B4;font-weight:700}' +
    'tr:last-child td{border-bottom:none}' +
    '.total-section{background:#132840;border:1px solid rgba(0,212,180,0.3);padding:12px 16px;border-radius:8px;margin-top:14px}' +
    '.total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#94a3b8;border-bottom:1px solid #1e3a5f}' +
    '.total-row:last-child{border-bottom:none}' +
    '.total-row span:last-child{color:#e2e8f0;font-weight:600}' +
    '.total-row.final{font-size:14px;font-weight:900;margin-top:8px;padding-top:10px;border-top:2px solid #00D4B4;color:#00D4B4}' +
    '.total-row.final span:last-child{color:#00D4B4;font-size:16px}' +
    '.footer{margin-top:16px;text-align:center;color:#64748b;font-size:9px;padding-top:12px;border-top:1px solid #1e3a5f}' +
    '@media print{body{padding:15px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Расчёт - ' + selectedBoat.boat_name + '</title><style>' + css + '</style></head><body>' +
    '<div class="header"><div class="logo">' + t('pdf.company', lang) + '</div><div class="subtitle">' + t('pdf.footer', lang) + '</div><div class="date">' + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) + '</div></div>' +
    '<div class="yacht-info"><div class="yacht-name">' + (selectedBoat.boat_name || 'Яхта') + '</div><div class="yacht-details"><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.route', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.route_name || 'По запросу') + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.duration', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.duration || (lang === 'en' ? '8 hours' : '8 часов')) + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.guestsLabel', lang) + '</div><div class="yacht-detail-value">' + p.totalGuests + ' (' + t('pdf.adults', lang) + ': ' + (p.adults + p.extraAdults) + ', ' + (lang === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + p.children3to11 + ', ' + t('wa.under3', lang) + ': ' + p.childrenUnder3 + ')</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.boatPrice', lang) + '</div><div class="yacht-detail-value">' + fmt(boatPrice) + '</div></div></div></div>' +
    (includedOptions.length > 0 ? '<div class="section"><div class="section-title">' + t('pdf.included', lang) + '</div><div class="included-list">' + includedOptions.map(opt => '<span class="included-item">' + opt + '</span>').join('') + '</div></div>' : '') +
    extrasHtml +
    dishesHtml +
    (cateringHtml ? cateringHtml.replace('</table>', (conditionsHtml || '') + '</table>') : '') + // Hack to inject conditions
    drinksHtml +
    toysHtml +
    watersportsHtml +
    servicesHtml +
    feesHtml +
    transferHtml +
    '<div class="total-section">' +
    summaryHtml +
    '<div class="total-row final"><span>' + t('pdf.totalToPay', lang) + '</span><span>' + fmt(finalTotal) + '</span></div></div>' +
    (p.customNotes ? '<div class="section" style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border:1px solid #ffc107"><div class="section-title" style="color:#856404">' + t('pdf.notes', lang) + '</div><p style="margin:10px 0 0;color:#856404">' + p.customNotes.replace(/\n/g, '<br>') + '</p></div>' : '') +
    '<div class="footer"><p><strong>' + t('pdf.company', lang) + '</strong> — ' + t('pdf.footer', lang) + '</p><p>WhatsApp: +66 810507171 • Email: tratatobookings@gmail.com</p></div></body></html>';
}
