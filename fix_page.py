import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Update SearchResult interface - add agent prices
old_interface = '''interface SearchResult {
  boat_id: string;
  boat_name: string;
  boat_type: string;
  length_ft: number;
  max_guests: number;
  cabin_count: number;
  crew_count: number;
  description: string;
  main_photo_url: string;
  partner_name: string;
  partner_id: string;
  route_name: string;
  destination: string;
  duration_hours: number;
  base_price: number;
  extra_pax_price: number;
  fuel_surcharge: number;
  calculated_total: number;
  base_pax: number;
  marina_name: string;
}'''

new_interface = '''interface SearchResult {
  boat_id: string;
  boat_name: string;
  boat_type: string;
  length_ft: number;
  max_guests: number;
  cabin_count: number;
  crew_count: number;
  description: string;
  main_photo_url: string;
  partner_name: string;
  partner_id: string;
  route_name: string;
  destination: string;
  duration_hours: number;
  base_price: number;
  agent_price: number;
  client_price: number;
  extra_pax_price: number;
  fuel_surcharge: number;
  calculated_total: number;
  calculated_agent_total: number;
  base_pax: number;
  marina_name: string;
}'''

content = content.replace(old_interface, new_interface)

# 2. Update BoatOption interface
old_boat_option = '''interface BoatOption {
  id: string;
  option_name: string;
  option_category: string;
  status: 'included' | 'paid_optional';
  price_thb: number | null;
  price_unit: string | null;
  notes: string | null;
}'''

new_boat_option = '''interface BoatOption {
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
}'''

content = content.replace(old_boat_option, new_boat_option)

# 3. Update boatTypes to use objects
old_boat_types = "const boatTypes = ['Speedboat', 'Power Catamaran', 'Sailing Catamaran', 'Yacht', 'Motor Yacht'];"
new_boat_types = """const boatTypes = [
    {value: 'catamaran', label: 'Катамаран'},
    {value: 'sailing_catamaran', label: 'Парусный катамаран'},
    {value: 'speedboat', label: 'Спидбот'},
    {value: 'yacht', label: 'Яхта'}
  ];"""

content = content.replace(old_boat_types, new_boat_types)

# 4. Update boatTypes.map in select
old_map = '''{boatTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}'''
new_map = '''{boatTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}'''

content = content.replace(old_map, new_map)

# 5. Add showAgentPrice state after existing useState declarations
# Find a good insertion point after useState declarations
agent_state = '''
  // Agent view toggle and markup
  const [showAgentPrice, setShowAgentPrice] = useState(true);
  const [markupPercent, setMarkupPercent] = useState(0);
'''

# Insert after const [notes, setNotes] = useState('');
content = content.replace(
    "const [notes, setNotes] = useState('');",
    "const [notes, setNotes] = useState('');" + agent_state
)

# 6. Update boat_options query to use RPC
old_query = '''const { data, error } = await supabase
          .from('boat_options')
          .select('*')
          .eq('boat_id', boat.boat_id)
          .order('option_category', { ascending: true });'''

new_query = '''const { data, error } = await supabase
          .rpc('get_boat_options', { p_boat_id: parseInt(boat.boat_id) });'''

content = content.replace(old_query, new_query)

# 7. Update price_thb to price and price_unit to price_per
content = content.replace('option.price_thb', 'option.price')
content = content.replace('price_unit', 'price_per')

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done! All changes applied.")
