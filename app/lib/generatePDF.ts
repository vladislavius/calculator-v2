import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder } from './types';
import { CalcResult } from './calculateTotals';
import { t, Lang } from './i18n';

interface PDFParams {
  selectedBoat: SearchResult;
  totals: CalcResult;
  boatOptions: BoatOption[];
  selectedExtras: SelectedExtra[];
  cateringOrders: CateringOrder[];
  drinkOrders: DrinkOrder[];
  boatDrinks: any[];
  selectedToys: any[];
  selectedServices: any[];
  selectedFees: any[];
  selectedPartnerWatersports: any[];
  transferPickup: TransferOrder;
  transferDirection: 'round_trip' | 'one_way';
  partnerMenus: any[];
  boatMenu: any[];
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
  const baseBoatPrice = Number(selectedBoat.calculated_total) || Number(selectedBoat.base_price) || 0;
  const boatPriceForClient = p.markupMode === "fixed" ? baseBoatPrice + p.fixedMarkup : Math.round(baseBoatPrice * (1 + p.boatMarkup / 100));

  const pdfAdultPrice = p.customAdultPrice !== null ? p.customAdultPrice : (selectedBoat.extra_pax_price || 0);
  const pdfChildPrice = p.customChildPrice !== null ? p.customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5));
  const pdfExtraGuestsSurcharge = p.extraAdults * pdfAdultPrice + p.children3to11 * pdfChildPrice;

  const finalTotal = boatPriceForClient + pdfExtraGuestsSurcharge + (totals.extras || 0) + totals.catering + totals.drinks + totals.toys + totals.services + totals.fees + totals.transfer + (totals.partnerWatersports || 0);

  const includedOptions = p.boatOptions
    .filter(opt => opt.status === 'included')
    .map(opt => lang === 'en' ? (opt.option_name || opt.option_name_ru || '') : (opt.option_name_ru || opt.option_name || ''))
    .filter(Boolean);

  const cateringItems = p.cateringOrders.map(order => {
    const price = Math.round((order.pricePerPerson || 0) * (order.persons || 1) * (1 + p.boatMarkup / 100));
    return '<tr><td>' + order.packageName + '</td><td>' + order.persons + ' чел</td><td>' + price.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const drinkItems = p.drinkOrders.map(order => {
    const drink = p.boatDrinks.find(d => d.id === order.drinkId);
    const price = (p.customPrices['drink_' + order.drinkId] || order.price || 0) * order.quantity;
    return '<tr><td>' + (lang === 'en' ? (drink?.name_en || drink?.name_ru || 'Drink') : (drink?.name_ru || drink?.name_en || 'Напиток')) + '</td><td>' + order.quantity + ' шт</td><td>' + price.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const toysItems = p.selectedToys.map((toy: any) => {
    const hours = toy.hours || 1;
    const basePrice = p.customPrices['toy_' + toy.id] || toy.pricePerHour || toy.pricePerDay || 0;
    const total = basePrice * hours;
    return '<tr><td>' + (lang === 'en' ? toy.name : (toy.nameRu || toy.name)) + '</td><td>' + hours + ' ч</td><td>' + total.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const partnerWatersportsItems = p.selectedPartnerWatersports.map((w: any) => {
    const total = (Number(w.pricePerHour) || 0) * (Number(w.hours) || 0) + (Number(w.pricePerDay) || 0) * (Number(w.days) || 0);
    const timeStr = (Number(w.hours) || 0) > 0 ? (w.hours + ' ч') : (w.days + ' дн');
    return '<tr><td>' + (lang === 'en' ? (w.name || 'Water sport') : (w.nameRu || w.name || 'Водная услуга')) + ' (' + (w.partnerName || '') + ')</td><td>' + timeStr + '</td><td>' + total.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const allToysItems = toysItems + partnerWatersportsItems;

  const serviceItems = p.selectedServices.map((s: any) => {
    const price = p.customPrices['service_' + s.id] || s.price || 0;
    return '<tr><td>' + (lang === 'en' ? s.name : (s.nameRu || s.name)) + '</td><td>' + (s.quantity || 1) + '</td><td>' + price.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const feeItems = p.selectedFees.map((fee: any) => {
    const price = (p.customPrices['fee_' + fee.id] || fee.pricePerPerson || 0) * (fee.adults + fee.children);
    return '<tr><td>' + (lang === 'en' ? fee.name : (fee.nameRu || fee.name)) + '</td><td>' + (fee.adults + fee.children) + ' чел</td><td>' + price.toLocaleString() + ' THB</td></tr>';
  }).join('');

  const transferHtml = p.transferPickup.type !== 'none' && p.transferPickup.price > 0
    ? '<tr><td>' + t('total.transfer', lang) + ' ' + (p.transferDirection === 'round_trip' ? '(' + t('transfer.roundTrip', lang) + ')' : '(' + t('transfer.oneWay', lang) + ')') + '</td><td>' + (p.transferPickup.pickup || '-') + '</td><td>' + p.transferPickup.price.toLocaleString() + ' THB</td></tr>'
    : '';

  const dishesHtml = (() => {
    const dishEntries = Object.entries(p.selectedDishes).filter(([, v]) => v > 0);
    if (dishEntries.length === 0) return '';
    let html = '<div class="section"><div class="section-title">' + t('pdf.dishes', lang) + '</div><table><tr><th>' + t('pdf.dish', lang) + '</th><th>' + t('pdf.qty', lang) + '</th></tr>';
    dishEntries.forEach(([key, count]) => {
      const parts = key.split('_');
      const setId = parts.slice(0, -2).join('_');
      const dishIdx = parseInt(parts[parts.length - 2]);
      const optIdx = parseInt(parts[parts.length - 1]);
      const menuSet = p.boatMenu.find((m: any) => String(m.id) === setId);
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

  const css = '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px 30px;color:#333;max-width:550px;margin:0 auto;font-size:11px;line-height:1.4}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #2563eb}.logo{font-size:24px;font-weight:bold;color:#2563eb;margin-bottom:4px}.subtitle{color:#666;font-size:11px}.date{color:#888;font-size:10px;margin-top:8px}.yacht-info{background:#1e40af;color:white;padding:12px 15px;border-radius:6px;margin-bottom:15px}.yacht-name{font-size:16px;font-weight:bold;margin-bottom:8px}.yacht-details{display:flex;gap:20px;font-size:10px}.yacht-detail{display:flex;flex-direction:column}.yacht-detail-label{opacity:0.8;margin-bottom:2px}.yacht-detail-value{font-weight:600}.section{margin-bottom:12px}.section-title{font-size:11px;font-weight:bold;color:#2563eb;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;text-transform:uppercase}.included-list{display:flex;flex-wrap:wrap;gap:6px}.included-item{background:#f3f4f6;color:#374151;padding:4px 10px;border-radius:4px;font-size:10px;border:1px solid #e5e7eb}table{width:100%;border-collapse:collapse;margin-top:6px;table-layout:fixed}th,td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:10px}th{text-align:left;font-weight:600;color:#6b7280;background:#f9fafb}th:first-child,td:first-child{width:auto}th:nth-child(2),td:nth-child(2){width:70px;text-align:center}th:last-child,td:last-child{width:90px;text-align:right}.total-section{background:#2563eb;color:white;padding:12px 15px;border-radius:6px;margin-top:15px}.total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px}.total-row.final{font-size:13px;font-weight:bold;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.3)}.footer{margin-top:20px;text-align:center;color:#666;font-size:9px;padding-top:15px;border-top:1px solid #e5e7eb}@media print{body{padding:15px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Расчёт - ' + selectedBoat.boat_name + '</title><style>' + css + '</style></head><body>' +
    '<div class="header"><div class="logo">' + t('pdf.company', lang) + '</div><div class="subtitle">' + t('pdf.footer', lang) + '</div><div class="date">' + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) + '</div></div>' +
    '<div class="yacht-info"><div class="yacht-name">' + (selectedBoat.boat_name || 'Яхта') + '</div><div class="yacht-details"><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.route', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.route_name || 'По запросу') + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.duration', lang) + '</div><div class="yacht-detail-value">' + (selectedBoat.duration || (lang === 'en' ? '8 hours' : '8 часов')) + '</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.guestsLabel', lang) + '</div><div class="yacht-detail-value">' + p.totalGuests + ' (' + t('pdf.adults', lang) + ': ' + (p.adults + p.extraAdults) + ', ' + (lang === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + p.children3to11 + ', ' + t('wa.under3', lang) + ': ' + p.childrenUnder3 + ')</div></div><div class="yacht-detail"><div class="yacht-detail-label">' + t('pdf.boatPrice', lang) + '</div><div class="yacht-detail-value">' + boatPriceForClient.toLocaleString() + ' THB</div></div></div></div>' +
    (includedOptions.length > 0 ? '<div class="section"><div class="section-title">' + t('pdf.included', lang) + '</div><div class="included-list">' + includedOptions.map(opt => '<span class="included-item">' + opt + '</span>').join('') + '</div></div>' : '') +
    (p.selectedExtras.length > 0 ? '<div class="section"><div class="section-title">' + t('pdf.extras', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + p.selectedExtras.map(e => '<tr><td>' + (lang === 'en' ? e.name : (e.nameRu || e.name)) + '</td><td>' + e.quantity + ' шт</td><td>' + Math.round(e.price * e.quantity * (1 + p.boatMarkup / 100)).toLocaleString() + ' THB</td></tr>').join('') + '</table></div>' : '') +
    dishesHtml +
    (cateringItems ? '<div class="section"><div class="section-title">' + t('pdf.catering', lang) + '</div>' + conditionsHtml + '<table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + cateringItems + '</table></div>' : '') +
    (drinkItems ? '<div class="section"><div class="section-title">' + t('pdf.drinks', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + drinkItems + '</table></div>' : '') +
    (allToysItems ? '<div class="section"><div class="section-title">' + t('pdf.waterToys', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.time', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + allToysItems + '</table></div>' : '') +
    (serviceItems ? '<div class="section"><div class="section-title">' + t('pdf.services', lang) + '</div><table><tr><th>' + t('pdf.service', lang) + '</th><th>' + t('pdf.qty', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + serviceItems + '</table></div>' : '') +
    (feeItems ? '<div class="section"><div class="section-title">' + t('pdf.fees', lang) + '</div><table><tr><th>' + t('pdf.name', lang) + '</th><th>' + t('pdf.guestsLabel', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + feeItems + '</table></div>' : '') +
    (transferHtml ? '<div class="section"><div class="section-title">' + t('pdf.transfer', lang) + '</div><table><tr><th>' + t('pdf.type', lang) + '</th><th>' + t('pdf.address', lang) + '</th><th>' + t('pdf.amount', lang) + '</th></tr>' + transferHtml + '</table></div>' : '') +
    '<div class="total-section">' +
    '<div class="total-row"><span>' + t('total.boatBase', lang) + '</span><span>' + boatPriceForClient.toLocaleString() + ' THB</span></div>' +
    (pdfExtraGuestsSurcharge > 0 ? '<div class="total-row"><span>' + t('total.extraGuests', lang) + ' (' + p.extraAdults + ' ' + t('pdf.adults', lang) + ' + ' + p.children3to11 + ' ' + t('pdf.children', lang) + ')</span><span>+' + pdfExtraGuestsSurcharge.toLocaleString() + ' THB</span></div>' : '') +
    ((totals.extras || 0) > 0 ? '<div class="total-row"><span>' + t('total.extras', lang) + '</span><span>+' + (totals.extras || 0).toLocaleString() + ' THB</span></div>' : '') +
    (totals.catering > 0 ? '<div class="total-row"><span>' + t('total.catering', lang) + '</span><span>+' + totals.catering.toLocaleString() + ' THB</span></div>' : '') +
    (totals.drinks > 0 ? '<div class="total-row"><span>' + t('total.drinks', lang) + '</span><span>+' + totals.drinks.toLocaleString() + ' THB</span></div>' : '') +
    (totals.toys > 0 ? '<div class="total-row"><span>' + t('total.waterToys', lang) + '</span><span>+' + totals.toys.toLocaleString() + ' THB</span></div>' : '') +
    (totals.services > 0 ? '<div class="total-row"><span>' + t('total.services', lang) + '</span><span>+' + totals.services.toLocaleString() + ' THB</span></div>' : '') +
    (totals.fees > 0 ? '<div class="total-row"><span>' + t('total.fees', lang) + '</span><span>+' + totals.fees.toLocaleString() + ' THB</span></div>' : '') +
    (totals.transfer > 0 ? '<div class="total-row"><span>' + t('total.transfer', lang) + '</span><span>+' + totals.transfer.toLocaleString() + ' THB</span></div>' : '') +
    (totals.partnerWatersports > 0 ? '<div class="total-row"><span>' + t('total.watersports', lang) + '</span><span>+' + totals.partnerWatersports.toLocaleString() + ' THB</span></div>' : '') +
    '<div class="total-row final"><span>' + t('pdf.totalToPay', lang) + '</span><span>' + finalTotal.toLocaleString() + ' THB</span></div></div>' +
    (p.customNotes ? '<div class="section" style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border:1px solid #ffc107"><div class="section-title" style="color:#856404">' + t('pdf.notes', lang) + '</div><p style="margin:10px 0 0;color:#856404">' + p.customNotes.replace(/\n/g, '<br>') + '</p></div>' : '') +
    '<div class="footer"><p><strong>' + t('pdf.company', lang) + '</strong> — ' + t('pdf.footer', lang) + '</p><p>WhatsApp: +66 810507171 • Email: tratatobookings@gmail.com</p></div></body></html>';
}
