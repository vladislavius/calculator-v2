import { SearchResult, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder, DetailedCalcResult, BoatDrink, SelectedToy, SelectedService, SelectedFee, SelectedPartnerWatersport, PartnerMenu, BoatMenu } from './types';
import { CalcResult } from './types';
import { t, Lang } from './i18n';

interface WhatsAppParams {
  selectedBoat: SearchResult;
  totals: CalcResult;
  selectedExtras: SelectedExtra[];
  cateringOrders: CateringOrder[];
  drinkOrders: DrinkOrder[];
  selectedToys: SelectedToy[];
  selectedServices: SelectedService[];
  selectedFees: SelectedFee[];
  selectedPartnerWatersports: SelectedPartnerWatersport[];
  transferPickup: TransferOrder;
  transferDirection: 'round_trip' | 'one_way';
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

export function generateWhatsAppMessage(p: WhatsAppParams): string {
  const { selectedBoat, totals, lang: L } = p;

  // Cast totals to DetailedCalcResult to access items
  const detailedTotals = totals as DetailedCalcResult;
  const items = detailedTotals.items || [];

  // Calculate final total from items if available, or fallback to legacy
  const finalTotal = items.length > 0
    ? items.reduce((sum, i) => sum + i.total, 0) + (detailedTotals.markup || 0)
    : totals.totalClient;

  const fmt = (n: number) => n.toLocaleString() + ' THB';

  // Boat Price
  const boatItem = items.find(i => i.category === 'boat' && i.id === 'boat_base');
  const boatPrice = boatItem ? boatItem.total : (totals.client || 0);

  let message = '*' + t('wa.title', L) + '*\n\n';
  message += '*' + t('wa.yacht', L) + '* ' + selectedBoat.boat_name + '\n';
  message += '*' + t('wa.route', L) + '* ' + (selectedBoat.route_name || (L === 'en' ? 'On request' : 'По запросу')) + '\n';
  message += '*' + t('wa.duration', L) + '* ' + (selectedBoat.duration_hours || 8) + ' ' + t('wa.hours', L) + '\n';
  message += '*' + t('wa.guests', L) + '* ' + p.totalGuests + ' (' + t('wa.adultsShort', L) + ': ' + (p.adults + p.extraAdults) + ', ' + (L === 'en' ? 'children 3-11' : 'дети 3-11') + ': ' + p.children3to11 + ', ' + t('wa.under3', L) + ': ' + p.childrenUnder3 + ')\n\n';
  message += '*' + t('wa.boatPrice', L) + '* ' + fmt(boatPrice) + '\n';

  // Extra Guests (from items)
  const extraGuestsItems = items.filter(i => i.category === 'boat' && i.id !== 'boat_base');
  if (extraGuestsItems.length > 0) {
    const totalExtra = extraGuestsItems.reduce((sum, i) => sum + i.total, 0);
    message += '*' + t('wa.extraGuests', L) + ' (' + p.extraAdults + ' ' + t('wa.adultsShort', L) + ' + ' + p.children3to11 + ' ' + t('wa.childrenShort', L) + '):* +' + fmt(totalExtra) + '\n';
  }

  // Helper to generate section from items
  const appendSection = (title: string, category: string) => {
    const catItems = items.filter(i => i.category === category);
    if (catItems.length > 0) {
      message += '\n*' + title + '*\n';
      catItems.forEach(i => {
        const name = L === 'en' ? i.name : (i.nameRu || i.name);
        // For toys/watersports, unit might be 'h' or 'd', let's just use what's in unit
        const quantityStr = (category === 'toy' || category === 'watersport') ? i.quantity + ' ' + i.unit : 'x' + i.quantity;
        message += '  - ' + name + ' ' + quantityStr + ' - ' + fmt(i.total) + '\n';
      });
    }
  };

  appendSection(t('wa.extras', L), 'extra');

  // Dishes (Legacy logic as it's not in items yet fully or structured differently)
  const dishEntries = Object.entries(p.selectedDishes).filter(([, v]) => v > 0);
  if (dishEntries.length > 0) {
    message += '\n*' + t('wa.dishes', L) + '*\n';
    dishEntries.forEach(([key, count]) => {
      const parts = key.split('_');
      const setId = parts.slice(0, -2).join('_');
      const dishIdx = parseInt(parts[parts.length - 2]);
      const optIdx = parseInt(parts[parts.length - 1]);
      const menuSet = p.boatMenu.find((m) => String(m.id) === setId);
      if (menuSet && menuSet.dishes && menuSet.dishes[dishIdx]) {
        const opts = menuSet.dishes[dishIdx].split(':').slice(1).join(':').split(',').map((o: string) => o.trim());
        if (opts[optIdx]) message += '  - ' + opts[optIdx] + ' x' + count + '\n';
      }
    });
  }

  appendSection(t('wa.catering', L), 'catering');
  appendSection(t('wa.drinks', L), 'drink');
  appendSection(t('wa.toys', L), 'toy');
  appendSection(t('wa.services', L), 'service');
  appendSection(t('wa.watersports', L), 'watersport');

  // Fees
  const feeItems = items.filter(i => i.category === 'fee');
  if (feeItems.length > 0) {
    message += '\n*' + t('wa.fees', L) + '*\n';
    feeItems.forEach(i => {
      const name = L === 'en' ? i.name : (i.nameRu || i.name);
      message += '  - ' + name + ' - ' + fmt(i.total) + '\n';
    });
  }

  // Transfer
  const transferItem = items.find(i => i.category === 'transfer');
  if (transferItem && transferItem.total > 0) {
    message += '\n*' + t('wa.transfer', L) + '* ' + fmt(transferItem.total) + '\n';
    if (p.transferPickup.pickup) message += '  ' + t('wa.address', L) + ' ' + p.transferPickup.pickup + '\n';
  }

  // Summary
  message += '\n--- ' + (L === 'en' ? 'SUMMARY' : 'СВОДКА') + ' ---\n';
  message += '*' + (L === 'en' ? 'Yacht:' : 'Яхта:') + '* ' + fmt(boatPrice) + '\n';

  if (extraGuestsItems.length > 0) {
    const totalExtra = extraGuestsItems.reduce((sum, i) => sum + i.total, 0);
    message += '*' + t('wa.extraGuests', L) + ':* +' + fmt(totalExtra) + '\n';
  }

  const summaryItem = (label: string, category: string) => {
    const total = items.filter(i => i.category === category).reduce((sum, i) => sum + i.total, 0);
    if (total > 0) message += '*' + label + '* +' + fmt(total) + '\n';
  };

  summaryItem(t('wa.extras', L), 'extra');
  summaryItem(t('wa.catering', L), 'catering');
  summaryItem(t('wa.drinks', L), 'drink');
  summaryItem(t('wa.toys', L), 'toy');
  summaryItem(t('wa.services', L), 'service');
  summaryItem(t('wa.watersports', L), 'watersport');
  summaryItem(t('wa.fees', L), 'fee');
  summaryItem(t('wa.transfer', L), 'transfer');

  message += '\n*' + t('wa.total', L) + ' ' + fmt(finalTotal) + '*';

  if (p.customNotes) message += '\n\n*' + t('wa.notes', L) + '*\n' + p.customNotes;

  return message;
}
