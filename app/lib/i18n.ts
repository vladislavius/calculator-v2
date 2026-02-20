const translations: Record<string, Record<string, string>> = {
  // Search panel
  'search.title': { ru: 'Поиск яхт', en: 'Yacht Search' },
  'search.destination': { ru: 'Куда плывём?', en: 'Where to?' },
  'search.date': { ru: 'Дата', en: 'Date' },
  'search.guests': { ru: 'Гостей', en: 'Guests' },
  'search.budget': { ru: 'Бюджет до', en: 'Budget up to' },
  'search.boatType': { ru: 'Тип яхты', en: 'Boat type' },
  'search.all': { ru: 'Все', en: 'All' },
  'search.button': { ru: 'Найти яхту', en: 'Find a yacht' },
  'search.results': { ru: 'результатов', en: 'results' },
  'search.noResults': { ru: 'Яхты не найдены. Попробуйте изменить параметры поиска.', en: 'No yachts found. Try changing search parameters.' },
  'search.searching': { ru: 'Ищем лучшие варианты...', en: 'Searching for best options...' },
  'search.season': { ru: 'Сезон', en: 'Season' },
  'search.seasonHigh': { ru: 'Высокий', en: 'High' },
  'search.seasonLow': { ru: 'Низкий', en: 'Low' },
  'search.boatName': { ru: 'Название яхты', en: 'Boat name' },

  // Boat card
  'boat.from': { ru: 'от', en: 'from' },
  'boat.guests': { ru: 'гостей', en: 'guests' },
  'boat.hours': { ru: 'часов', en: 'hours' },
  'boat.details': { ru: 'Подробнее', en: 'Details' },
  'boat.basePax': { ru: 'Базовое кол-во', en: 'Base pax' },
  'boat.maxGuests': { ru: 'Макс. гостей', en: 'Max guests' },

  // Boat modal - guests
  'guests.title': { ru: 'Гости на борту', en: 'Guests on board' },
  'guests.adults': { ru: 'Взрослые (базовые)', en: 'Adults (base)' },
  'guests.extraAdults': { ru: 'Доп. взрослые', en: 'Extra adults' },
  'guests.children3to11': { ru: 'Дети 3-11 лет', en: 'Children 3-11' },
  'guests.childrenUnder3': { ru: 'Дети до 3 лет', en: 'Children under 3' },
  'guests.total': { ru: 'Всего гостей', en: 'Total guests' },
  'guests.of': { ru: 'из', en: 'of' },
  'guests.perPerson': { ru: 'за чел', en: 'per person' },
  'guests.free': { ru: 'бесплатно', en: 'free' },

  // Included
  'included.title': { ru: 'ВКЛЮЧЕНО В СТОИМОСТЬ', en: 'INCLUDED' },
  'included.alsoIncluded': { ru: 'Также включено:', en: 'Also included:' },

  // Food & catering
  'food.title': { ru: 'ПИТАНИЕ', en: 'CATERING' },
  'food.includedTitle': { ru: 'Включено в стоимость — выберите сеты:', en: 'Included — select sets:' },
  'food.conditions': { ru: 'Условия:', en: 'Conditions:' },
  'food.persons': { ru: 'чел', en: 'prs' },
  'food.partnerCatering': { ru: 'Кейтеринг от партнёров', en: 'Partner catering' },
  'food.dishChoice': { ru: 'Выбор блюд', en: 'Dish selection' },

  // Drinks
  'drinks.title': { ru: 'НАПИТКИ И АЛКОГОЛЬ', en: 'DRINKS & ALCOHOL' },
  'drinks.corkage': { ru: 'Пробковый сбор', en: 'Corkage fee' },

  // Park fees
  'fees.title': { ru: 'ПАРКОВЫЕ СБОРЫ И ВЫСАДКА', en: 'PARK FEES & LANDING' },
  'fees.mandatory': { ru: 'обязательно', en: 'mandatory' },
  'fees.perPerson': { ru: 'за чел', en: 'per person' },

  // Water toys
  'toys.title': { ru: 'ВОДНЫЕ РАЗВЛЕЧЕНИЯ', en: 'WATER TOYS' },
  'toys.perHour': { ru: 'в час', en: 'per hour' },
  'toys.perDay': { ru: 'в день', en: 'per day' },

  // Services
  'services.title': { ru: 'ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ', en: 'ADDITIONAL SERVICES' },

  // Watersports
  'watersports.title': { ru: 'ВОДНЫЙ СПОРТ', en: 'WATER SPORTS' },

  // Transfer
  'transfer.title': { ru: 'ТРАНСФЕР', en: 'TRANSFER' },
  'transfer.none': { ru: 'Без трансфера', en: 'No transfer' },
  'transfer.standard': { ru: 'Стандарт', en: 'Standard' },
  'transfer.minivan': { ru: 'Минивэн', en: 'Minivan' },
  'transfer.vip': { ru: 'VIP', en: 'VIP' },
  'transfer.own': { ru: 'Свой транспорт', en: 'Own transport' },
  'transfer.pickup': { ru: 'Адрес подачи', en: 'Pickup address' },
  'transfer.dropoff': { ru: 'Адрес возврата', en: 'Dropoff address' },
  'transfer.oneWay': { ru: 'В одну сторону', en: 'One way' },
  'transfer.roundTrip': { ru: 'Туда-обратно', en: 'Round trip' },

  // Totals
  'total.title': { ru: 'ИТОГО', en: 'TOTAL' },
  'total.markup': { ru: 'Наша наценка', en: 'Our markup' },
  'total.boatBase': { ru: 'Яхта (базовая цена)', en: 'Yacht (base price)' },
  'total.extraGuests': { ru: 'Доп. гости', en: 'Extra guests' },
  'total.extras': { ru: 'Доп. опции', en: 'Extras' },
  'total.catering': { ru: 'Питание', en: 'Catering' },
  'total.drinks': { ru: 'Напитки', en: 'Drinks' },
  'total.waterToys': { ru: 'Водные развлечения', en: 'Water toys' },
  'total.services': { ru: 'Услуги', en: 'Services' },
  'total.watersports': { ru: 'Водные услуги', en: 'Water sports' },
  'total.fees': { ru: 'Парковые сборы', en: 'Park fees' },
  'total.transfer': { ru: 'Трансфер', en: 'Transfer' },
  'total.markupLine': { ru: 'Наценка', en: 'Markup' },
  'total.clientPrice': { ru: 'ЦЕНА ДЛЯ КЛИЕНТА', en: 'CLIENT PRICE' },
  'total.agentPrice': { ru: 'Агентская цена', en: 'Agent price' },
  'total.profit': { ru: 'Наш доход', en: 'Our profit' },

  // Notes
  'notes.title': { ru: 'Заметки / Примечания:', en: 'Notes / Remarks:' },
  'notes.placeholder': { ru: 'Например: Обед в ресторане – кэш-ваучер 500 THB/чел для спидбота...', en: 'E.g.: Restaurant lunch – 500 THB/person cash voucher for speedboat...' },

  // Buttons
  'btn.pdf': { ru: 'Создать PDF', en: 'Generate PDF' },
  'btn.whatsapp': { ru: 'Отправить в WhatsApp', en: 'Send via WhatsApp' },
  'btn.close': { ru: 'Закрыть', en: 'Close' },
  'btn.back': { ru: 'Назад к результатам', en: 'Back to results' },

  // PDF
  'pdf.title': { ru: 'Аренда яхт на Пхукете', en: 'Yacht Charter in Phuket' },
  'pdf.company': { ru: 'ОСТРОВ СОКРОВИЩ', en: 'TREASURE ISLAND' },
  'pdf.route': { ru: 'Маршрут', en: 'Route' },
  'pdf.duration': { ru: 'Длительность', en: 'Duration' },
  'pdf.guestsLabel': { ru: 'Гостей', en: 'Guests' },
  'pdf.boatPrice': { ru: 'Стоимость яхты', en: 'Yacht price' },
  'pdf.included': { ru: 'ВКЛЮЧЕНО В СТОИМОСТЬ', en: 'INCLUDED' },
  'pdf.catering': { ru: 'ПИТАНИЕ', en: 'CATERING' },
  'pdf.drinks': { ru: 'НАПИТКИ', en: 'DRINKS' },
  'pdf.waterToys': { ru: 'ВОДНЫЕ РАЗВЛЕЧЕНИЯ', en: 'WATER ENTERTAINMENT' },
  'pdf.services': { ru: 'ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ', en: 'ADDITIONAL SERVICES' },
  'pdf.fees': { ru: 'ПАРКОВЫЕ СБОРЫ', en: 'PARK FEES' },
  'pdf.transfer': { ru: 'ТРАНСФЕР', en: 'TRANSFER' },
  'pdf.dishes': { ru: 'ВЫБОР БЛЮД', en: 'DISH SELECTION' },
  'pdf.extras': { ru: 'ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ', en: 'ADDITIONAL OPTIONS' },
  'pdf.totalToPay': { ru: 'ИТОГО К ОПЛАТЕ', en: 'TOTAL TO PAY' },
  'pdf.notes': { ru: 'ПРИМЕЧАНИЯ', en: 'NOTES' },
  'pdf.footer': { ru: 'Аренда яхт на Пхукете', en: 'Yacht Charter in Phuket' },
  'pdf.adults': { ru: 'взр', en: 'adults' },
  'pdf.children': { ru: 'дет', en: 'children' },
  'pdf.pieces': { ru: 'шт', en: 'pcs' },
  'pdf.persons': { ru: 'чел', en: 'prs' },
  'pdf.hoursShort': { ru: 'ч', en: 'h' },
  'pdf.daysShort': { ru: 'дн', en: 'd' },
  'pdf.name': { ru: 'Название', en: 'Name' },
  'pdf.qty': { ru: 'Кол-во', en: 'Qty' },
  'pdf.amount': { ru: 'Сумма', en: 'Amount' },
  'pdf.dish': { ru: 'Блюдо', en: 'Dish' },
  'pdf.service': { ru: 'Услуга', en: 'Service' },
  'pdf.type': { ru: 'Тип', en: 'Type' },
  'pdf.address': { ru: 'Адрес', en: 'Address' },
  'pdf.time': { ru: 'Время', en: 'Time' },
  'pdf.included_word': { ru: 'Включено', en: 'Included' },
  'pdf.conditions': { ru: 'Условия:', en: 'Conditions:' },
  'pdf.byRequest': { ru: 'По запросу', en: 'On request' },
  'pdf.hoursLong': { ru: 'часов', en: 'hours' },

  // WhatsApp
  'wa.title': { ru: 'ЗАПРОС НА БРОНИРОВАНИЕ', en: 'BOOKING REQUEST' },
  'wa.yacht': { ru: 'Яхта:', en: 'Yacht:' },
  'wa.route': { ru: 'Маршрут:', en: 'Route:' },
  'wa.duration': { ru: 'Длительность:', en: 'Duration:' },
  'wa.guests': { ru: 'Гостей:', en: 'Guests:' },
  'wa.boatPrice': { ru: 'Стоимость яхты:', en: 'Yacht price:' },
  'wa.extraGuests': { ru: 'Доп. гости', en: 'Extra guests' },
  'wa.extras': { ru: 'Доп. опции:', en: 'Extras:' },
  'wa.dishes': { ru: 'Выбор блюд:', en: 'Dish selection:' },
  'wa.catering': { ru: 'Питание:', en: 'Catering:' },
  'wa.drinks': { ru: 'Напитки:', en: 'Drinks:' },
  'wa.toys': { ru: 'Водные игрушки:', en: 'Water toys:' },
  'wa.services': { ru: 'Услуги:', en: 'Services:' },
  'wa.watersports': { ru: 'Водный спорт:', en: 'Water sports:' },
  'wa.fees': { ru: 'Парковые сборы:', en: 'Park fees:' },
  'wa.transfer': { ru: 'Трансфер:', en: 'Transfer:' },
  'wa.summary': { ru: '--- СВОДКА ---', en: '--- SUMMARY ---' },
  'wa.total': { ru: 'ИТОГО К ОПЛАТЕ:', en: 'TOTAL TO PAY:' },
  'wa.notes': { ru: 'Примечания:', en: 'Notes:' },
  'wa.adultsShort': { ru: 'взр', en: 'adults' },
  'wa.childrenShort': { ru: 'дет', en: 'children' },
  'wa.under3': { ru: 'до 3', en: 'under 3' },
  'wa.address': { ru: 'Адрес:', en: 'Address:' },
  'wa.hours': { ru: 'часов', en: 'hours' },
  'wa.persons': { ru: 'чел', en: 'prs' },

  // Tabs in modal
  'tab.included': { ru: 'Включено', en: 'Included' },
  'tab.food': { ru: 'Еда', en: 'Food' },
  'tab.drinks': { ru: 'Напитки', en: 'Drinks' },
  'tab.transfer': { ru: 'Трансфер', en: 'Transfer' },

  // Misc
  'misc.onRequest': { ru: 'По запросу', en: 'On request' },
  'misc.included': { ru: 'Включено', en: 'Included' },
  'misc.paid': { ru: 'Платно', en: 'Paid' },
  
  'search.partner': { ru: 'Партнёр', en: 'Partner' },
  'search.allPartners': { ru: 'Все партнёры', en: 'All partners' },
  'search.duration': { ru: 'Длительность', en: 'Duration' },
  'search.fullDay': { ru: 'Полный день', en: 'Full day' },
  'search.sort': { ru: 'Сортировка', en: 'Sort' },
  'search.found': { ru: 'Найдено', en: 'Found' },
  'search.resultsOn': { ru: 'вариантов на', en: 'results on' },
  'boat.select': { ru: 'Выбрать →', en: 'Select →' },
  'boat.upTo': { ru: 'до', en: 'up to' },
  'boat.persons': { ru: 'чел', en: 'prs' },
  'boat.cabins': { ru: 'каюты', en: 'cabins' },
  'boat.basePrice': { ru: 'Базовая цена', en: 'Base price' },
  'notIncluded.title': { ru: 'НЕ ВКЛЮЧЕНО (нужно доплатить или взять своё)', en: 'NOT INCLUDED (extra charge or bring your own)' },
  'notIncluded.subtitle': { ru: 'нужно доплатить или взять своё', en: 'extra charge or bring your own' },
  'food.wantUpgrade': { ru: 'Хотите улучшить?', en: 'Want to upgrade?' },
  'drinks.addAlcohol': { ru: 'Добавить алкоголь?', en: 'Add alcohol?' },
  'drinks.noInfo': { ru: 'Информация о напитках не указана в контракте', en: 'Drink information not specified in contract' },
  'transfer.ownTransfer': { ru: 'Наш трансфер', en: 'Our transfer' },
  'transfer.standardMinivan': { ru: 'Стандартный минивэн', en: 'Standard minivan' },
  'toys.partnerWatersports': { ru: 'Водные развлечения от партнёров', en: 'Partner water sports' },
  'misc.partners': { ru: 'партнёров', en: 'partners' },
  'boat.surcharge': { ru: 'Доплата', en: 'Surcharge' },
  'header.subtitle': { ru: 'Профессиональный калькулятор чартеров', en: 'Professional Charter Calculator' },
};


export type Lang = 'ru' | 'en';

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['ru'] || key;
}

export default translations;
