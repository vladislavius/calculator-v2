export interface SearchResult {
  boat_id: number;
  boat_name: string;
  boat_type: string;
  length_ft: number;
  max_guests: number;
  cabin_count: number;
  crew_count: number;
  description: string;
  main_photo_url: string;
  website_url?: string;
  partner_name: string;
  partner_id: number;
  route_name: string;
  route_name_ru?: string;
  destination: string;
  duration_hours: number;
  duration?: string;
  base_price: number;
  agent_price: number;
  client_price: number;
  extra_pax_price: number;
  child_price_3_11: number;
  child_free_under: number;
  fuel_surcharge: number;
  calculated_total: number;
  calculated_agent_total: number;
  base_pax: number;
  marina_name: string;
  departure_pier?: string;
  chat_url?: string;
  calendar_url?: string;
  season?: string;
}

export interface BoatOption {
  id: number;
  option_name: string;
  option_name_ru: string;
  option_category: string;
  category_code: string;
  status: string;
  price: number | null;
  price_per: string | null;
  quantity_included: number | null;
  notes: string | null;
}

export interface SelectedExtra {
  optionId: number;
  name: string;
  nameRu: string;
  quantity: number;
  price: number;
  pricePer: string;
  category: string;
}

export interface CateringOrder {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  persons: number;
  minPersons?: number;
  notes: string;
}

export interface DrinkOrder {
  drinkId: number; // Changed to number
  name: string;
  nameRu?: string;
  price: number;
  quantity: number;
  unit: string;
  included?: boolean;
}

export interface TransferOrder {
  type: 'none' | 'standard' | 'minivan' | 'vip' | 'own';
  pickup: string;
  dropoff: string;
  price: number;
  notes: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  nameRu?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  category: 'boat' | 'extra' | 'catering' | 'drink' | 'toy' | 'service' | 'fee' | 'transfer' | 'watersport';
  details?: string;
  partnerId?: number;
}

export interface BoatDrink {
  id: number; // Changed to number
  name_en: string;
  name?: string; // Added fallback
  name_ru?: string;
  price: number;
  unit?: string; // Optional
  included: boolean;
}

export interface SelectedToy {
  id: number;
  name: string;
  nameRu?: string;
  pricePerHour: number;
  pricePerDay: number;
  hours?: number;
  days?: number;
  quantity: number;
}

export interface SelectedService {
  id: number;
  name: string;
  nameRu?: string;
  price: number;
  quantity: number;
}

export interface SelectedFee {
  id: number;
  name: string;
  nameRu?: string;
  pricePerPerson: number;
  adults: number;
  children: number;
}

export interface SelectedPartnerWatersport {
  id: number;
  name: string;
  nameRu?: string;
  partnerName?: string;
  pricePerHour?: number;
  hours?: number;
  pricePerDay?: number;
  days?: number;
}

export interface PartnerMenu {
  partner_id: number;
  conditions?: string;
  conditions_ru?: string;
}

export interface BoatMenu {
  id: number;
  dishes?: string[];
  dishes_ru?: string[];
}

export interface CalcResult {
  agent: number;
  client: number;
  childrenDiscount: number;
  extras: number;
  catering: number;
  drinks: number;
  toys: number;
  services: number;
  transfer: number;
  fees: number;
  partnerWatersports: number;
  markup: number;
  totalAgent: number;
  totalClient: number;
}

export interface CateringPartner {
  id: number;
  name: string;
}

export interface CateringMenuItem {
  id: number;
  partner_id: number;
  name: string;
  name_en: string;
  price: number;
  price_per_person: number; // Required
  min_persons: number;
  description?: string;
}

export interface WatersportsPartner {
  id: number;
  name: string;
}

export interface WatersportsCatalogItem {
  id: number;
  partner_id: number; // Required
  name_en: string;
  name_ru?: string;
  price_per_hour: number;
  price_per_day: number;
}

export interface TransferOptionDB {
  id: number;
  name: string;
  price: number;
  type: string;
}

export interface RouteFee {
  id: number;
  name_en: string;
  name_ru?: string;
  price_per_person: number;
  mandatory: boolean; // Required
}

export interface StaffService {
  id: number;
  name: string;
  name_en?: string; // Optional
  name_ru?: string;
  price: number;
  price_per: string;
}

export interface BoatMenuSet {
  id: number;
  name: string;
  name_ru?: string;
  category: string;
  price: number;
  dishes?: string[];
  dishes_ru?: string[];
}

export interface DetailedCalcResult extends CalcResult {
  items: ReceiptItem[];
}

export interface Partner {
  id: number;
  name: string;
}

export interface SimpleBoat {
  id: number;
  name: string;
  partner_id: number;
}

export interface SimpleRoute {
  id: number;
  name_en: string;
  name_ru?: string;
}

export type Lang = "en" | "ru" | "th";

