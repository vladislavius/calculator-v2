'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
}

interface ExtractedRoute {
  destination: string;
  departure_pier: string;
  time_slot: string;
  duration_hours: number | null;
  distance_nm: number | null;
  base_price: number | null;
  agent_price: number | null;
  fuel_surcharge: number | null;
  extra_pax_price: number | null;
  base_pax: number | null;
  season: string;
  min_notice_hours: number | null;
  notes: string;
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
}

const DEFAULT_FEATURES = {
  included: [
    // Crew
    { name: 'Captain', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Crew', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Hostess', included: false, paid: false, price: null, pricePer: 'day', notes: '' },
    { name: 'Chef', included: false, paid: false, price: null, pricePer: 'day', notes: '' },
    // Safety
    { name: 'Life Jackets', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'First Aid Kit', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Insurance', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    // Amenities
    { name: 'Towels', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Snorkeling Gear', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Fishing Gear', included: false, paid: false, price: null, pricePer: 'included', notes: '' },
    // Food & Drinks
    { name: 'Drinking Water', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Soft Drinks', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Fresh Fruits', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Thai Lunch', included: true, paid: false, price: null, pricePer: 'included', notes: '' },
    { name: 'Breakfast', included: false, paid: false, price: null, pricePer: 'person', notes: '' },
    { name: 'Dinner', included: false, paid: false, price: null, pricePer: 'person', notes: '' },
    { name: 'BBQ Seafood', included: false, paid: false, price: null, pricePer: 'person', notes: '' },
  ],
  paid: [
    // Water Toys
    { name: 'Seabob', included: false, paid: true, price: 10000, pricePer: 'day', notes: '' },
    { name: 'Jet Ski', included: false, paid: true, price: 5000, pricePer: 'hour', notes: '' },
    { name: 'Kayak', included: false, paid: true, price: 0, pricePer: 'included', notes: '' },
    { name: 'SUP Board', included: false, paid: true, price: 0, pricePer: 'included', notes: '' },
    { name: 'Water Slide', included: false, paid: true, price: 0, pricePer: 'included', notes: '' },
    { name: 'Floating Mat', included: false, paid: true, price: 0, pricePer: 'included', notes: '' },
    { name: 'Wakeboard', included: false, paid: true, price: 3000, pricePer: 'hour', notes: '' },
    { name: 'Banana Boat', included: false, paid: true, price: 2000, pricePer: 'ride', notes: '' },
    // Services
    { name: 'Masseuse', included: false, paid: true, price: 4000, pricePer: 'day', notes: '' },
    { name: 'Photographer', included: false, paid: true, price: 8000, pricePer: 'day', notes: '' },
    { name: 'DJ', included: false, paid: true, price: 10000, pricePer: 'day', notes: '' },
    { name: 'Decorations', included: false, paid: true, price: 5000, pricePer: 'event', notes: '' },
    // Alcohol
    { name: 'Beer (Local)', included: false, paid: true, price: 80, pricePer: 'can', notes: '' },
    { name: 'Beer (Import)', included: false, paid: true, price: 120, pricePer: 'can', notes: '' },
    { name: 'Wine', included: false, paid: true, price: 1500, pricePer: 'bottle', notes: '' },
    { name: 'Champagne', included: false, paid: true, price: 3500, pricePer: 'bottle', notes: '' },
    { name: 'Spirits', included: false, paid: true, price: 2500, pricePer: 'bottle', notes: '' },
    // Transfers
    { name: 'Hotel Pickup', included: false, paid: true, price: 0, pricePer: 'included', notes: '' },
    { name: 'Airport Transfer', included: false, paid: true, price: 1500, pricePer: 'way', notes: '' },
    { name: 'VIP Transfer', included: false, paid: true, price: 3500, pricePer: 'way', notes: '' },
  ]
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

  const handleAnalyze = async () => {
    if (contractText.length < 50) {
      alert('Вставьте текст контракта (минимум 50 символов)');
      return;
    }
    
    setLoading(true);
    setLoadingStatus('AI анализирует контракт...');
    
    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText, fileName: 'contract.txt' })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Merge AI results with defaults
      const aiData = result.data;
      setExtractedData({
        partner_name: aiData.partner_name || '',
        partner_contact_name: '',
        partner_phone: aiData.partner_contact || '',
        partner_email: aiData.partner_email || '',
        partner_website: '',
        partner_address: '',
        commission_percent: 15,
        contract_start: '2024-11-01',
        contract_end: '2025-10-31',
        payment_terms: '',
        cancellation_policy: '',
        boats: aiData.boats?.map((b: any) => ({
          ...b,
          beam_ft: null,
          draft_ft: null,
          toilets: null,
          crew_count: 3,
          speed_cruise: null,
          speed_max: null,
          fuel_capacity: null,
          water_capacity: null,
          generator: false,
          air_conditioning: true,
          stabilizers: false,
          bow_thruster: false,
          stern_thruster: false,
          default_pier: 'Chalong Pier',
          photos_url: '',
          notes: '',
          features: DEFAULT_FEATURES
        })) || [],
        routes: (aiData.routes || aiData.pricing_rules)?.map((r: any) => ({
          destination: r.destination || r.duration_label || ((r.duration_nights || 0) + 1) + 'D/' + (r.duration_nights || 0) + 'N',
          duration_nights: r.duration_nights || 0,
          guests_from: r.guests_from || 1,
          guests_to: r.guests_to || 10,
          season: r.season || 'high',
          charter_type: r.charter_type || ((r.duration_nights || 0) > 0 ? 'overnight' : 'full_day'),
          ...r,
          departure_pier: 'Chalong Pier',
          duration_hours: r.time_slot === 'half_day' ? 4 : 8,
          distance_nm: null,
          agent_price: r.base_price,
          extra_pax_price: 2000,
          base_pax: 10,
          min_notice_hours: 24,
          notes: ''
        })) || [],
        extras: (aiData.optional_extras || aiData.extras || []).map((e: any) => ({
          category: 'Other',
          name: e.name,
          name_ru: '',
          included: false,
          price: e.price,
          pricePer: e.per || 'unit',
          min_order: null,
          max_order: null,
          notes: ''
        })) || [],
        general_inclusions: [
          'Captain and crew',
          'Fuel for standard route',
          'Snorkeling equipment',
          'Soft drinks and water',
          'Fresh fruits',
          'Thai lunch',
          'Towels',
          'Insurance'
        ],
        general_exclusions: [
          'Alcohol',
          'National Park fees',
          'Jet ski and water toys rental',
          'Tips for crew',
          'VAT 7% (if invoice required)'
        ],
        special_conditions: ''
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
        draft_ft: null, year_built: '', max_pax_day: null, max_pax_overnight: null,
        cabins: null, toilets: null, crew_count: 3, speed_cruise: null, speed_max: null,
        fuel_capacity: null, water_capacity: null, generator: false, air_conditioning: true,
        stabilizers: false, bow_thruster: false, stern_thruster: false,
        default_pier: 'Chalong Pier', photos_url: '', notes: '',
        features: JSON.parse(JSON.stringify(DEFAULT_FEATURES))
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
        duration_hours: 8, distance_nm: null, base_price: null, agent_price: null,
        fuel_surcharge: 0, extra_pax_price: 2000, base_pax: 10, season: 'high',
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
    
    try {
      // 1. Smart partner upsert - find by partial name match
      const partnerFirstWord = extractedData.partner_name.split(' ')[0];
      console.log('Looking for partner containing:', partnerFirstWord);
      
      const { data: existingPartners } = await supabase
        .from('partners')
        .select('*')
        .ilike('name', '%' + partnerFirstWord + '%');
      
      console.log('Found partners:', existingPartners);
      
      let partnerId;
      
      if (existingPartners && existingPartners.length > 0) {
        // Partner exists - update with new data
        const existing = existingPartners[0];
        partnerId = existing.id;
        console.log('Updating existing partner:', existing.name, 'ID:', partnerId);
        
        await supabase.from('partners').update({
          contact_phone: extractedData.partner_phone || existing.contact_phone,
          contact_email: extractedData.partner_email || existing.contact_email,
          commission_percent: extractedData.commission_percent || existing.commission_percent || 15,
          contract_valid_until: extractedData.contract_end || existing.contract_valid_until,
          notes: extractedData.partner_website || extractedData.partner_address 
            ? (existing.notes || '') + '\n---\nUpdated: ' + new Date().toISOString().split('T')[0] + '\nWebsite: ' + (extractedData.partner_website || '') + '\nAddress: ' + (extractedData.partner_address || '')
            : existing.notes
        }).eq('id', partnerId);
        
      } else {
        // Create new partner
        console.log('Creating new partner:', extractedData.partner_name);
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
        console.log('Created partner ID:', partnerId);
      }


      // 2. Smart boats upsert - find by name + partner
      const savedBoatIds: Record<string, number> = {};
      
      for (const boat of extractedData.boats) {
        console.log('Processing boat:', boat.name);
        
        // Find existing boat by name and partner
        const { data: existingBoats } = await supabase
          .from('boats')
          .select('*')
          .eq('partner_id', partnerId)
          .ilike('name', '%' + boat.name.split(' ').pop() + '%');
        
        let boatId: number;
        
        if (existingBoats && existingBoats.length > 0) {
          // Update existing boat
          boatId = existingBoats[0].id;
          console.log('Updating existing boat:', existingBoats[0].name, 'ID:', boatId);
          
          await supabase.from('boats').update({
            boat_type: boat.type || existingBoats[0].boat_type,
            model: boat.model || existingBoats[0].model,
            length_ft: boat.length_ft || existingBoats[0].length_ft,
            year_built: boat.year_built || existingBoats[0].year_built,
            cabins: boat.cabins || existingBoats[0].cabins
          }).eq('id', boatId);
          
        } else {
          // Create new boat
          console.log('Creating new boat:', boat.name);
          const boatCode = extractedData.partner_name.substring(0, 3).toUpperCase() + '-' + boat.name.replace(/\s/g, '').substring(0, 8);
          
          const { data: newBoat, error: boatError } = await supabase
            .from('boats')
            .insert({
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
              active: true
            })
            .select('id')
            .single();

          if (boatError) {
            console.error('Boat insert error:', boatError);
            continue;
          }
          boatId = newBoat.id;
          console.log('Created boat ID:', boatId);
        }
        
        savedBoatIds[boat.name] = boatId;
        
        // 3. Process routes and SEASONAL PRICES for this boat
        for (const route of extractedData.routes) {
          console.log('Processing route:', route.destination, 'for boat:', boat.name);
          
          // Find or create route
          const { data: existingRoutes } = await supabase
            .from('routes')
            .select('id')
            .ilike('name', '%' + route.destination.split(' ')[0] + '%');
          
          let routeId: number;
          
          if (existingRoutes && existingRoutes.length > 0) {
            routeId = existingRoutes[0].id;
            console.log('Using existing route ID:', routeId);
          } else {
            const { data: newRoute, error: routeError } = await supabase
              .from('routes')
              .insert({
                name: route.destination,
                name_en: route.destination,
                duration_hours: route.duration_hours || 8,
                duration_nights: route.duration_nights || 0
              })
              .select('id')
              .single();

            if (routeError) {
              console.error('Route insert error:', routeError);
              continue;
            }
            routeId = newRoute.id;
            console.log('Created route ID:', routeId);
          }

          // SEASONAL PRICE LOGIC
          const season = route.season || 'high';
          const today = new Date().toISOString().split('T')[0];
          
          // Find existing active price for this boat + route + season
          const { data: existingPrices } = await supabase
            .from('route_prices')
            .select('*')
            .eq('boat_id', boatId)
            .eq('route_id', routeId)
            .eq('season', season)
            .gte('valid_to', today)
            .order('valid_from', { ascending: false })
            .limit(1);
          
          if (existingPrices && existingPrices.length > 0) {
            // Close old price (create version history)
            const oldPrice = existingPrices[0];
            console.log('Updating price - closing old ID:', oldPrice.id);
            
            await supabase
              .from('route_prices')
              .update({ valid_to: today })
              .eq('id', oldPrice.id);
            
            // Create new price version
            await supabase.from('route_prices').insert({
              boat_id: boatId,
              route_id: routeId,
              season: season,
              time_slot: route.time_slot || 'full_day',
              base_price: route.base_price || oldPrice.base_price,
              agent_price: route.agent_price || route.base_price || oldPrice.agent_price,
              client_price: route.base_price || oldPrice.client_price,
              fuel_surcharge: route.fuel_surcharge ?? oldPrice.fuel_surcharge ?? 0,
              extra_pax_price: oldPrice.extra_pax_price || 2000,
              base_pax: oldPrice.base_pax || 2,
              valid_from: today,
              valid_to: '2027-12-31'
            });
            console.log('Created new price version');
            
          } else {
            // Create new price
            console.log('Creating new price');
            await supabase.from('route_prices').insert({
              boat_id: boatId,
              route_id: routeId,
              season: season,
              time_slot: route.time_slot || 'full_day',
              base_price: route.base_price || 50000,
              agent_price: route.agent_price || route.base_price || 50000,
              client_price: route.base_price || 50000,
              fuel_surcharge: route.fuel_surcharge || 0,
              extra_pax_price: 2000,
              base_pax: 2,
              valid_from: today,
              valid_to: '2027-12-31'
            });
          }
        }
        
        // 4. Save boat options - find in options_catalog first
        if (boat.features) {
          const allFeatures = [...(boat.features.included || []), ...(boat.features.paid || [])];
          for (const feature of allFeatures) {
            if (!feature.name) continue;
            
            console.log('Processing feature:', feature.name);
            
            // Find option in catalog by name (partial match)
            const { data: catalogOption } = await supabase
              .from('options_catalog')
              .select('id, name_en')
              .ilike('name_en', '%' + feature.name.split(' ')[0] + '%')
              .limit(1)
              .maybeSingle();
            
            if (!catalogOption) {
              console.log('Option not found in catalog, creating:', feature.name);
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
              console.log('Found in catalog:', catalogOption.name_en, 'ID:', catalogOption.id);
              
              // Check if boat_option already exists
              const { data: existingOpt } = await supabase
                .from('boat_options')
                .select('id')
                .eq('boat_id', boatId)
                .eq('option_id', catalogOption.id)
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
                  option_id: catalogOption.id,
                  status: feature.included ? 'included' : 'paid_optional',
                  price: feature.price || 0,
                  price_per: feature.pricePer === 'day' ? 'day' : 'trip',
                  available: true
                });
              }
            }
          }
          console.log('Finished processing boat options');
        }
      }

      // 5. Save pricing rules (complex pricing with seasons/guests/duration)
      if (extractedData.pricing_rules && extractedData.pricing_rules.length > 0) {
        console.log('Saving pricing rules:', extractedData.pricing_rules.length);
        
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
              charter_type: rule.charter_type || 'overnight',
              notes: rule.notes,
              updated_at: new Date().toISOString()
            }).eq('id', existingRule.id);
          } else {
            // Insert new
            await supabase.from('boat_pricing_rules').insert({
              boat_id: boatId,
              charter_type: rule.charter_type || 'overnight',
              season: rule.season,
              duration_nights: rule.duration_nights || 0,
              guests_from: rule.guests_from,
              guests_to: rule.guests_to,
              base_price: rule.base_price,
              notes: rule.notes
            });
          }
        }
        console.log('Pricing rules saved!');
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
              .ilike('name_en', '%' + item.name.split(' ')[0] + '%')
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
      
      setSaveStatus('✅ Успешно! Партнёр, лодки, ценовые правила (' + (extractedData.pricing_rules?.length || 0) + ' вариантов) и опции сохранены.');
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveStatus('❌ Ошибка: ' + error.message);
    }
  };

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#1f2937',
    width: '100%',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  };

  const tabStyle = (active: boolean) => ({
    padding: '12px 24px',
    border: 'none',
    borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#2563eb' : '#6b7280',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    fontSize: '14px'
  });

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        {/* Header */}
        <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#111'}}>🤖 AI Contract Import</h1>
            <p style={{color: '#666', marginTop: '4px'}}>Полный импорт данных о партнёрах, лодках и ценах</p>
          </div>
          <a href="/" style={{padding: '8px 16px', backgroundColor: '#e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none'}}>← Назад к поиску</a>
        </div>

        {!extractedData ? (
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
            <div style={{display: 'flex', gap: '16px', marginBottom: '24px'}}>
              <button onClick={createEmptyData} style={{padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>
                📝 Создать вручную
              </button>
              <span style={{color: '#9ca3af', alignSelf: 'center'}}>или</span>
            </div>
            
            <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>📋 Вставьте текст контракта для AI-анализа</h2>
            
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Скопируйте текст из PDF/Word контракта..."
              style={{
                width: '100%', height: '250px', padding: '16px',
                border: '2px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', fontFamily: 'monospace', color: '#1f2937',
                backgroundColor: '#fafafa', resize: 'vertical'
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
        ) : (
          <div>
            {/* Tabs */}
            <div style={{backgroundColor: 'white', borderRadius: '12px 12px 0 0', display: 'flex', borderBottom: '1px solid #e5e7eb'}}>
              <button onClick={() => setActiveTab('partner')} style={tabStyle(activeTab === 'partner')}>🏢 Партнёр</button>
              <button onClick={() => setActiveTab('boats')} style={tabStyle(activeTab === 'boats')}>🚤 Лодки ({extractedData.boats.length})</button>
              <button onClick={() => setActiveTab('routes')} style={tabStyle(activeTab === 'routes')}>🗺️ Маршруты ({extractedData.routes.length})</button>
              <button onClick={() => setActiveTab('extras')} style={tabStyle(activeTab === 'extras')}>🎁 Extras ({extractedData.extras.length})</button>
              <button onClick={() => setActiveTab('terms')} style={tabStyle(activeTab === 'terms')}>📜 Условия</button>
            </div>

            <div style={{backgroundColor: 'white', borderRadius: '0 0 12px 12px', padding: '24px', minHeight: '500px'}}>
              
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
                    <div key={bi} style={{border: '2px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px', backgroundColor: '#fafafa'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                        <h4 style={{fontSize: '16px', fontWeight: '600'}}>🚤 Лодка #{bi + 1}: {boat.name || 'Новая'}</h4>
                        <button onClick={() => removeBoat(bi)} style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer'}}>🗑️ Удалить</button>
                      </div>
                      
                      {/* Basic Info */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px'}}>Основная информация</h5>
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
                          <div><label style={labelStyle}>Модель</label><input value={boat.model} onChange={(e) => updateBoat(bi, 'model', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Год</label><input value={boat.year_built} onChange={(e) => updateBoat(bi, 'year_built', e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Длина (ft)</label><input type="number" value={boat.length_ft || ''} onChange={(e) => updateBoat(bi, 'length_ft', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Ширина (ft)</label><input type="number" value={boat.beam_ft || ''} onChange={(e) => updateBoat(bi, 'beam_ft', Number(e.target.value))} style={inputStyle} /></div>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px'}}>Вместимость</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px'}}>
                          <div><label style={labelStyle}>Max Day</label><input type="number" value={boat.max_pax_day || ''} onChange={(e) => updateBoat(bi, 'max_pax_day', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Max Overnight</label><input type="number" value={boat.max_pax_overnight || ''} onChange={(e) => updateBoat(bi, 'max_pax_overnight', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Каюты</label><input type="number" value={boat.cabins || ''} onChange={(e) => updateBoat(bi, 'cabins', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Туалеты</label><input type="number" value={boat.toilets || ''} onChange={(e) => updateBoat(bi, 'toilets', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Экипаж</label><input type="number" value={boat.crew_count || ''} onChange={(e) => updateBoat(bi, 'crew_count', Number(e.target.value))} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Пирс</label><input value={boat.default_pier} onChange={(e) => updateBoat(bi, 'default_pier', e.target.value)} style={inputStyle} /></div>
                        </div>
                      </div>

                      {/* Technical */}
                      <div style={{marginBottom: '20px'}}>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px'}}>Технические характеристики</h5>
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
                            <div key={fi} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: f.included ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                              <input type="checkbox" checked={f.included} onChange={(e) => toggleFeature(bi, 'included', fi, 'included', e.target.checked)} />
                              <span style={{fontSize: '13px', color: '#374151'}}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Paid Features */}
                      <div>
                        <h5 style={{fontSize: '14px', fontWeight: '600', color: '#7c3aed', marginBottom: '12px'}}>💰 Платные опции</h5>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px'}}>
                          {boat.features.paid.map((f, fi) => (
                            <div key={fi} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: f.paid ? '#f3e8ff' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                              <input type="checkbox" checked={f.paid} onChange={(e) => toggleFeature(bi, 'paid', fi, 'paid', e.target.checked)} />
                              <span style={{fontSize: '13px', flex: 1}}>{f.name}</span>
                              {f.paid && (
                                <>
                                  <input type="number" value={f.price || ''} onChange={(e) => toggleFeature(bi, 'paid', fi, 'price', Number(e.target.value))} placeholder="Цена" style={{width: '70px', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', color: '#1f2937'}} />
                                  <select value={f.pricePer} onChange={(e) => toggleFeature(bi, 'paid', fi, 'pricePer', e.target.value)} style={{padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', color: '#1f2937'}}>
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
                    <div key={ri} style={{border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px', backgroundColor: '#fafafa'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <span style={{fontWeight: '600'}}>Маршрут #{ri + 1}</span>
                        <button onClick={() => removeRoute(ri)} style={{color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer'}}>🗑️</button>
                      </div>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px'}}>
                        <div><label style={labelStyle}>Направление *</label><input value={route.destination} onChange={(e) => updateRoute(ri, 'destination', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Пирс отправления</label><input value={route.departure_pier} onChange={(e) => updateRoute(ri, 'departure_pier', e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Тип</label>
                          <select value={route.charter_type || 'overnight'} onChange={(e) => updateRoute(ri, 'charter_type', e.target.value)} style={inputStyle}>
                            <option value="full_day">Full Day</option>
                            <option value="half_day">Half Day</option>
                            <option value="overnight">Overnight</option>
                          </select>
                        </div>
                        <div><label style={labelStyle}>Сезон</label>
                          <select value={route.season} onChange={(e) => updateRoute(ri, 'season', e.target.value)} style={inputStyle}>
                            <option value="high">High (Nov-Apr)</option>
                            <option value="low">Low (May-Oct)</option>
                            <option value="peak">Peak (Dec21-Jan31)</option>
                            <option value="nov_dec">Nov - Dec 19</option>
                            <option value="dec_feb">Dec 20 - Feb</option>
                            <option value="mar_apr">Mar - Apr</option>
                            <option value="may_jun">May - Jun</option>
                            <option value="jul_aug">Jul - Aug</option>
                            <option value="sep_oct">Sep - Oct</option>
                          </select>
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
                    <div key={ei} style={{display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr 1fr 1fr auto', gap: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#fafafa', alignItems: 'end'}}>
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
              )}
            </div>

            {/* Actions */}
            <div style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
              <button onClick={() => setExtractedData(null)} style={{padding: '14px 28px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px'}}>← Назад</button>
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
  );
}
