import { SearchResult, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder } from './types';
import { CalcResult } from './calculateTotals';
import { t, Lang } from './i18n';

interface WhatsAppParams {
  selectedBoat: SearchResult;
  totals: CalcResult;
  selectedExtras: SelectedExtra[];
  cateringOrders: CateringOrder[];
  drinkOrders: DrinkOrder[];
  selectedToys: any[];
  selectedServices: any[];
  selectedFees: any[];
  selectedPartnerWatersports: any[];
  transferPickup: TransferOrder;
  transferDirection: 'round_trip' | 'one_way';
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

export function generateWhatsAppMessage(p: WhatsAppParams): string {
  const { selectedBoat, totals, lang: L } = p;
  const baseBoatPrice = Number(selectedBoat.calculated_total) || Number(selectedBoat.base_price) || 0;
  const boatPriceForClient = p.markupMode === "fixed" ? baseBoatPrice + p.fixedMarkup : Math.round(baseBoatPrice * (1 + p.boatMarkup / 100));
  const adultPriceToUse = p.customAdultPrice !== null ? p.customAdultPrice : (selectedBoat.extra_pax_price || 0);
  const childPriceToUse = p.customChildPrice !== null ? p.customChildPrice : (selectedBoat.child_price_3_11 || Math.round((selectedBoat.extra_pax_price || 0) * 0.5));
  const extraAdultsSurch = p.extraAdults * adultPriceToUse;
  const children3to11Surch = p.children3to11 * childPriceToUse;

  let message = '*' + t('wa.title', L) + '*\n\n';
  message += '*' + t('wa.yacht', L) + '* ' + selectedBoat.boat_name + '\n';
  message += '*' + t('wa.route', L) + '* ' + (selectedBoat.route_name || (L === 'en' ? 'On request' : 'По запросу')) + '\n';
  message += '*' + t('wa.duration', L) + '* ' + (selectedBoat.duration_hours || 8) + ' ' + t('wa.hours', L) + '\n';
  message += '*' + t('wa.guests', L) + '* ' + p.totalGuests + ' (' + t('wa.adultsShort', L) + ': ' + (p.adults + p.extraAdults) + ', ' + (L === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + p.children3to11 + ', ' + t('wa.under3', L) + ': ' + p.childrenUnder3 + ')\n\n';
  message += '*' + t('wa.boatPrice', L) + '* ' + boatPriceForClient.toLocaleString() + ' THB\n';

  if (extraAdultsSurch + children3to11Surch > 0) {
    message += '*' + t('wa.extraGuests', L) + ' (' + p.extraAdults + ' ' + t('wa.adultsShort', L) + ' + ' + p.children3to11 + ' ' + t('wa.childrenShort', L) + '):* +' + (extraAdultsSurch + children3to11Surch).toLocaleString() + ' THB\n';
  }

  if (p.selectedExtras.length > 0) {
    message += '\n*' + t('wa.extras', L) + '*\n';
    p.selectedExtras.forEach(e => {
      message += '  - ' + (L === 'en' ? e.name : (e.nameRu || e.name)) + ' x' + e.quantity + ' - ' + (e.price * e.quantity).toLocaleString() + ' THB\n';
    });
  }

  const dishEntries = Object.entries(p.selectedDishes).filter(([, v]) => v > 0);
  if (dishEntries.length > 0) {
    message += '\n*' + t('wa.dishes', L) + '*\n';
    dishEntries.forEach(([key, count]) => {
      const parts = key.split('_');
      const setId = parts.slice(0, -2).join('_');
      const dishIdx = parseInt(parts[parts.length - 2]);
      const optIdx = parseInt(parts[parts.length - 1]);
      const menuSet = p.boatMenu.find((m: any) => String(m.id) === setId);
      if (menuSet && menuSet.dishes && menuSet.dishes[dishIdx]) {
        const opts = menuSet.dishes[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim());
        if (opts[optIdx]) message += '  - ' + opts[optIdx] + ' x' + count + '\n';
      }
    });
  }

  if (p.cateringOrders.length > 0) {
    message += '\n*' + t('wa.catering', L) + '*\n';
    p.cateringOrders.forEach(order => {
      const priceWithMarkup = Math.round(order.pricePerPerson * (1 + p.boatMarkup / 100));
      message += '  - ' + order.packageName + ' (' + order.persons + ' ' + t('wa.persons', L) + ') - ' + (priceWithMarkup * order.persons).toLocaleString() + ' THB\n';
    });
  }

  if (p.drinkOrders.length > 0) {
    message += '\n*' + t('wa.drinks', L) + '*\n';
    p.drinkOrders.forEach(order => {
      const price = p.customPrices['drink_' + order.drinkId] || order.price;
      message += '  - ' + order.name + ' x' + order.quantity + ' - ' + (price * order.quantity).toLocaleString() + ' THB\n';
    });
  }

  if (p.selectedToys.length > 0) {
    message += '\n*' + t('wa.toys', L) + '*\n';
    p.selectedToys.forEach((t2: any) => {
      const cost = ((t2.pricePerHour || 0) * (t2.hours || 1) + (t2.pricePerDay || 0) * (t2.days || 0)) * (t2.quantity || 1);
      message += '  - ' + (L === 'en' ? t2.name : (t2.nameRu || t2.name)) + ' - ' + cost.toLocaleString() + ' THB\n';
    });
  }

  if (p.selectedServices.length > 0) {
    message += '\n*' + t('wa.services', L) + '*\n';
    p.selectedServices.forEach((s: any) => {
      message += '  - ' + (L === 'en' ? s.name : (s.nameRu || s.name)) + ' x' + (s.quantity || 1) + ' - ' + ((s.price || 0) * (s.quantity || 1)).toLocaleString() + ' THB\n';
    });
  }

  if (p.selectedPartnerWatersports.length > 0) {
    message += '\n*' + t('wa.watersports', L) + '*\n';
    p.selectedPartnerWatersports.forEach((w: any) => {
      const cost = (Number(w.pricePerHour) || 0) * (Number(w.hours) || 0) + (Number(w.pricePerDay) || 0) * (Number(w.days) || 0);
      message += '  - ' + (L === 'en' ? w.name : (w.nameRu || w.name)) + ' - ' + cost.toLocaleString() + ' THB\n';
    });
  }

  if (p.selectedFees.length > 0) {
    message += '\n*' + t('wa.fees', L) + '*\n';
    p.selectedFees.forEach((fee: any) => {
      const price = p.customPrices['fee_' + fee.id] || fee.pricePerPerson;
      message += '  - ' + (L === 'en' ? fee.name : (fee.nameRu || fee.name)) + ' - ' + (price * (fee.adults + fee.children)).toLocaleString() + ' THB\n';
    });
  }

  if (p.transferPickup.type !== 'none' && p.transferPickup.price > 0) {
    message += '\n*' + t('wa.transfer', L) + '* ' + p.transferPickup.price.toLocaleString() + ' THB\n';
    if (p.transferPickup.pickup) message += '  ' + t('wa.address', L) + ' ' + p.transferPickup.pickup + '\n';
  }

  const finalTotal = totals.totalClient || 0;
  message += '\n--- ' + (L === 'en' ? 'SUMMARY' : 'СВОДКА') + ' ---\n';
  message += '*' + (L === 'en' ? 'Yacht:' : 'Яхта:') + '* ' + boatPriceForClient.toLocaleString() + ' THB\n';
  if (extraAdultsSurch + children3to11Surch > 0) message += '*' + t('wa.extraGuests', L) + ':* +' + (extraAdultsSurch + children3to11Surch).toLocaleString() + ' THB\n';
  if ((totals.extras || 0) > 0) message += '*' + t('wa.extras', L) + '* +' + (totals.extras || 0).toLocaleString() + ' THB\n';
  if (totals.catering > 0) message += '*' + t('wa.catering', L) + '* +' + totals.catering.toLocaleString() + ' THB\n';
  if (totals.drinks > 0) message += '*' + t('wa.drinks', L) + '* +' + totals.drinks.toLocaleString() + ' THB\n';
  if (totals.toys > 0) message += '*' + t('wa.toys', L) + '* +' + totals.toys.toLocaleString() + ' THB\n';
  if (totals.services > 0) message += '*' + t('wa.services', L) + '* +' + totals.services.toLocaleString() + ' THB\n';
  if ((totals.partnerWatersports || 0) > 0) message += '*' + t('wa.watersports', L) + '* +' + (totals.partnerWatersports || 0).toLocaleString() + ' THB\n';
  if (totals.fees > 0) message += '*' + t('wa.fees', L) + '* +' + totals.fees.toLocaleString() + ' THB\n';
  if (totals.transfer > 0) message += '*' + t('wa.transfer', L) + '* +' + totals.transfer.toLocaleString() + ' THB\n';
  message += '\n*' + t('wa.total', L) + ' ' + finalTotal.toLocaleString() + ' THB*';
  if (p.customNotes) message += '\n\n*' + t('wa.notes', L) + '*\n' + p.customNotes;

  return message;
}
