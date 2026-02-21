import { create } from 'zustand';
import { SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder, TransferOrder } from '../lib/types';

interface CharterState {
  // Search
  isAdmin: boolean;
  searchDate: string;
  adults: number;
  extraAdults: number;
  children3to11: number;
  childrenUnder3: number;
  customAdultPrice: number | null;
  customChildPrice: number | null;
  customNotes: string;
  boatType: string;
  destination: string;
  boatNameSearch: string;
  boatPartners: any[];
  selectedPartnerFilter: string;
  allBoats: any[];
  allRoutes: any[];
  showBoatSuggestions: boolean;
  showDestinationSuggestions: boolean;
  timeSlot: string;
  minBudget: string;
  maxBudget: string;
  sortBy: string;
  season: string;

  // Results
  results: SearchResult[];
  totalGuests: number;
  loading: boolean;

  // Modal
  selectedBoat: SearchResult | null;
  boatOptions: BoatOption[];
  loadingOptions: boolean;

  // Agent mode
  showAgentPrice: boolean;
  markupPercent: number;

  // Selected extras
  selectedExtras: SelectedExtra[];

  // Catering
  cateringOrders: CateringOrder[];
  cateringPartners: any[];
  cateringMenu: any[];
  partnerMenus: any[];
  partnerMenuSets: any[];

  // Watersports
  watersportsPartners: any[];
  watersportsCatalog: any[];
  selectedPartnerWatersports: any[];

  // Transfer
  transferOptionsDB: any[];

  // DB data
  boatDrinks: any[];
  routeFees: any[];
  landingFee: number;
  landingEnabled: boolean;
  defaultParkFee: number;
  defaultParkFeeEnabled: boolean;
  defaultParkFeeAdults: number;
  defaultParkFeeChildren: number;
  staffServices: any[];
  boatMenu: any[];
  selectedDishes: Record<string, number>;

  // Markup
  boatMarkup: number;
  markupMode: "percent" | "fixed";
  lang: "ru" | "en";
  fixedMarkup: number;
  partnerMarkups: Record<string, number>;
  expandedSections: Record<string, boolean>;

  // Drinks
  drinkOrders: DrinkOrder[];
  byobAllowed: boolean;
  corkageFee: number;

  // Transfer orders
  transferPickup: TransferOrder;
  transferDropoff: TransferOrder;
  transferDirection: 'round_trip' | 'one_way';
  customTransferPrice: number | null;
  customPrices: Record<string, number>;
  useOwnTransfer: boolean;
  ownTransferPriceOneWay: number;
  ownTransferPriceRoundTrip: number;
  ownTransferVipPriceRoundTrip: number;
  ownTransferVipPriceOneWay: number;
  useOwnTransferVip: boolean;
  transferPrice: number;
  transferMarkup: number;

  // Services & toys & fees
  selectedServices: any[];
  selectedToys: any[];
  selectedFees: any[];

  // Special
  specialOccasion: string;
  dietaryRequirements: string;
  specialRequests: string;

  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Active tab
  activeTab: 'included' | 'food' | 'drinks' | 'toys' | 'services' | 'transfer' | 'fees' | 'summary';

  // Actions
  set: (partial: Partial<CharterState>) => void;
  resetSelections: () => void;
  toggleSection: (section: string) => void;
  getPartnerMarkup: (partnerId: number | string) => number;
  setPartnerMarkup: (partnerId: number | string, value: number) => void;
  getPrice: (itemId: string, originalPrice: number | null) => number;
  setPrice: (itemId: string, price: number) => void;
}

const defaultTransferOrder: TransferOrder = {
  type: 'none', pickup: '', dropoff: 'Marina', price: 0, notes: ''
};

export const useCharterStore = create<CharterState>((set, get) => ({
  // Search
  isAdmin: false,
  searchDate: '',
  adults: 2,
  extraAdults: 0,
  children3to11: 0,
  childrenUnder3: 0,
  customAdultPrice: null,
  customChildPrice: null,
  customNotes: '',
  boatType: '',
  destination: '',
  boatNameSearch: '',
  boatPartners: [],
  selectedPartnerFilter: '',
  allBoats: [],
  allRoutes: [],
  showBoatSuggestions: false,
  showDestinationSuggestions: false,
  timeSlot: 'full_day',
  minBudget: '',
  maxBudget: '',
  sortBy: 'price_asc',
  season: 'auto',

  // Results
  results: [],
    totalGuests: 2,
  loading: false,

  // Modal
  selectedBoat: null,
  boatOptions: [],
  loadingOptions: false,

  // Agent
  showAgentPrice: true,
  markupPercent: 0,

  // Extras
  selectedExtras: [],

  // Catering
  cateringOrders: [],
  cateringPartners: [],
  cateringMenu: [],
  partnerMenus: [],
  partnerMenuSets: [],

  // Watersports
  watersportsPartners: [],
  watersportsCatalog: [],
  selectedPartnerWatersports: [],

  // Transfer DB
  transferOptionsDB: [],

  // DB data
  boatDrinks: [],
  routeFees: [],
  landingFee: 0,
  landingEnabled: false,
  defaultParkFee: 0,
  defaultParkFeeEnabled: false,
  defaultParkFeeAdults: 2,
  defaultParkFeeChildren: 0,
  staffServices: [],
  boatMenu: [],
  selectedDishes: {},

  // Markup
  boatMarkup: 0,
  markupMode: "fixed",
  lang: "ru",
  fixedMarkup: 0,
  partnerMarkups: {},
  expandedSections: {
    boatFood: true,
    boatDrinks: true,
    boatToys: true,
    partnerCatering: false,
    partnerWatersports: false,
    partnerDecor: false
  },

  // Drinks
  drinkOrders: [],
  byobAllowed: false,
  corkageFee: 0,

  // Transfer
  transferPickup: { ...defaultTransferOrder },
  transferDropoff: { type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: '' },
  transferDirection: 'round_trip',
  customTransferPrice: null,
  customPrices: {},
  useOwnTransfer: false,
  ownTransferPriceOneWay: 1000,
  ownTransferPriceRoundTrip: 2000,
  ownTransferVipPriceRoundTrip: 4000,
  ownTransferVipPriceOneWay: 2000,
  useOwnTransferVip: false,
  transferPrice: 0,
  transferMarkup: 15,

  // Services & toys & fees
  selectedServices: [],
  selectedToys: [],
  selectedFees: [],

  // Special
  specialOccasion: '',
  dietaryRequirements: '',
  specialRequests: '',

  // Customer
  customerName: '',
  customerPhone: '',
  customerEmail: '',

  // Tab
  activeTab: 'included',

  // Actions
  set: (partial) => set(partial),

  resetSelections: () => set({
    selectedExtras: [],
    cateringOrders: [],
    drinkOrders: [],
    transferPickup: { ...defaultTransferOrder },
    transferDropoff: { type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: '' },
    selectedServices: [],
    selectedToys: [],
    selectedFees: [],
    specialOccasion: '',
    dietaryRequirements: '',
    specialRequests: '',
    activeTab: 'included',
    extraAdults: 0,
    children3to11: 0,
    childrenUnder3: 0,
    customNotes: '',
    selectedPartnerWatersports: [],
    selectedDishes: {},
    customPrices: {},
    corkageFee: 0,
  }),

  toggleSection: (section) => set((state) => ({
    expandedSections: { ...state.expandedSections, [section]: !state.expandedSections[section] }
  })),

  getPartnerMarkup: (partnerId) => get().partnerMarkups[partnerId] || 15,

  setPartnerMarkup: (partnerId, value) => set((state) => ({
    partnerMarkups: { ...state.partnerMarkups, [partnerId]: value }
  })),

  getPrice: (itemId, originalPrice) => {
    const cp = get().customPrices[itemId];
    return cp !== undefined ? cp : (originalPrice || 0);
  },

  setPrice: (itemId, price) => set((state) => ({
    customPrices: { ...state.customPrices, [itemId]: price }
  })),
}));
