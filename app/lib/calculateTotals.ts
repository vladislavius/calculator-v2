import { SearchResult, SelectedExtra, ReceiptItem, DetailedCalcResult } from './types';

interface CalcParams {
  selectedBoat: SearchResult | null;
  selectedExtras: SelectedExtra[];
  cateringOrders: any[];
  drinkOrders: any[];
  selectedToys: any[];
  selectedServices: any[];
  selectedFees: any[];
  selectedPartnerWatersports: any[];
  transferPickup: any;
  transferDropoff: any;
  transferPrice: number;
  transferMarkup: number;
  landingEnabled: boolean;
  landingFee: number;
  defaultParkFeeEnabled: boolean;
  defaultParkFee: number;
  defaultParkFeeAdults: number;
  defaultParkFeeChildren: number;
  corkageFee: number;
  extraAdults: number;
  children3to11: number;
  childrenUnder3: number;
  adults: number;
  customAdultPrice: number | null;
  customChildPrice: number | null;
  boatMarkup: number;
  fixedMarkup: number;
  markupMode: "percent" | "fixed";
  markupPercent: number;
  customPrices: Record<string, number>;
}

// Helper: get custom price or fallback to original
const cp = (prices: Record<string, number>, key: string, original: number): number => {
  return prices[key] !== undefined ? prices[key] : original;
};

export function calculateTotals(p: CalcParams): DetailedCalcResult {
  if (!p.selectedBoat) {
    return {
      agent: 0, client: 0, childrenDiscount: 0, extras: 0, catering: 0, drinks: 0,
      toys: 0, services: 0, transfer: 0, fees: 0, partnerWatersports: 0, markup: 0,
      totalAgent: 0, totalClient: 0, items: []
    };
  }

  const items: ReceiptItem[] = [];

  // 1. Boat Base Price
  const baseAgent = Number(p.selectedBoat.calculated_agent_total) || Number(p.selectedBoat.base_price) || 0;
  const baseClient = Number(p.selectedBoat.calculated_total) || Number(p.selectedBoat.base_price) || 0;

  const boatPriceWithMarkup = p.markupMode === "fixed"
    ? baseClient + p.fixedMarkup
    : Math.round(baseClient * (1 + p.boatMarkup / 100));

  items.push({
    id: 'boat_base',
    name: p.selectedBoat.boat_name,
    nameRu: p.selectedBoat.boat_name,
    quantity: 1,
    unit: 'fix',
    price: boatPriceWithMarkup,
    total: boatPriceWithMarkup,
    category: 'boat'
  });

  // 2. Extra Guests
  const adultPriceToUse = p.customAdultPrice !== null ? p.customAdultPrice : (p.selectedBoat?.extra_pax_price || 0);
  const childPriceToUse = p.customChildPrice !== null ? p.customChildPrice : (p.selectedBoat?.child_price_3_11 || Math.round((p.selectedBoat?.extra_pax_price || 0) * 0.5));

  if (p.extraAdults > 0) {
    items.push({
      id: 'extra_adults',
      name: 'Extra Adults',
      nameRu: 'Доп. взрослые',
      quantity: p.extraAdults,
      unit: 'pax',
      price: adultPriceToUse,
      total: p.extraAdults * adultPriceToUse,
      category: 'boat'
    });
  }

  if (p.children3to11 > 0) {
    items.push({
      id: 'child_3_11',
      name: 'Children (3-11)',
      nameRu: 'Дети (3-11)',
      quantity: p.children3to11,
      unit: 'pax',
      price: childPriceToUse,
      total: p.children3to11 * childPriceToUse,
      category: 'boat'
    });
  }

  // 3. Extras
  p.selectedExtras.forEach(e => {
    const total = e.price * e.quantity;
    items.push({
      id: `extra_${e.optionId}`,
      name: e.name,
      nameRu: e.nameRu,
      quantity: e.quantity,
      unit: e.pricePer,
      price: e.price,
      total: total,
      category: 'extra'
    });
  });

  // 4. Catering
  p.cateringOrders.forEach(c => {
    const total = c.pricePerPerson * c.persons;
    items.push({
      id: `catering_${c.packageId}`,
      name: c.packageName,
      nameRu: c.packageName,
      quantity: c.persons,
      unit: 'pax',
      price: c.pricePerPerson,
      total: total,
      category: 'catering',
      details: c.notes
    });
  });

  // 5. Drinks
  if (p.corkageFee > 0) {
    items.push({
      id: 'corkage_fee',
      name: 'Corkage Fee',
      nameRu: 'Пробковый сбор',
      quantity: 1,
      unit: 'fix',
      price: p.corkageFee,
      total: p.corkageFee,
      category: 'drink'
    });
  }

  p.drinkOrders.forEach(d => {
    const price = cp(p.customPrices, 'drink_' + d.drinkId, d.price || 0);
    const total = price * (d.quantity || 1);
    items.push({
      id: `drink_${d.drinkId}`,
      name: d.name,
      nameRu: d.nameRu || d.name,
      quantity: d.quantity || 1,
      unit: d.unit || 'pcs',
      price: price,
      total: total,
      category: 'drink'
    });
  });

  // 6. Water Toys
  p.selectedToys.forEach(t => {
    const price = cp(p.customPrices, 'opt_' + t.id, t.pricePerHour || t.pricePerDay || 0);
    const hours = t.hours || 1;
    const days = t.days || 0;
    const useDays = days > 0;
    const quantity = t.quantity || 1;
    // Calculation Bug Fixed Here: Price * Time * Quantity
    const total = (price * (useDays ? days : hours)) * quantity;

    items.push({
      id: `toy_${t.id}`,
      name: t.name,
      nameRu: t.nameRu || t.name,
      quantity: quantity,
      unit: useDays ? (days + 'd') : (hours + 'h'),
      price: price, // Base price per unit time
      total: total,
      category: 'toy'
    });
  });

  // 7. Services
  p.selectedServices.forEach(s => {
    const price = cp(p.customPrices, 'service_' + s.id, s.price || 0);
    const total = price * (s.quantity || 1);
    items.push({
      id: `service_${s.id}`,
      name: s.name,
      nameRu: s.nameRu || s.name,
      quantity: s.quantity || 1,
      unit: 'pcs',
      price: price,
      total: total,
      category: 'service'
    });
  });

  // 8. Partner Watersports
  p.selectedPartnerWatersports.forEach(w => {
    const pricePerHour = Number(w.pricePerHour) || 0;
    const pricePerDay = Number(w.pricePerDay) || 0;
    const hours = Number(w.hours) || 0;
    const days = Number(w.days) || 0;

    // Assuming simple logic for now, similar to toys but separated
    const total = (pricePerHour * hours) + (pricePerDay * days);

    items.push({
      id: `watersport_${w.id || Math.random()}`,
      name: w.name,
      nameRu: w.nameRu || w.name,
      quantity: 1, // Logic suggests 1 booking item with calculated time
      unit: hours > 0 ? (hours + 'h') : (days + 'd'),
      price: total, // Treating the whole slot as one priced item for now
      total: total,
      category: 'watersport',
      partnerId: w.partnerId
    });
  });

  // 9. Fees
  if (p.landingEnabled) {
    items.push({
      id: 'landing_fee',
      name: 'Landing Fee',
      nameRu: 'Сбор за высадку',
      quantity: 1,
      unit: 'fix',
      price: p.landingFee,
      total: p.landingFee,
      category: 'fee'
    });
  }

  if (p.defaultParkFeeEnabled) {
    const parkTotal = p.defaultParkFee * (p.defaultParkFeeAdults + p.defaultParkFeeChildren);
    items.push({
      id: 'park_fee',
      name: 'National Park Fee',
      nameRu: 'Парковый сбор',
      quantity: p.defaultParkFeeAdults + p.defaultParkFeeChildren,
      unit: 'pax',
      price: p.defaultParkFee,
      total: parkTotal,
      category: 'fee'
    });
  }

  p.selectedFees.forEach(f => {
    const price = cp(p.customPrices, 'fee_' + f.id, f.pricePerPerson || 0);
    const qty = f.adults + f.children;
    const total = price * qty;
    items.push({
      id: `fee_${f.id}`,
      name: f.name,
      nameRu: f.nameRu || f.name,
      quantity: qty,
      unit: 'pax',
      price: price,
      total: total,
      category: 'fee'
    });
  });

  // 10. Transfer
  let transferTotal = p.transferPickup.price + p.transferDropoff.price;
  if (p.transferPrice > 0) {
    transferTotal += Math.round(p.transferPrice * (1 + p.transferMarkup / 100));
  }
  if (transferTotal > 0) {
    items.push({
      id: 'transfer',
      name: 'Transfer',
      nameRu: 'Трансфер',
      quantity: 1,
      unit: 'trip',
      price: transferTotal,
      total: transferTotal,
      category: 'transfer',
      details: p.transferPickup.type !== 'none' ? p.transferPickup.pickup : undefined
    });
  }

  // Calculate Subtotals
  const subtotals = items.reduce((acc, item) => {
    const cat = item.category === 'boat' ? (_ => 'client')() : item.category; // Map boat to client logic? No, keep pure categories
    // Actually we need to map categories to specific result fields
    return acc;
  }, {});

  const getSum = (cat: string) => items.filter(i => i.category === cat).reduce((sum, i) => sum + i.total, 0);

  // Boat sum includes base + extra guests
  const totalClientBoats = items.filter(i => i.category === 'boat').reduce((sum, i) => sum + i.total, 0);

  const extrasTotal = getSum('extra');
  const cateringTotal = getSum('catering');
  const drinksTotal = getSum('drink');
  const toysTotal = getSum('toy');
  const servicesTotal = getSum('service');
  const feesTotal = getSum('fee');
  const partnerWatersportsTotal = getSum('watersport');
  const transferTotalSum = getSum('transfer');

  const totalBeforeMarkup = totalClientBoats + extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + feesTotal + partnerWatersportsTotal + transferTotalSum;

  const markupAmount = p.markupPercent > 0 ? Math.round(totalBeforeMarkup * p.markupPercent / 100) : 0;

  return {
    agent: baseAgent,
    client: baseClient,
    childrenDiscount: 0,
    extras: extrasTotal,
    catering: cateringTotal,
    drinks: drinksTotal,
    toys: toysTotal,
    services: servicesTotal,
    transfer: transferTotalSum,
    fees: feesTotal,
    partnerWatersports: partnerWatersportsTotal,
    markup: markupAmount,
    totalAgent: baseAgent + extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + feesTotal + partnerWatersportsTotal + transferTotalSum, // Roughly
    totalClient: totalBeforeMarkup + markupAmount,
    items: items
  };
}
