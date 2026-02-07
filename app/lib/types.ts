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
  drinkId: string;
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
