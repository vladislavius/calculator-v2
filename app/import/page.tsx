'use client';
import AdminGuard from '../components/AdminGuard';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


interface BoatFeature {
  name: string;
  included: boolean;
  paid: boolean;
  price: number | null;
  pricePer: string;
  notes: string;
}

interface ExtractedBoat {
  name: string;
  type: string;
  model: string;
  length_ft: number | null;
  beam_ft: number | null;
  draft_ft: number | null;
  year_built: string;
  max_pax_day: number | null;
  max_pax_overnight: number | null;
  base_pax: number | null;
  extra_pax_price: number | null;
  cabins: number | null;
  toilets: number | null;
  crew_count: number | null;
  speed_cruise: number | null;
  speed_max: number | null;
  fuel_capacity: number | null;
  water_capacity: number | null;
  generator: boolean;
  air_conditioning: boolean;
  stabilizers: boolean;
  bow_thruster: boolean;
  stern_thruster: boolean;
  default_pier: string;
  photos_url: string;
  notes: string;
  features: {
    included: BoatFeature[];
    paid: BoatFeature[];
  };
  routes: ExtractedRoute[];
}

interface ExtractedRoute {
  destination: string;
  departure_pier: string;
  time_slot: string;
  duration_hours: number | null;
  duration_nights: number | null;
  distance_nm: number | null;
  base_price: number | null;
  agent_price: number | null;
  fuel_surcharge: number | null;
  extra_pax_price: number | null;
  base_pax: number | null;
  season: string;
  min_notice_hours: number | null;
  notes: string;
  client_price?: number | null;
  price_type?: string;
  extra_hour_price?: number | null;
  // Additional fields used in UI/code
  charter_type?: string;
  name?: string;
  guests_from?: number | null;
  guests_to?: number | null;
  season_dates?: string;
  max_guests?: number | null;
}

interface ExtractedExtra {
  category: string;
  name: string;
  name_ru: string;
  included: boolean;
  price: number | null;
  pricePer: string;
  min_order: number | null;
  max_order: number | null;
  notes: string;
}

interface ExtractedData {
  partner_name: string;
  partner_contact_name: string;
  partner_phone: string;
  partner_email: string;
  partner_website: string;
  partner_address: string;
  commission_percent: number | null;
  contract_start: string;
  contract_end: string;
  payment_terms: string;
  cancellation_policy: string;
  boats: ExtractedBoat[];
  routes: ExtractedRoute[];
  extras: ExtractedExtra[];
  general_inclusions: string[];
  general_exclusions: string[];
  special_conditions: string;
  relocation_fees?: any[];
  contract_terms?: any;
  // Additional fields used in code
  included?: any[];
  optional_extras?: any[];
  pricing_rules?: any[];
}

// Empty features - will be populated from AI contract parsing
const EMPTY_FEATURES = {
  included: [],
  paid: [],
  routes: []
};

// Helper to create features from AI data
const createFeaturesFromAI = (included: any[], extras: any[]) => {
  const features = {
    included: (included || []).map((item: any) => ({
      name: item.name,
      included: true,
      paid: false,
      price: null,
      pricePer: 'included',
      notes: item.category || ''
    })),
    paid: (extras || []).map((item: any) => ({
      name: item.name,
      included: false,
      paid: true,
      price: item.price || 0,
      pricePer: item.price_per || 'unit',
      notes: item.note || ''
    }))
  };
  return features;
};

const EXTRA_CATEGORIES = [
  'Water Toys', 'Food & Catering', 'Beverages', 'Alcohol', 
  'Crew & Services', 'Transfers', 'Equipment', 'Fees & Taxes', 'Other'
];

const PRICE_PER_OPTIONS = [
  'included', 'day', 'hour', 'person', 'trip', 'can', 'bottle', 'way', 'event', 'ride', 'unit'
];

export default function ImportPage() {
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'partner' | 'boats' | 'routes' | 'extras' | 'terms'>('partner');
  const [importMode, setImportMode] = useState<'full' | 'single_boat' | null>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
      
  // Fetch import history
  const fetchImportHistory = async () => {
    const { data } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (data) setImportHistory(data);
  };

  // Load history item into editor
  const loadHistoryItem = (item: any) => {
    setExtractedData(item.raw_data);
    setImportMode(item.import_type);
    if (item.partner_id) {
      setSelectedPartnerId(item.partner_id);
      setSelectedPartnerName(item.partner_name);
    }
    setShowHistory(false);
  };
  const [existingPartnersList, setExistingPartnersList] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');

  // Fetch existing partners on mount
  const fetchExistingPartners = async () => {
    const { data } = await supabase
      .from('partners')
      .select('id, name, contact_phone, commission_percent')
      .order('name');
    if (data) setExistingPartnersList(data);
  };

  // Load partners when component mounts
  // Note: fetchExistingPartners is called when 'single_boat' mode is selected

  
  useEffect(() => { fetchImportHistory(); }, []);

    const handleAnalyze = async () => {
    if (contractText.length < 50) {
      alert('Вставьте текст контракта (минимум 50 символов)');
      return;
    }
    
    setLoading(true);
    setLoadingStatus('AI анализирует контракт...');
    
    try {
      setLoadingStatus('AI анализирует контракт...');
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Analysis failed');

      // Show warnings from AI validation
      if (result.warnings && result.warnings.length > 0) {
        const warningText = result.warnings.join("\n• ");
        alert("⚠️ Предупреждения:\n• " + warningText);
      }
      const ai = result.data;
      const partner = ai.partner || {};

      const aiFeatures = createFeaturesFromAI(ai.included || [], ai.optional_extras || []);
      
      // Helper to detect category - improved version
      const detectCat = (name: string) => {
        const n = name.toLowerCase();
        // Transfers - check first (van, pickup, drop, transfer)
        if (n.includes('van') || n.includes('pickup') || n.includes('pick-up') || n.includes('pick up') || n.includes('drop') || n.includes('transfer') || n.includes('taxi') || n.includes('airport')) return 'Transfers';
        // Food & Catering - check before drinks
        if (n.includes('food') || n.includes('meal') || n.includes('lunch') || n.includes('dinner') || n.includes('breakfast') || n.includes('bbq') || n.includes('seafood') || n.includes('snack') || n.includes('catering')) return 'Food & Catering';
        // Alcohol
        if (n.includes('beer') || n.includes('wine') || n.includes('champagne') || n.includes('alcohol') || n.includes('whiskey') || n.includes('vodka') || n.includes('spirits') || n.includes('cocktail')) return 'Alcohol';
        // Beverages (non-alcoholic)
        if (n.includes('drink') || n.includes('water') || n.includes('juice') || n.includes('soda') || n.includes('coffee') || n.includes('tea')) return 'Beverages';
        // Water Toys
        if (n.includes('seabob') || n.includes('jet ski') || n.includes('jetski') || n.includes('kayak') || n.includes('sup') || n.includes('slide') || n.includes('slider') || n.includes('snorkel') || n.includes('pool') || n.includes('swimming') || n.includes('banana') || n.includes('wakeboard') || n.includes('tube') || n.includes('float') || n.includes('paddle')) return 'Water Toys';
        // Equipment (fishing, etc)
        if (n.includes('fish') || n.includes('rod') || n.includes('gear') || n.includes('equipment')) return 'Equipment';
        // Crew & Services
        if (n.includes('massage') || n.includes('masseuse') || n.includes('photo') || n.includes('dj') || n.includes('decor') || n.includes('decoration') || n.includes('flower') || n.includes('crew') || n.includes('captain') || n.includes('chef')) return 'Crew & Services';
        // Fees & Taxes
        if (n.includes('fee') || n.includes('tax') || n.includes('park') || n.includes('permit') || n.includes('entrance')) return 'Fees & Taxes';
        return 'Other';
      };
      
      // Map boats with ALL data from AI
      const boats = (ai.boats || []).map((b: any) => ({
        name: b.name || '',
        type: b.type || 'yacht',
        model: b.model || '',
        year_built: b.year_built || null,
        length_ft: b.length_ft || (b.length_m ? Math.round(b.length_m * 3.28) : null),
        beam_ft: b.beam_ft || (b.beam_m ? Math.round(b.beam_m * 3.28) : null),
        draft_ft: b.draft_ft || (b.draft_m ? Math.round(b.draft_m * 3.28) : null),
        cabins: b.cabins || null,
        beds_double: b.beds_double || null,
        beds_bunk: b.beds_bunk || null,
        toilets: b.toilets || null,
        showers: b.showers || null,
        max_pax_day: b.max_pax_day || b.max_guests || null,
        max_pax_overnight: b.max_pax_overnight || null,
        base_pax: b.base_pax || null,
        extra_pax_price: b.extra_pax_price || null,
        crew_count: b.crew_count || null,
        speed_cruise: b.speed_cruise_knots || null,
        speed_max: b.speed_max_knots || null,
        fuel_capacity: b.fuel_capacity_l || null,
        water_capacity: b.water_capacity_l || null,
        cruising_range: b.cruising_range_nm || null,
        engines: b.engines || '',
        generator: b.generator || false,
        air_conditioning: b.air_conditioning || false,
        sails: b.sails || '',
        dinghy: b.dinghy || '',
        default_pier: b.departure_pier || 'Chalong Pier',
        schedule: b.schedule || '',
        photos_url: b.photos_url || '',
        notes: b.notes || '',
        features: JSON.parse(JSON.stringify(aiFeatures)),
        routes: (b.routes || []).map((r: any) => ({
          destination: r.destination || r.name || '',
          departure_pier: r.departure_pier || b.departure_pier || 'Chalong Pier',
          time_slot: r.time_slot || 'full_day',
          duration_hours: r.duration_hours || (r.time_slot === 'half_day' ? 4 : 8),
          distance_nm: r.distance_nm || null,
          base_price: r.base_price || null,
          client_price: r.client_price || null,
          price_type: r.price_type || 'total',
          guests_from: r.guests_from || null,
          guests_to: r.guests_to || null,
          extra_hour_price: r.extra_hour_price || null,
          agent_price: r.agent_price || r.base_price || null,
          fuel_surcharge: r.fuel_surcharge || 0,
          extra_pax_price: r.extra_pax_price || null,
          base_pax: r.base_pax || b.base_pax || null,
          season: (() => { const s = (r.season || 'all').toLowerCase(); return s; })(),
          min_notice_hours: r.min_notice_hours || null,
          notes: r.notes || ''
        }))
      }));
      

      // Enrich boat routes with pricing_rules
      const pRules = ai.pricing_rules || [];
      if (pRules.length > 0) {
        for (const boat of boats) {
          const boatPrices = pRules.filter((p: any) => {
            const pName = (p.boat_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const bName = (boat.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return pName.includes(bName) || bName.includes(pName) || pName === '' ;
          });
          
          const routesHavePrices = boat.routes.some((r: any) => r.base_price && r.base_price > 0);
          if (boatPrices.length > 0 && boat.routes.length > 0) { // FIXED: enrich routes without prices even if some have prices
            // Routes exist but may lack prices - enrich them
            const enrichedRoutes: any[] = [];
            for (const route of boat.routes) {
              // Skip routes that already have a valid price
              if (route.base_price && route.base_price > 0) {
                enrichedRoutes.push(route);
                continue;
              }
              // FIXED: Skip routes that already have valid prices
              if (route.base_price && route.base_price > 0) {
                enrichedRoutes.push(route);
                continue;
              }
              // Determine charter_type from duration
              const rType = route.duration_hours <= 5 ? 'half_day' : 'full_day';
              const matchingPrices = boatPrices.filter((p: any) => {
                const pType = p.charter_type || 'full_day';
                if (pType === rType) return true;
                if (rType === 'half_day' && (pType === 'morning' || pType === 'afternoon')) return true;
                if (pType === 'full_day' && rType === 'full_day') return true;
                return false;
              });
              
              if (matchingPrices.length > 0) {
                // Use minimum price for the route, tiers go to pricing_rules
                const sorted = [...matchingPrices].sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
                const minPrice = sorted[0];
                const maxPrice = sorted[sorted.length - 1];
                enrichedRoutes.push({
                  ...route,
                  base_price: minPrice.base_price || route.base_price,
                  agent_price: minPrice.base_price || route.agent_price,
                  client_price: minPrice.client_price || null,
                  season: minPrice.season || route.season,
                  season_dates: minPrice.season_dates || '',
                  extra_pax_price: minPrice.extra_pax_price || route.extra_pax_price,
                  base_pax: minPrice.guests_from || route.base_pax,
                  charter_type: minPrice.charter_type || rType,
                  notes: matchingPrices.length > 1 
                    ? 'Цена от ' + minPrice.base_price + ' (' + minPrice.guests_from + ' чел.) до ' + maxPrice.base_price + ' (' + maxPrice.guests_from + ' чел.)'
                    : (minPrice.time_slot ? 'Time: ' + minPrice.time_slot : route.notes)
                });
              } else {
                enrichedRoutes.push(route);
              }
            }
            boat.routes = enrichedRoutes;
          } else if (boatPrices.length > 0 && boat.routes.length === 0) {
            // No routes but have prices - create routes from prices
            for (const p of boatPrices) {
              boat.routes.push({
                destination: p.charter_type === 'morning' ? 'Morning Charter' : p.charter_type === 'afternoon' ? 'Afternoon Charter' : 'Full Day Charter',
                departure_pier: boat.default_pier || 'Chalong Pier',
                time_slot: p.time_slot || p.charter_type,
                duration_hours: p.duration_hours || 8,
                distance_nm: null,
                base_price: p.base_price,
                agent_price: p.base_price,
                fuel_surcharge: 0,
                extra_pax_price: p.extra_pax_price || null,
                base_pax: p.guests_to || null,
                season: p.season || 'all',
                season_dates: p.season_dates || '',
                min_notice_hours: null,
                notes: p.time_slot ? 'Time: ' + p.time_slot : ''
              });
            }
          }
        }
      }



      // ===== Normalize seasons & deduplicate boat routes =====
      for (const boat of boats) {
        if (!boat.routes || boat.routes.length === 0) continue;

        // Step 1: Normalize seasons
        for (const r of boat.routes) {
          const s = (r.season || '').toLowerCase().trim();

          // Map known season aliases to canonical values
          if (!s) {
            r.season = 'all'; // default if empty
          } else if (s === 'all' || s === 'all_seasons' || s === 'year_round') {
            r.season = 'all_seasons';
          } else if (s === 'peak' || s === 'peak_season') {
            r.season = 'peak';
          } else if (s === 'high' || s === 'high_season') {
            r.season = 'all';
          } else if (s === 'low' || s === 'low_season' || s === 'green') {
            r.season = 'low';
          } else if (s.includes('chinese') && s.includes('new')) {
            r.season = 'chinese_new_year';
          } else if (s.includes('national') && s.includes('china') || s.includes('chinese') && s.includes('national')) {
            r.season = 'chinese_national_day';
          } else if (s.includes('labour') || s.includes('labor') || s.includes('worker')) {
            r.season = 'international_labour_day';
          } else if (s.includes('nov') && s.includes('dec')) {
            r.season = 'nov_dec';
          } else if (s.includes('dec') && s.includes('feb')) {
            r.season = 'dec_feb';
          } else if (s.includes('jan') && s.includes('feb')) {
            r.season = 'jan_feb';
          } else if (s.includes('mar') && s.includes('apr')) {
            r.season = 'mar_apr';
          } else if (s.includes('may') && s.includes('jun')) {
            r.season = 'may_jun';
          } else if (s.includes('jul') && s.includes('aug')) {
            r.season = 'jul_aug';
          } else if (s.includes('sep') && s.includes('oct')) {
            r.season = 'sep_oct';
          }
          // else keep as-is
        }

        // Step 2: Deduplicate by destination — keep one route per destination with min price
        const routeMap = new Map<string, any>();
        for (const r of boat.routes) {
          const key = (r.destination || '').toLowerCase().trim();
          const existing = routeMap.get(key);
          if (!existing) {
            routeMap.set(key, r);
          } else {
            // Keep the one with lower price (min tier)
            if (r.base_price && existing.base_price && r.base_price < existing.base_price) {
              routeMap.set(key, r);
            }
          }
        }
        boat.routes = Array.from(routeMap.values());
      }

      // Map ROUTES (destinations/itineraries) from ai.routes
      const aiRoutes = (ai.routes || []).map((r: any) => ({
        name: r.name || '',
        charter_type: r.charter_type || 'full_day',
        duration_hours: r.duration_hours || (r.charter_type === 'morning' || r.charter_type === 'afternoon' ? 4 : 8),
        time_slot: r.time_slot || '',
        fuel_surcharge: r.fuel_surcharge || 0,
        destinations: r.destinations || []
      }));
      
      // Map PRICING RULES (prices per charter type/season) from ai.pricing_rules
      const pricingRules = (ai.pricing_rules || []).map((p: any) => ({
        boat_name: p.boat_name || '',
        charter_type: p.charter_type || 'full_day',
        season: p.season || 'all',
        season_dates: p.season_dates || '',
        season_months: p.season_months || '',
        guests_from: p.guests_from || 1,
        guests_to: p.guests_to || 10,
        base_price: p.base_price || 0,
        extra_pax_price: p.extra_pax_price || null,
        duration_hours: p.duration_hours || 8,
        time_slot: p.time_slot || ''
      }));
      
      // Combine routes with pricing for display
      // Each route + each applicable pricing = one row
      const routes: any[] = [];
      
      // Skip global route generation if boats already have routes with prices
      const boatsHaveRoutes = boats.some((b: any) => b.routes && b.routes.length > 0 && b.routes.some((r: any) => r.base_price > 0));

      if (!boatsHaveRoutes && aiRoutes.length > 0 && pricingRules.length > 0) {
        // Cross-reference routes with pricing
        for (const route of aiRoutes) {
          const matchingPrices = pricingRules.filter((p: any) => 
            p.charter_type === route.charter_type || 
            (route.charter_type === 'morning' && p.charter_type === 'morning') ||
            (route.charter_type === 'afternoon' && p.charter_type === 'afternoon') ||
            (route.charter_type === 'full_day' && p.charter_type === 'full_day')
          );
          
          if (matchingPrices.length > 0) {
            for (const price of matchingPrices) {
              routes.push({
                destination: route.name,
                departure_pier: 'Chalong Pier',
                charter_type: route.charter_type,
                season: price.season,
                season_dates: price.season_dates,
                duration_hours: route.duration_hours,
                duration_nights: 0,
                distance_nm: null,
                base_price: price.base_price,
                agent_price: price.base_price,
                fuel_surcharge: route.fuel_surcharge,
                guests_from: price.guests_from,
                guests_to: price.guests_to,
                extra_pax_price: price.extra_pax_price,
                base_pax: price.guests_to,
                boat_name: price.boat_name,
                min_notice_hours: 24,
                notes: route.time_slot ? `Time: ${route.time_slot}` : ''
              });
            }
          } else {
            // Route without specific pricing
            routes.push({
              destination: route.name,
              departure_pier: 'Chalong Pier',
              charter_type: route.charter_type,
              season: 'all',
              season_dates: '',
              duration_hours: route.duration_hours,
              duration_nights: 0,
              distance_nm: null,
              base_price: 0,
              agent_price: 0,
              fuel_surcharge: route.fuel_surcharge,
              guests_from: 1,
              guests_to: 10,
              extra_pax_price: null,
              base_pax: null,
              boat_name: '',
              min_notice_hours: 24,
              notes: route.time_slot ? `Time: ${route.time_slot}` : ''
            });
          }
        }
      } else if (pricingRules.length > 0) {
        // Only pricing rules, no specific routes
        for (const p of pricingRules) {
          routes.push({
            destination: p.charter_type === 'morning' ? 'Morning Charter' : p.charter_type === 'afternoon' ? 'Afternoon Charter' : 'Full Day Charter',
            departure_pier: 'Chalong Pier',
            charter_type: p.charter_type,
            season: p.season,
            season_dates: p.season_dates,
            duration_hours: p.duration_hours,
            duration_nights: 0,
            distance_nm: null,
            base_price: p.base_price,
            agent_price: p.base_price,
            fuel_surcharge: 0,
            guests_from: p.guests_from,
            guests_to: p.guests_to,
            extra_pax_price: p.extra_pax_price,
            base_pax: p.guests_to,
            boat_name: p.boat_name,
            min_notice_hours: 24,
            notes: p.time_slot ? `Time: ${p.time_slot}` : ''
          });
        }
      } else if (aiRoutes.length > 0) {
        // Only routes, no pricing
        for (const route of aiRoutes) {
          routes.push({
            destination: route.name,
            departure_pier: 'Chalong Pier',
            charter_type: route.charter_type,
            season: 'all',
            season_dates: '',
            duration_hours: route.duration_hours,
            duration_nights: 0,
            distance_nm: null,
            base_price: 0,
            agent_price: 0,
            fuel_surcharge: route.fuel_surcharge,
            guests_from: 1,
            guests_to: 10,
            extra_pax_price: null,
            base_pax: null,
            boat_name: '',
            min_notice_hours: 24,
            notes: route.time_slot ? `Time: ${route.time_slot}` : ''
          });
        }
      }
      
      // Map extras with auto-detected categories
      const extras = (ai.optional_extras || []).map((e: any) => ({
        category: detectCat(e.name),
        name: e.name || '',
        name_ru: e.name_ru || '',
        included: false,
        price: e.price || 0,
        pricePer: e.price_per || 'unit',
        min_order: null,
        max_order: null,
        notes: e.note || ''
      }));

      // Convert relocation fees to extras (relocation to extras)
      const relocExtras = (ai.relocation_fees || []).map((rf: any) => ({
        category: 'Transfers',
        name: 'Relocation from ' + (rf.departure_point || 'Unknown'),
        name_ru: '',
        included: false,
        price: rf.fee || 0,
        pricePer: 'trip',
        min_order: null,
        max_order: null,
        notes: rf.notes || ''
      }));
      extras.push(...relocExtras);
      
      // Extract inclusions and exclusions from AI (not hardcoded!)
      const inclusions = (ai.included || []).map((i: any) => i.name);
      const exclusions = (ai.not_included || []).map((i: any) => i.name + (i.note ? ' (' + i.note + ')' : ''));
      
      // Get phones from partner
      const phones = partner.phones || [];
      const mainPhone = phones[0]?.number || partner.phone || ai.partner_phone || '';
      const contactName = phones[0]?.contact_name || '';
      
      setExtractedData({
        partner_name: partner.name || ai.partner_name || '',
        partner_contact_name: contactName,
        partner_phone: mainPhone,
        partner_email: (partner.emails || [])[0] || partner.email || ai.partner_email || '',
        partner_website: partner.website || '',
        partner_address: partner.address || ai.partner_address || '',
        commission_percent: 15,
        contract_start: partner.validity?.split(' - ')[0] || '',
        contract_end: partner.validity?.split(' - ')[1] || '',
        payment_terms: ai.payment_terms || '',
        cancellation_policy: ai.cancellation_policy || '',
        boats: boats,
        routes: routes,
        extras: extras,
        general_inclusions: inclusions,
        general_exclusions: exclusions,
        special_conditions: (ai.notes || []).join('\n') || ai.children_policy || '',
        relocation_fees: (ai.relocation_fees || []).map((rf: any) => ({ departure_point: rf.departure_point || '', fee: rf.fee || 0, notes: rf.notes || '' })),
        contract_terms: ai.contract_terms || {},
        pricing_rules: ai.pricing_rules || []
      });

    } catch (error: any) {
      console.error('Error:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const createEmptyData = () => {
    setExtractedData({
      partner_name: '',
      partner_contact_name: '',
      partner_phone: '',
      partner_email: '',
      partner_website: '',
      partner_address: '',
      commission_percent: 15,
      contract_start: '2024-11-01',
      contract_end: '2025-10-31',
      payment_terms: '',
      cancellation_policy: '',
      boats: [],
      routes: [],
      extras: [],
      general_inclusions: [],
      general_exclusions: [],
      special_conditions: ''
    });
  };

  const addBoat = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      boats: [...extractedData.boats, {
        name: '', type: 'catamaran', model: '', length_ft: null, beam_ft: null,
        draft_ft: null, year_built: '', max_pax_day: null, max_pax_overnight: null, base_pax: null, extra_pax_price: null,
        cabins: null, toilets: null, crew_count: 3, speed_cruise: null, speed_max: null,
        fuel_capacity: null, water_capacity: null, generator: false, air_conditioning: true,
        stabilizers: false, bow_thruster: false, stern_thruster: false,
        default_pier: 'Chalong Pier', photos_url: '', notes: '',
        features: JSON.parse(JSON.stringify(EMPTY_FEATURES)),
        routes: []
      }]
    });
  };

  const updateBoat = (index: number, field: string, value: any) => {
    if (!extractedData) return;
    const boats = [...extractedData.boats];
    (boats[index] as any)[field] = value;
    setExtractedData({ ...extractedData, boats });
  };

  const removeBoat = (index: number) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      boats: extractedData.boats.filter((_, i) => i !== index)
    });
  };

  const addRoute = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      routes: [...extractedData.routes, {
        destination: '', departure_pier: 'Chalong Pier', time_slot: 'full_day',
        duration_hours: 8, duration_nights: null, distance_nm: null, base_price: null, agent_price: null,
        fuel_surcharge: 0, extra_pax_price: 2000, base_pax: 10, season: 'all',
        min_notice_hours: 24, notes: ''
      }]
    });
  };

  const updateRoute = (index: number, field: string, value: any) => {
    if (!extractedData) return;
    const routes = [...extractedData.routes];
    (routes[index] as any)[field] = value;
    setExtractedData({ ...extractedData, routes });
  };

  const removeRoute = (index: number) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      routes: extractedData.routes.filter((_, i) => i !== index)
    });
  };

  const addExtra = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      extras: [...extractedData.extras, {
        category: 'Other', name: '', name_ru: '', included: false,
        price: null, pricePer: 'unit', min_order: null, max_order: null, notes: ''
      }]
    });
  };

  const updateExtra = (index: number, field: string, value: any) => {
    if (!extractedData) return;
    const extras = [...extractedData.extras];
    (extras[index] as any)[field] = value;
    setExtractedData({ ...extractedData, extras });
  };

  const removeExtra = (index: number) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      extras: extractedData.extras.filter((_, i) => i !== index)
    });
  };

  const toggleFeature = (boatIndex: number, featureType: 'included' | 'paid', featureIndex: number, field: string, value: any) => {
    if (!extractedData) return;
    const boats = [...extractedData.boats];
    (boats[boatIndex].features[featureType][featureIndex] as any)[field] = value;
    setExtractedData({ ...extractedData, boats });
  };

  const saveToDatabase = async () => {
    if (!extractedData) return;

    setSaveStatus('Сохранение...');
    
    let saveError: any = null;
    let partnerId: number = 0;
    
    try {      
      // Check if partner was pre-selected (single boat mode)
      if (selectedPartnerId && selectedPartnerId > 0) {
        partnerId = selectedPartnerId;
      } else {
        // 1. Smart partner upsert - find by partial name match
        // Smart partner search — by first 2 words for better matching
        const partnerWords = extractedData.partner_name.trim().split(/\s+/);
        const searchName = partnerWords.slice(0, Math.min(2, partnerWords.length)).join(' ');
        
        const { data: existingPartners } = await supabase
          .from('partners')
          .select('*')
          .ilike('name', '%' + searchName + '%');
        
        
        if (existingPartners && existingPartners.length > 0) {
          // Partner exists - update with new data
          const existing = existingPartners[0];
          partnerId = existing.id;
          
          await supabase.from('partners').update({
            contact_phone: extractedData.partner_phone || existing.contact_phone || null,
            contact_email: extractedData.partner_email || existing.contact_email || null,
            commission_percent: extractedData.commission_percent || existing.commission_percent || 15,
            notes: extractedData.partner_website || extractedData.partner_address 
              ? (existing.notes || '') + '\n---\nUpdated: ' + new Date().toISOString().split('T')[0] + '\nWebsite: ' + (extractedData.partner_website || '') + '\nAddress: ' + (extractedData.partner_address || '')
              : existing.notes
          }).eq('id', partnerId);
          
        } else {
          // Create new partner
          const { data: newPartner, error: insertError } = await supabase
            .from('partners')
            .insert({
              name: extractedData.partner_name,
              contact_phone: extractedData.partner_phone || null,
              contact_email: extractedData.partner_email || null,
              commission_percent: extractedData.commission_percent || 15
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          partnerId = newPartner.id;
        }
      }


      // 2. Smart boats upsert - find by name + partner
      const savedBoatIds: Record<string, number> = {};
      
      for (const boat of extractedData.boats) {
        
        // Find existing boat by name and partner
        const { data: existingBoats } = await supabase
          .from('boats')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('name', boat.name);
        
        let boatId: number = 0;
        
        if (existingBoats && existingBoats.length > 0) {
          // Update existing boat
          boatId = existingBoats[0].id;
          
          await supabase.from('boats').update({
            boat_type: boat.type || existingBoats[0].boat_type,
            model: boat.model || existingBoats[0].model,
            length_ft: boat.length_ft || existingBoats[0].length_ft,
            year_built: boat.year_built || existingBoats[0].year_built,
            cabins: boat.cabins || existingBoats[0].cabins,
            default_pier: boat.default_pier || existingBoats[0].default_pier,
            max_pax_day: boat.max_pax_day || existingBoats[0].max_pax_day,
            max_pax_overnight: boat.max_pax_overnight || existingBoats[0].max_pax_overnight
          }).eq('id', boatId);
          
        } else {
          // Create new boat
          const partnerPrefix = (selectedPartnerName || extractedData.partner_name || 'UNK').substring(0, 3).toUpperCase();
          const boatCode = partnerPrefix + '-' + boat.name.replace(/\s/g, '').toUpperCase().substring(0, 15);
          
          const { data: newBoat, error: boatError } = await supabase
            .from('boats')
            .upsert({
              code: boatCode,
              name: boat.name,
              partner_id: partnerId,
              boat_type: boat.type || 'yacht',
              model: boat.model,
              length_ft: boat.length_ft,
              year_built: boat.year_built,
              cabins: boat.cabins,
              max_pax_day: boat.max_pax_day || 10,
              max_pax_overnight: boat.max_pax_overnight || 6,
              default_pier: boat.default_pier || null,
              active: true
            })
            .select('id')
            .single();

          if (boatError) {
            console.error('Boat insert error:', boatError);
            console.error('Boat data:', { code: boatCode, name: boat.name, partner_id: partnerId });
            // Try to get existing boat by code OR by name+partner
            const { data: existingByCode } = await supabase
              .from('boats')
              .select('id')
              .eq('code', boatCode)
              .single();
            if (existingByCode) {
              boatId = existingByCode.id;
            } else {
              // Try by name and partner
              const { data: existingByName } = await supabase
                .from('boats')
                .select('id')
                .eq('name', boat.name)
                .eq('partner_id', partnerId)
                .single();
              if (existingByName) {
                boatId = existingByName.id;
              } else {
                console.error('Could not find or create boat:', boat.name);
                continue;
              }
            }
          } else if (newBoat) {
            boatId = newBoat.id;
          }
        }
        
        savedBoatIds[boat.name] = boatId;
        
        // 3. Process routes and SEASONAL PRICES for this boat
        // Use routes from this specific boat (not shared extractedData.routes)
        const boatRoutes = boat.routes || [];
        
        for (const route of boatRoutes) {
          
          // Find or create route - improved matching
          const normalizedDest = (route.destination || '').trim().replace(/\s+/g, ' ');
          if (!normalizedDest) {
            console.warn('Skipping route with empty destination for boat:', boat.name);
            continue;
          }
          
          // Step 1: Exact match (case-insensitive)
          const { data: exactMatch } = await supabase
            .from('routes')
            .select('id, name')
            .ilike('name', normalizedDest);
          
          let routeId: number;
          
          if (exactMatch && exactMatch.length > 0) {
            routeId = exactMatch[0].id;
          } else {
            // Step 2: Partial match — search by first significant word
            let partialRouteId: number | null = null;
            const firstWord = normalizedDest.split(/[\s,+&]+/)[0];
            if (firstWord && firstWord.length > 2) {
              const { data: partialMatch } = await supabase
                .from('routes')
                .select('id, name')
                .ilike('name', '%' + firstWord + '%');
              if (partialMatch && partialMatch.length > 0) {
                const best = partialMatch.find((r: any) =>
                  r.name.toLowerCase().includes(normalizedDest.toLowerCase()) ||
                  normalizedDest.toLowerCase().includes(r.name.toLowerCase())
                );
                if (best) partialRouteId = best.id;
              }
            }
            
            if (partialRouteId) {
              routeId = partialRouteId;
            } else {
            // Step 3: Create new route with full name
            const { data: newRoute, error: routeError } = await supabase
              .from('routes')
              .insert({
                name: normalizedDest,
                name_en: normalizedDest,
                duration_hours: route.duration_hours || 8,
                duration_nights: route.duration_nights || 0
              })
              .select('id')
              .single();

            if (routeError) {
              console.error('Route insert error:', routeError, 'Dest:', normalizedDest);
              // Try to find by exact name one more time (race condition)
              const { data: retryFind } = await supabase
                .from('routes').select('id').eq('name', normalizedDest).limit(1).single();
              if (retryFind) {
                routeId = retryFind.id;
              } else {
                console.error('FATAL: Cannot create or find route:', normalizedDest);
                continue;
              }
            } else {
              routeId = newRoute.id;
            }
            } // close partialRouteId else
          }

          // SEASONAL PRICE LOGIC
          const season = (() => { const s = (route.season || 'all').toLowerCase(); return s; })();
          const timeSlot = route.time_slot || route.charter_type || 'full_day';
          const today = new Date().toISOString().split('T')[0];
          
          // Find existing active price for this boat + route + season
          const { data: existingPrices } = await supabase
            .from('route_prices')
            .select('*')
            .eq('boat_id', boatId)
            .eq('route_id', routeId)
            .eq('season', season)
            .eq('time_slot', timeSlot) // FIXED: match time_slot too
            .gte('valid_to', today)
            .order('valid_from', { ascending: false })
            .limit(1);
          
          if (existingPrices && existingPrices.length > 0) {
            // Close old price (create version history)
            const oldPrice = existingPrices[0];
            
            await supabase
              .from('route_prices')
              .update({ valid_to: today })
              .eq('id', oldPrice.id);
            
            // Create new price version
            await supabase.from('route_prices').upsert({
              boat_id: boatId,
              route_id: routeId,
              season: season,
              time_slot: timeSlot,
              base_price: route.base_price || oldPrice.base_price,
              agent_price: route.agent_price || route.base_price || oldPrice.agent_price,
              client_price: route.base_price || oldPrice.client_price,
              fuel_surcharge: route.fuel_surcharge ?? oldPrice.fuel_surcharge ?? 0,
              extra_pax_price: route.extra_pax_price || boat.extra_pax_price || oldPrice.extra_pax_price || 2000,
              base_pax: route.base_pax || boat.base_pax || oldPrice.base_pax || 2,
              valid_from: today,
              valid_to: '2027-12-31'
            }, { onConflict: 'boat_id,route_id,time_slot,season' });
            
          } else {
            // Create new price
            await supabase.from('route_prices').upsert({
              boat_id: boatId,
              route_id: routeId,
              season: season,
              time_slot: timeSlot,
              base_price: route.base_price || 50000,
              agent_price: route.agent_price || route.base_price || 50000,
              client_price: route.client_price || route.base_price || 50000,
              fuel_surcharge: route.fuel_surcharge || 0,
              extra_pax_price: route.extra_pax_price || boat.extra_pax_price || 2000,
              base_pax: route.base_pax || boat.base_pax || 2,
              valid_from: today,
              valid_to: '2027-12-31'
            }, { onConflict: 'boat_id,route_id,time_slot,season' });
          }
        }
        
        
        // === relocation_fees save ===
        // Save relocation fees as notes on the boat
        if (extractedData.relocation_fees && extractedData.relocation_fees.length > 0 && boatId) {
          const relocNotes = extractedData.relocation_fees
            .map((rf: any) => rf.departure_point + ': +' + (rf.fee || 0).toLocaleString() + ' THB' + (rf.notes ? ' (' + rf.notes + ')' : ''))
            .join('\n');
          
          // Update boat notes with relocation info
          const { data: currentBoat } = await supabase.from('boats').select('notes').eq('id', boatId).single();
          const existingNotes = currentBoat?.notes || '';
          if (!existingNotes.includes('Relocation')) {
            await supabase.from('boats').update({
              notes: (existingNotes ? existingNotes + '\n\n' : '') + '--- Relocation Fees ---\n' + relocNotes
            }).eq('id', boatId);
          }
        }

        // 4. Save boat options - find in options_catalog first
        if (boat.features) {
          const allFeatures = [...(boat.features.included || []), ...(boat.features.paid || [])];
          for (const feature of allFeatures) {
            if (!feature.name) continue;
            
            
            // Find option in catalog by name (partial match)
            const { data: catalogOption } = await supabase
              .from('options_catalog')
              .select('id, name_en')
              .ilike('name_en', feature.name)
              .limit(1)
              .maybeSingle();
            
            // If not found by full name, try first two words
            let matchedOption = catalogOption;
            if (!matchedOption && feature.name.split(' ').length > 1) {
              const { data: partialMatch } = await supabase
                .from('options_catalog')
                .select('id, name_en')
                .ilike('name_en', feature.name.split(' ').slice(0, 3).join(' '))
                .limit(1)
                .maybeSingle();
              matchedOption = partialMatch;
            }
            
            // First-word fallback removed — too many false matches
            
            const catalogOption2 = matchedOption;
            
            if (!catalogOption2) {
              // Create in options_catalog first
              const { data: newCatalogOpt, error: catError } = await supabase
                .from('options_catalog')
                .insert({
                  code: feature.name.toLowerCase().replace(/\s+/g, '_').substring(0, 30),
                  name_en: feature.name,
                  name_ru: feature.name,
                  category_id: 8, // default to 'other' category
                  default_price: feature.price || 0,
                  default_price_per: feature.pricePer === 'day' ? 'day' : 'trip'
                })
                .select('id')
                .single();
              
              if (catError) {
                console.error('Error creating catalog option:', catError);
                continue;
              }
              
              // Now add to boat_options
              await supabase.from('boat_options').insert({
                boat_id: boatId,
                option_id: newCatalogOpt.id,
                status: feature.included ? 'included' : 'paid_optional',
                price: feature.price || 0,
                price_per: feature.pricePer === 'day' ? 'day' : 'trip',
                available: true
              });
            } else {
              
              // Check if boat_option already exists
              const { data: existingOpt } = await supabase
                .from('boat_options')
                .select('id')
                .eq('boat_id', boatId)
                .eq('option_id', catalogOption2.id)
                .maybeSingle();
              
              if (existingOpt) {
                // Update existing
                await supabase.from('boat_options').update({
                  price: feature.price || 0,
                  status: feature.included ? 'included' : 'paid_optional',
                  available: true
                }).eq('id', existingOpt.id);
              } else {
                // Create new boat_option linked to catalog
                await supabase.from('boat_options').insert({
                  boat_id: boatId,
                  option_id: catalogOption2.id,
                  status: feature.included ? 'included' : 'paid_optional',
                  price: feature.price || 0,
                  price_per: feature.pricePer === 'day' ? 'day' : 'trip',
                  available: true
                });
              }
            }
          }
        }
      }

      // 5. Save pricing rules (complex pricing with seasons/guests/duration)
      if (extractedData.pricing_rules && extractedData.pricing_rules.length > 0) {
        
        for (const rule of extractedData.pricing_rules) {
          // Find boat ID by name
          const boatId = savedBoatIds[rule.boat_name] || Object.values(savedBoatIds)[0];
          if (!boatId) continue;
          
          // Check if rule already exists
          const { data: existingRule } = await supabase
            .from('boat_pricing_rules')
            .select('id')
            .eq('boat_id', boatId)
            .eq('season', rule.season)
            .eq('duration_nights', rule.duration_nights || 0)
            .eq('guests_from', rule.guests_from)
            .eq('guests_to', rule.guests_to)
            .maybeSingle();
          
          if (existingRule) {
            // Update existing
            await supabase.from('boat_pricing_rules').update({
              base_price: rule.base_price,
              charter_type: (() => {
                const ct = (rule.charter_type || 'day').toLowerCase();
                if (ct.includes('overnight') || ct.includes('night')) return 'overnight';
                if (ct.includes('multi') || ct.includes('2d') || ct.includes('3d')) return 'multi_day';
                return 'day';
              })(),
              notes: rule.notes,
              updated_at: new Date().toISOString()
            }).eq('id', existingRule.id);
          } else {
            // Insert new
            const prData = {
              boat_id: boatId,
              charter_type: (() => {
                const ct = (rule.charter_type || 'day').toLowerCase();
                if (ct.includes('overnight') || ct.includes('night')) return 'overnight';
                if (ct.includes('multi') || ct.includes('2d') || ct.includes('3d')) return 'multi_day';
                return 'day';
              })(),
              season: (() => { const s = (rule.season || 'all').toLowerCase(); return s; })(),
              duration_nights: rule.duration_nights || 0,
              guests_from: rule.guests_from || 1,
              guests_to: rule.guests_to || 10,
              base_price: rule.base_price || 0,
              notes: rule.notes || ''
            };
            const { error: prError } = await supabase.from('boat_pricing_rules').upsert(prData);
            if (prError) {
              console.error('Pricing rule error:', prError.message, 'Data:', JSON.stringify(prData));
            }
          }
        }
      }
      
      // 6. Save included items as boat options
      if (extractedData.included && extractedData.included.length > 0) {
        const boatId = Object.values(savedBoatIds)[0] as number;
        if (boatId) {
          for (const item of extractedData.included) {
            // Find in catalog
            const { data: catalogOpt } = await supabase
              .from('options_catalog')
              .select('id')
              .ilike('name_en', '%' + (item.name.length > 20 ? item.name.split(' ').slice(0, 3).join(' ') : item.name) + '%')
              .limit(1)
              .maybeSingle();
            
            if (catalogOpt) {
              const { data: existingOpt } = await supabase
                .from('boat_options')
                .select('id')
                .eq('boat_id', boatId)
                .eq('option_id', catalogOpt.id)
                .maybeSingle();
              
              if (!existingOpt) {
                await supabase.from('boat_options').insert({
                  boat_id: boatId,
                  option_id: catalogOpt.id,
                  status: 'included',
                  price: 0,
                  price_per: 'trip',
                  available: true
                });
              }
            }
          }
        }
      }
      
      // 7. Save optional extras
      if (extractedData.optional_extras && extractedData.optional_extras.length > 0) {
        const boatId = Object.values(savedBoatIds)[0] as number;
        if (boatId) {
          for (const extra of extractedData.optional_extras) {
            const { data: catalogOpt } = await supabase
              .from('options_catalog')
              .select('id')
              .ilike('name_en', '%' + extra.name.split(' ')[0] + '%')
              .limit(1)
              .maybeSingle();
            
            if (catalogOpt) {
              const { data: existingOpt } = await supabase
                .from('boat_options')
                .select('id')
                .eq('boat_id', boatId)
                .eq('option_id', catalogOpt.id)
                .maybeSingle();
              
              const pricePer = extra.price_per === 'day' ? 'day' : 
                               extra.price_per === 'hour' ? 'hour' : 
                               extra.price_per === 'person' ? 'person' : 'trip';
              
              if (existingOpt) {
                await supabase.from('boat_options').update({
                  price: extra.price || 0,
                  price_per: pricePer,
                  status: 'paid_optional'
                }).eq('id', existingOpt.id);
              } else {
                await supabase.from('boat_options').insert({
                  boat_id: boatId,
                  option_id: catalogOpt.id,
                  status: 'paid_optional',
                  price: extra.price || 0,
                  price_per: pricePer,
                  available: true
                });
              }
            }
          }
        }
      }
      
      saveError = null;
    } catch (error: any) {
      saveError = error;
      console.error('Save error:', error);
    } finally {
      // ALWAYS save to import history — success or error
      try {
        const boatNames = extractedData.boats?.map((b: any) => b.name).filter(Boolean) || [];
        const routesCount = extractedData.routes?.length || 
          extractedData.boats?.reduce((sum: number, b: any) => sum + (b.routes?.length || 0), 0) || 0;
        
        const importType: string = importMode === 'single_boat' ? 'single_boat' : 'full_contract';
        const { error: histErr } = await supabase.from('import_history').insert({
          partner_id: partnerId || null,
          partner_name: selectedPartnerName || extractedData.partner_name || 'Unknown',
          import_type: importType,
          boats_added: extractedData.boats?.length || 0,
          routes_added: routesCount,
          raw_data: extractedData,
          status: saveError ? 'error' : 'success',
          error_message: saveError?.message || null,
          boat_names: boatNames.join(', ') || null
        });
        if (histErr) console.error('History save error:', histErr);
        
        fetchImportHistory();
      } catch (histError) {
        console.error('Failed to save import history:', histError);
      }
      
      if (saveError) {
        setSaveStatus('❌ Ошибка: ' + saveError.message);
      } else {
        setSaveStatus('✅ Успешно! Партнёр, лодки, маршруты и опции сохранены.');
      }
    }
  };
  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    color: '#e2e8f0',
    width: '100%',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px'
  };

  const tabStyle = (active: boolean) => ({
    padding: '12px 24px',
    border: 'none',
    borderBottom: active ? '3px solid #00C9FF' : '3px solid transparent',
    background: active ? '#0e2a4a' : 'transparent',
    color: active ? '#00C9FF' : '#64748b',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px'
  });

  return (
    <AdminGuard>
    <div style={{minHeight: '100vh', backgroundColor: '#132840', padding: '24px'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        {/* Header */}
        <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111'}}>🤖 AI Contract Import</h1>
            <p style={{color: '#666', marginTop: '4px'}}>Полный импорт данных о партнёрах, лодках и ценах</p>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            <button 
              onClick={() => { fetchImportHistory(); setShowHistory(!showHistory); }}
              style={{padding: '8px 16px', backgroundColor: '#1a0a2a', borderRadius: '6px', color: '#a78bfa', border: 'none', cursor: 'pointer', fontWeight: '500'}}
            >
              📜 История ({importHistory.length || '...'})
            </button>
            <div style={{display:'flex',gap:'8px'}}>
              <a href="/import-all" style={{padding:'8px 16px',backgroundColor:'#0d2137',borderRadius:'8px',color:'#60a5fa',textDecoration:'none',fontWeight:'500',border:'1px solid rgba(0,201,255,0.2)'}}>📦 Центр импорта</a>
              <a href="/partners" style={{padding:'8px 16px',backgroundColor:'#f0fdf4',borderRadius:'8px',color:'#059669',textDecoration:'none',fontWeight:'500',border:'1px solid #bbf7d0'}}>👥 Партнёры</a>
              <a href="/" style={{padding:'8px 16px',backgroundColor:'#2563eb',borderRadius:'8px',color:'white',textDecoration:'none',fontWeight:'500'}}>← Калькулятор</a>
            </div>
          </div>
        </div>

        {/* Import History Panel */}
        {showHistory && (
          <div style={{backgroundColor: '#132840', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600'}}>📜 Последние импорты</h3>
              <button onClick={() => setShowHistory(false)} style={{background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'}}>✕</button>
            </div>
            
            {importHistory.length === 0 ? (
              <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>История пуста</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {importHistory.map((item, idx) => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', backgroundColor: idx === 0 ? '#0e3a2a' : '#0f2337',
                      borderRadius: '8px', border: idx === 0 ? '2px solid #10b981' : '1px solid #e5e7eb'
                    }}
                  >
                    <div>
                      <div style={{fontWeight: '600', marginBottom: '4px'}}>
                        {item.import_type === 'single_boat' ? '🚤' : '📄'} {item.partner_name}
                        {idx === 0 && <span style={{marginLeft: '8px', fontSize: '12px', color: '#10b981'}}>(последний)</span>}
                      </div>
                      <div style={{fontSize: '12px', color: '#666'}}>
                        {new Date(item.created_at).toLocaleString('ru-RU')} • 
                        {item.boats_added} лодок • {item.routes_added} маршрутов
                      </div>
                      {item.raw_data?.boats?.length > 0 && (
                        <div style={{fontSize: '11px', color: '#8b5cf6', marginTop: '2px'}}>
                          🚢 {item.raw_data.boats.map((b: any) => b.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        onClick={() => loadHistoryItem(item)}
                        style={{padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'}}
                      >
                        Открыть
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!extractedData ? (
          <div style={{backgroundColor: '#132840', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
            
            {/* Mode Selection */}
            {!importMode ? (
              <div>
                <h2 style={{fontSize: '20px', fontWeight: '600', marginBottom: '24px', textAlign: 'center'}}>Выберите режим импорта</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px', margin: '0 auto'}}>
                  
                  {/* Full Contract Mode */}
                  <div 
                    onClick={() => { setImportMode('full'); fetchExistingPartners(); }}
                    style={{
                      border: '2px solid #e5e7eb', borderRadius: '16px', padding: '32px',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      backgroundColor: '#0f2337'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00C9FF'; e.currentTarget.style.backgroundColor = '#0e2a4a'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = '#0f2337'; }}
                  >
                    <div style={{fontSize: '48px', marginBottom: '16px'}}>📄</div>
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Полный контракт</h3>
                    <p style={{color: '#666', fontSize: '14px'}}>Новый партнёр + все его лодки, маршруты и цены из контракта</p>
                  </div>
                  
                  {/* Single Boat Mode */}
                  <div 
                    onClick={() => { setImportMode('single_boat'); fetchExistingPartners(); }}
                    style={{
                      border: '2px solid #e5e7eb', borderRadius: '16px', padding: '32px',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      backgroundColor: '#0f2337'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = '#0f2337'; }}
                  >
                    <div style={{fontSize: '48px', marginBottom: '16px'}}>🚤</div>
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Одна лодка</h3>
                    <p style={{color: '#666', fontSize: '14px'}}>Добавить лодку к существующему партнёру (PDF одной лодки)</p>
                  </div>
                </div>
              </div>
            ) : (importMode === 'full' || importMode === 'single_boat') && !selectedPartnerId ? (
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                  <button onClick={() => setImportMode(null)} style={{padding: '8px 16px', backgroundColor: '#1a3050', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>← Назад</button>
                  <h2 style={{fontSize: '20px', fontWeight: '600'}}>Выберите партнёра</h2>
                </div>
                
                {/* Partner List */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px'}}>
                  {existingPartnersList.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => { setSelectedPartnerId(p.id); setSelectedPartnerName(p.name); }}
                      style={{
                        border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = '#0f2337'; }}
                    >
                      <div style={{fontWeight: '600', marginBottom: '4px'}}>{p.name}</div>
                      <div style={{fontSize: '12px', color: '#666'}}>{p.contact_phone || 'Нет телефона'}</div>
                      <div style={{fontSize: '12px', color: '#10b981'}}>Комиссия: {p.commission_percent || 15}%</div>
                    </div>
                  ))}
                </div>
                
                {/* Or create new partner */}
                <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center'}}>
                  <span style={{color: '#666'}}>Партнёра нет в списке? </span>
                  <a href="/partners" style={{color: '#60a5fa', textDecoration: 'underline'}}>Создать нового партнёра</a>
                </div>
                {importMode === 'full' && (
                  <div style={{textAlign: 'center', marginTop: '16px'}}>
                    <button 
                      onClick={() => { setSelectedPartnerId(-1); setSelectedPartnerName(''); }}
                      style={{padding: '12px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'}}
                    >
                      🤖 Пропустить — AI определит партнёра из контракта
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Back button and mode indicator */}
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                  <button onClick={() => { setImportMode(null); setSelectedPartnerId(null); setSelectedPartnerName(''); }} style={{padding: '8px 16px', backgroundColor: '#1a3050', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>← Назад</button>
                  {importMode === 'single_boat' && selectedPartnerName && (
                    <div style={{padding: '8px 16px', backgroundColor: '#0d2137', borderRadius: '8px', color: '#059669', fontWeight: '500'}}>
                      🏢 Партнёр: {selectedPartnerName}
                    </div>
                  )}
                </div>
                
                <div style={{display: 'flex', gap: '16px', marginBottom: '24px'}}>
                  <button onClick={() => { 
                    createEmptyData(); 
                    if (importMode === 'single_boat' && selectedPartnerId) {
                      // Will be handled after createEmptyData
                    }
                  }} style={{padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>
                    📝 Создать вручную
                  </button>
                  <span style={{color: '#475569', alignSelf: 'center'}}>или</span>
                </div>
                
                <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>
                  {importMode === 'single_boat' ? '📋 Вставьте данные о лодке (PDF/текст)' : '📋 Вставьте текст контракта для AI-анализа'}
                </h2>
            
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Скопируйте текст из PDF/Word контракта..."
              style={{
                width: '100%', height: '250px', padding: '16px',
                border: '2px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', fontFamily: 'monospace', color: '#e2e8f0',
                backgroundColor: '#0f2337', resize: 'vertical'
              }}
            />
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
              <span style={{fontSize: '14px', color: '#666'}}>{contractText.length} символов</span>
              <button
                onClick={handleAnalyze}
                disabled={loading || contractText.length < 50}
                style={{
                  padding: '12px 32px', borderRadius: '8px', border: 'none',
                  color: 'white', fontWeight: '600', fontSize: '16px',
                  cursor: loading || contractText.length < 50 ? 'not-allowed' : 'pointer',
                  background: loading || contractText.length < 50 ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #7c3aed)'
                }}
              >
                {loading ? '⏳ ' + loadingStatus : '🚀 Анализировать с AI'}
              </button>
            </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div style={{backgroundColor: '#132840', borderRadius: '12px 12px 0 0', display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
              <button onClick={() => setActiveTab('partner')} style={tabStyle(activeTab === 'partner')}>🏢 Партнёр</button>
              <button onClick={() => setActiveTab('boats')} style={tabStyle(activeTab === 'boats')}>🚤 Лодки ({extractedData.boats.length})</button>
              {/* Routes tab hidden - routes are now per-boat */}
              <button onClick={() => setActiveTab('extras')} style={tabStyle(activeTab === 'extras')}>🎁 Extras ({extractedData.extras.length})</button>
              <button onClick={() => setActiveTab('terms')} style={tabStyle(activeTab === 'terms')}>📜 Условия</button>
            </div>

            <div style={{backgroundColor: '#132840', borderRadius: '0 0 12px 12px', padding: '24px', minHeight: '500px'}}>
              
              {/* PARTNER TAB */}
              

            {activeTab === 'partner' && (
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '20px'}}>Информация о партнёре</h3>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
                    <div>
                      <label style={labelStyle}>Название компании *</label>
                      <input value={extractedData.partner_name} onChange={(e) => setExtractedData({...extractedData, partner_name: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Контактное лицо</label>
                      <input value={extractedData.partner_contact_name} onChange={(e) => setExtractedData({...extractedData, partner_contact_name: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Телефон</label>
                      <input value={extractedData.partner_phone} onChange={(e) => setExtractedData({...extractedData, partner_phone: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input value={extractedData.partner_email} onChange={(e) => setExtractedData({...extractedData, partner_email: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Вебсайт</label>
                      <input value={extractedData.partner_website} onChange={(e) => setExtractedData({...extractedData, partner_website: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Комиссия %</label>
                      <input type="number" value={extractedData.commission_percent || ''} onChange={(e) => setExtractedData({...extractedData, commission_percent: Number(e.target.value)})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Контракт с</label>
                      <input type="date" value={extractedData.contract_start} onChange={(e) => setExtractedData({...extractedData, contract_start: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Контракт до</label>
                      <input type="date" value={extractedData.contract_end} onChange={(e) => setExtractedData({...extractedData, contract_end: e.target.value})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Адрес</label>
                      <input value={extractedData.partner_address} onChange={(e) => setExtractedData({...extractedData, partner_address: e.target.value})} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {/* BOATS TAB */}
              {activeTab === 'boats' && (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: '600'}}>Лодки</h3>
                    <button onClick={addBoat} style={{padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>+ Добавить лодку</button>
                  </div>
                  
                  {extractedData.boats.map((boat, bi) => (
                    <div key={bi} style={{border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px', backgroundColor: '#0f2337'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                        <h4 style={{fontSize: '16px', fontWeight: '600'}}>🚤 Лодка #{bi + 1}: {boat.name || 'Новая'}</h4>
                        <button onClick={() => removeBoat(bi)} style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer'}}>🗑️ Удалить</button>
                      </div>
                      
                      {/* Basic Info */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px'}}>Основная информация</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px'}}>
                          <div><label style={labelStyle}>Название *</label><input value={boat.name} onChange={(e) => updateBoat(bi, 'name', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Тип *</label>
                            <select value={boat.type} onChange={(e) => updateBoat(bi, 'type', e.target.value)} style={inputStyle}>
                              <option value="catamaran">Catamaran</option>
                              <option value="sailing_catamaran">Sailing Catamaran</option>
                              <option value="speedboat">Speedboat</option>
                              <option value="yacht">Yacht</option>
                            </select>
                          </div>
                          <div><label style={labelStyle}>Модель</label><input value={boat.model || ''} onChange={(e) => updateBoat(bi, 'model', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Год</label><input value={boat.year_built || ''} onChange={(e) => updateBoat(bi, 'year_built', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Длина (ft)</label><input type="number" value={boat.length_ft || ''} onChange={(e) => updateBoat(bi, 'length_ft', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Ширина (ft)</label><input type="number" value={boat.beam_ft || ''} onChange={(e) => updateBoat(bi, 'beam_ft', Number(e.target.value))} style={inputStyle} /></div>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px'}}>Вместимость и цены за доп. гостей</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px'}}>
                          <div><label style={labelStyle}>Max Day</label><input type="number" value={boat.max_pax_day || ''} onChange={(e) => updateBoat(bi, 'max_pax_day', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Max Overnight</label><input type="number" value={boat.max_pax_overnight || ''} onChange={(e) => updateBoat(bi, 'max_pax_overnight', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Включено (чел)</label><input type="number" value={boat.base_pax || ''} onChange={(e) => updateBoat(bi, 'base_pax', Number(e.target.value))} style={inputStyle} placeholder="12" /></div>
                          <div><label style={labelStyle}>Доплата/чел (THB)</label><input type="number" value={boat.extra_pax_price || ''} onChange={(e) => updateBoat(bi, 'extra_pax_price', Number(e.target.value))} style={inputStyle} placeholder="2500" /></div>
                          <div><label style={labelStyle}>Каюты</label><input type="number" value={boat.cabins || ''} onChange={(e) => updateBoat(bi, 'cabins', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Туалеты</label><input type="number" value={boat.toilets || ''} onChange={(e) => updateBoat(bi, 'toilets', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Экипаж</label><input type="number" value={boat.crew_count || ''} onChange={(e) => updateBoat(bi, 'crew_count', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Пирс</label><input value={boat.default_pier} onChange={(e) => updateBoat(bi, 'default_pier', e.target.value)} style={inputStyle} /></div>
                        </div>
                      </div>

                      {/* Technical */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px'}}>Технические характеристики</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px'}}>
                          <div><label style={labelStyle}>Скорость (узлы)</label><input type="number" value={boat.speed_cruise || ''} onChange={(e) => updateBoat(bi, 'speed_cruise', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Max скорость</label><input type="number" value={boat.speed_max || ''} onChange={(e) => updateBoat(bi, 'speed_max', Number(e.target.value))} style={inputStyle} /></div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px'}}>
                            <input type="checkbox" checked={boat.air_conditioning} onChange={(e) => updateBoat(bi, 'air_conditioning', e.target.checked)} />
                            <span style={{fontSize: '13px'}}>Кондиционер</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px'}}>
                            <input type="checkbox" checked={boat.generator} onChange={(e) => updateBoat(bi, 'generator', e.target.checked)} />
                            <span style={{fontSize: '13px'}}>Генератор</span>
                          </div>
                        </div>
                      </div>

                      {/* Included Features */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '12px'}}>✅ Включено в стоимость</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px'}}>
                          {boat.features.included.map((f, fi) => (
                            <div key={fi} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: f.included ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)'}}>
                              <input type="checkbox" checked={f.included} onChange={(e) => toggleFeature(bi, 'included', fi, 'included', e.target.checked)} />
                              <span style={{fontSize: '13px', color: '#cbd5e1'}}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Paid Features */}
                      <div>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '12px'}}>💰 Платные опции</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px'}}>
                          {boat.features.paid.map((f, fi) => (
                            <div key={fi} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: f.paid ? '#f3e8ff' : 'white', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)'}}>
                              <input type="checkbox" checked={f.paid} onChange={(e) => toggleFeature(bi, 'paid', fi, 'paid', e.target.checked)} />
                              <span style={{fontSize: '13px', flex: 1}}>{f.name}</span>
                              {f.paid && (
                                <>
                                  <input type="number" value={f.price || ''} onChange={(e) => toggleFeature(bi, 'paid', fi, 'price', Number(e.target.value))} placeholder="Цена" style={{width: '70px', padding: '4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '12px', color: '#e2e8f0'}} />
                                  <select value={f.pricePer} onChange={(e) => toggleFeature(bi, 'paid', fi, 'pricePer', e.target.value)} style={{padding: '4px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '12px', color: '#e2e8f0'}}>
                                    {PRICE_PER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div style={{marginTop: '16px'}}>
                        <label style={labelStyle}>Примечания</label>
                        <textarea value={boat.notes} onChange={(e) => updateBoat(bi, 'notes', e.target.value)} style={{...inputStyle, height: '60px'}} placeholder="Особенности, ограничения..." />
                      </div>

                      {/* Routes for this boat */}
                      <div style={{marginTop: '20px', borderTop: '2px solid #3b82f6', paddingTop: '16px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                          <h5 style={{fontSize: '14px', fontWeight: '600', color: '#3b82f6'}}>🗺️ Маршруты этой лодки ({boat.routes?.length || 0})</h5>
                          <button 
                            onClick={() => {
                              const boats = [...extractedData.boats];
                              boats[bi].routes = [...(boats[bi].routes || []), {
                                destination: '',
                                departure_pier: boat.default_pier || 'Chalong Pier',
                                time_slot: 'full_day',
                                duration_hours: 8,
                                duration_nights: null,
                                distance_nm: null,
                                base_price: null,
                                agent_price: null,
                                fuel_surcharge: 0,
                                extra_pax_price: null,
                                base_pax: null,
                                season: 'all',
                                min_notice_hours: null,
                                notes: ''
                              }];
                              setExtractedData({...extractedData, boats});
                            }}
                            style={{padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'}}
                          >
                            + Добавить маршрут
                          </button>
                        </div>
                        
                        {(boat.routes || []).length === 0 ? (
                          <p style={{color: '#475569', fontSize: '13px'}}>Нет маршрутов. Добавьте маршрут для этой лодки.</p>
                        ) : (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {boat.routes.map((route: any, ri: number) => (
                              <div key={ri} style={{border: '1px solid rgba(0,201,255,0.2)', borderRadius: '8px', padding: '12px', backgroundColor: '#0d2137'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                                  <span style={{fontWeight: '500', color: '#1d4ed8'}}>Маршрут #{ri + 1}</span>
                                  <button 
                                    onClick={() => {
                                      const boats = [...extractedData.boats];
                                      boats[bi].routes = boats[bi].routes.filter((_: any, i: number) => i !== ri);
                                      setExtractedData({...extractedData, boats});
                                    }}
                                    style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px'}}
                                  >🗑️</button>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px'}}>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Направление *</label>
                                    <input 
                                      value={route.destination || ''} 
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].destination = e.target.value;
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="KHAI / NAKA NOI"
                                    />
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Часов</label>
                                    <input 
                                      type="number"
                                      value={route.duration_hours || 8}
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].duration_hours = Number(e.target.value);
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="8"
                                    />
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Ночей</label>
                                    <input 
                                      type="number"
                                      value={route.duration_nights || 0}
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].duration_nights = Number(e.target.value);
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Сезон</label>
                                    <select 
                                      value={route.season || 'all'}
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].season = e.target.value;
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                    >
                                      <option value="all">Все сезоны</option>
                                      <option value="low">Low</option>
                                      <option value="high">High</option>
                                      <option value="peak">Peak</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Цена агента (THB) *</label>
                                    <input 
                                      type="number"
                                      value={route.agent_price || route.base_price || ''} 
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].agent_price = Number(e.target.value);
                                        boats[bi].routes[ri].base_price = Number(e.target.value);
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="180000"
                                    />
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Топливо (+THB)</label>
                                    <input 
                                      type="number"
                                      value={route.fuel_surcharge || ''} 
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].fuel_surcharge = Number(e.target.value);
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label style={{fontSize: '11px', color: '#64748b'}}>Макс. гостей</label>
                                    <input 
                                      type="number"
                                      value={route.max_guests || ''} 
                                      onChange={(e) => {
                                        const boats = [...extractedData.boats];
                                        boats[bi].routes[ri].max_guests = Number(e.target.value);
                                        setExtractedData({...extractedData, boats});
                                      }}
                                      style={{width: '100%', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px'}}
                                      placeholder="12"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Тарифные тиры */}
                        {extractedData.pricing_rules && extractedData.pricing_rules.length > 0 && (
                          <div style={{marginTop: '16px'}}>
                            <h4 style={{fontSize: '14px', fontWeight: '600', color: '#1d4ed8', marginBottom: '8px'}}>📊 Тарифные тиры ({extractedData.pricing_rules.length})</h4>
                            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '12px'}}>
                              <thead>
                                <tr style={{background: '#eff6ff'}}>
                                  <th style={{padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #bfdbfe'}}>Гостей</th>
                                  <th style={{padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #bfdbfe'}}>NET (агент)</th>
                                  <th style={{padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #bfdbfe'}}>GROSS (клиент)</th>
                                  <th style={{padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #bfdbfe'}}>Комиссия</th>
                                </tr>
                              </thead>
                              <tbody>
                                {extractedData.pricing_rules.filter((p: any) => p.boat_name?.toLowerCase().includes(boat.name?.toLowerCase().split(' ')[0] || '---') || !p.boat_name).map((tier: any, ti: number) => (
                                  <tr key={ti}>
                                    <td style={{padding: '4px 8px', borderBottom: '1px solid #f3f4f6'}}>{tier.guests_from || '?'} чел.</td>
                                    <td style={{padding: '4px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#059669', fontWeight: '600'}}>{Number(tier.base_price || 0).toLocaleString()} ฿</td>
                                    <td style={{padding: '4px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontWeight: '600'}}>{Number(tier.client_price || 0).toLocaleString()} ฿</td>
                                    <td style={{padding: '4px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#d97706'}}>{Number(tier.commission_amount || 0).toLocaleString()} ฿</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ROUTES TAB */}
              {activeTab === 'routes' && (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: '600'}}>Маршруты и цены</h3>
                    <button onClick={addRoute} style={{padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>+ Добавить маршрут</button>
                  </div>
                  
                  {extractedData.routes.map((route, ri) => (
                    <div key={ri} style={{border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '12px', backgroundColor: '#0f2337'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <span style={{fontWeight: '600'}}>Маршрут #{ri + 1}</span>
                        <button onClick={() => removeRoute(ri)} style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                      </div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px'}}>
                        <div><label style={labelStyle}>Направление *</label><input value={route.destination} onChange={(e) => updateRoute(ri, 'destination', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Пирс отправления</label><input value={route.departure_pier} onChange={(e) => updateRoute(ri, 'departure_pier', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Тип</label>
                          <select value={route.charter_type || 'full_day'} onChange={(e) => updateRoute(ri, 'charter_type', e.target.value)} style={inputStyle}>
                            <option value="morning">Morning (4h)</option>
                            <option value="afternoon">Afternoon (4h)</option>
                            <option value="full_day">Full Day (8h)</option>
                            <option value="half_day">Half Day</option>
                            <option value="overnight">Overnight</option>
                            <option value="sunset">Sunset</option>
                          </select>
                        </div>
                        <div><label style={labelStyle}>Сезон {route.season_dates && <span style={{fontSize:'11px',color:'#6b7280'}}>({route.season_dates})</span>}</label>
                          <input value={`${route.season}${route.season_dates ? ' (' + route.season_dates + ')' : ''}`} onChange={(e) => updateRoute(ri, 'season', e.target.value.split(' (')[0])} style={inputStyle} placeholder="low / high / chinese_new_year" />
                        </div>
                        <div><label style={labelStyle}>Длительность (ч)</label><input type="number" value={route.duration_hours || ''} onChange={(e) => updateRoute(ri, 'duration_hours', Number(e.target.value))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Расстояние (nm)</label><input type="number" value={route.distance_nm || ''} onChange={(e) => updateRoute(ri, 'distance_nm', Number(e.target.value))} style={inputStyle} /></div>
                      </div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginTop: '12px'}}>
                        <div><label style={labelStyle}>Базовая цена (THB) *</label><input type="number" value={route.base_price || ''} onChange={(e) => updateRoute(ri, 'base_price', Number(e.target.value))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Агент. цена</label><input type="number" value={route.agent_price || ''} onChange={(e) => updateRoute(ri, 'agent_price', Number(e.target.value))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Топливный сбор</label><input type="number" value={route.fuel_surcharge || ''} onChange={(e) => updateRoute(ri, 'fuel_surcharge', Number(e.target.value))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Гостей от</label><input type="number" value={route.guests_from || ''} onChange={(e) => updateRoute(ri, 'guests_from', Number(e.target.value))} style={{...inputStyle, width: '70px'}} /></div>
                        <div><label style={labelStyle}>Гостей до</label><input type="number" value={route.guests_to || ''} onChange={(e) => updateRoute(ri, 'guests_to', Number(e.target.value))} style={{...inputStyle, width: '70px'}} /></div>
                        <div><label style={labelStyle}>Доп. гость (THB)</label><input type="number" value={route.extra_pax_price || ''} onChange={(e) => updateRoute(ri, 'extra_pax_price', Number(e.target.value))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Мин. время (ч)</label><input type="number" value={route.min_notice_hours || ''} onChange={(e) => updateRoute(ri, 'min_notice_hours', Number(e.target.value))} style={inputStyle} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EXTRAS TAB */}
              {activeTab === 'extras' && (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: '600'}}>Дополнительные услуги</h3>
                    <button onClick={addExtra} style={{padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>+ Добавить</button>
                  </div>
                  
                  {extractedData.extras.map((extra, ei) => (
                    <div key={ei} style={{display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr 1fr 1fr auto', gap: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#0f2337', alignItems: 'end'}}>
                      <div>
                        <label style={labelStyle}>Категория</label>
                        <select value={extra.category} onChange={(e) => updateExtra(ei, 'category', e.target.value)} style={inputStyle}>
                          {EXTRA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div><label style={labelStyle}>Название EN</label><input value={extra.name} onChange={(e) => updateExtra(ei, 'name', e.target.value)} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Название RU</label><input value={extra.name_ru} onChange={(e) => updateExtra(ei, 'name_ru', e.target.value)} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Цена</label><input type="number" value={extra.price || ''} onChange={(e) => updateExtra(ei, 'price', Number(e.target.value))} style={inputStyle} /></div>
                      <div>
                        <label style={labelStyle}>За</label>
                        <select value={extra.pricePer} onChange={(e) => updateExtra(ei, 'pricePer', e.target.value)} style={inputStyle}>
                          {PRICE_PER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px'}}>
                        <input type="checkbox" checked={extra.included} onChange={(e) => updateExtra(ei, 'included', e.target.checked)} />
                        <span style={{fontSize: '12px'}}>Включено</span>
                      </div>
                      <button onClick={() => removeExtra(ei)} style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '8px'}}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}

              {/* TERMS TAB */}
              {activeTab === 'terms' && (
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '20px'}}>Условия и политики</h3>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                    <div>
                      <label style={{...labelStyle, fontSize: '14px', fontWeight: '600', color: '#16a34a'}}>✅ Включено в стоимость</label>
                      <textarea
                        value={extractedData.general_inclusions.join('\n')}
                        onChange={(e) => setExtractedData({...extractedData, general_inclusions: e.target.value.split('\n').filter(x => x.trim())})}
                        style={{...inputStyle, height: '200px'}}
                        placeholder="По одному пункту на строку"
                      />
                    </div>
                    <div>
                      <label style={{...labelStyle, fontSize: '14px', fontWeight: '600', color: '#dc2626'}}>❌ НЕ включено</label>
                      <textarea
                        value={extractedData.general_exclusions.join('\n')}
                        onChange={(e) => setExtractedData({...extractedData, general_exclusions: e.target.value.split('\n').filter(x => x.trim())})}
                        style={{...inputStyle, height: '200px'}}
                        placeholder="По одному пункту на строку"
                      />
                    </div>
                  </div>

                  <div style={{marginTop: '20px'}}>
                    <label style={labelStyle}>Условия оплаты</label>
                    <textarea value={extractedData.payment_terms} onChange={(e) => setExtractedData({...extractedData, payment_terms: e.target.value})} style={{...inputStyle, height: '80px'}} placeholder="Депозит, сроки оплаты..." />
                  </div>

                  <div style={{marginTop: '16px'}}>
                    <label style={labelStyle}>Политика отмены</label>
                    <textarea value={extractedData.cancellation_policy} onChange={(e) => setExtractedData({...extractedData, cancellation_policy: e.target.value})} style={{...inputStyle, height: '80px'}} placeholder="Условия отмены и возврата..." />
                  </div>

                  <div style={{marginTop: '16px'}}>
                    <label style={labelStyle}>Особые условия</label>
                    <textarea value={extractedData.special_conditions} onChange={(e) => setExtractedData({...extractedData, special_conditions: e.target.value})} style={{...inputStyle, height: '80px'}} placeholder="Дополнительные условия контракта..." />
                  </div>
                </div>
              )

            }
            </div>

            {/* Actions */}
            <div style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
              <button onClick={() => setExtractedData(null)} style={{padding: '14px 28px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', backgroundColor: '#132840', cursor: 'pointer', fontSize: '16px'}}>← Назад</button>
              <button onClick={saveToDatabase} style={{flex: 1, padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer'}}>💾 Сохранить всё в базу данных</button>
            </div>
            
            {saveStatus && (
              <div style={{marginTop: '16px', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '16px', backgroundColor: saveStatus.includes('✅') ? '#dcfce7' : saveStatus.includes('❌') ? '#fee2e2' : '#dbeafe', color: saveStatus.includes('✅') ? '#166534' : saveStatus.includes('❌') ? '#991b1b' : '#1e40af'}}>
                {saveStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </AdminGuard>
  );
}
