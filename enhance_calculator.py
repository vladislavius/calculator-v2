import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add new state variables after existing ones (around line 190)
old_state = "const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);"
new_state = """const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);
  
  // New: Catering partners from DB
  const [cateringPartners, setCateringPartners] = useState<any[]>([]);
  const [cateringMenu, setCateringMenu] = useState<any[]>([]);
  
  // New: Watersports partners from DB  
  const [watersportsPartners, setWatersportsPartners] = useState<any[]>([]);
  const [watersportsCatalog, setWatersportsCatalog] = useState<any[]>([]);
  const [selectedPartnerWatersports, setSelectedPartnerWatersports] = useState<any[]>([]);
  
  // New: Transfer options from DB
  const [transferOptionsDB, setTransferOptionsDB] = useState<any[]>([]);
  
  // New: Boat markup slider
  const [boatMarkup, setBoatMarkup] = useState(15);"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("1. Added new state variables")

# 2. Add data loading in useEffect - find the loadBoats pattern
old_load = """const loadBoats = async () => {
      const { data } = await supabase
        .from('boats')
        .select('*')
        .order('name');"""

new_load = """const loadBoats = async () => {
      const { data } = await supabase
        .from('boats')
        .select('*')
        .order('name');
      
      // Load catering partners & menu
      const { data: cpData } = await supabase.from('catering_partners').select('*');
      if (cpData) setCateringPartners(cpData);
      const { data: cmData } = await supabase.from('catering_menu').select('*');
      if (cmData) setCateringMenu(cmData);
      
      // Load watersports partners & catalog
      const { data: wpData } = await supabase.from('watersports_partners').select('*');
      if (wpData) setWatersportsPartners(wpData);
      const { data: wcData } = await supabase.from('watersports_catalog').select('*');
      if (wcData) setWatersportsCatalog(wcData);
      
      // Load transfer options
      const { data: toData } = await supabase.from('transfer_options').select('*');
      if (toData) setTransferOptionsDB(toData);"""

if old_load in content:
    content = content.replace(old_load, new_load)
    print("2. Added data loading from DB")

# 3. Add function to update catering persons after removeCatering
old_remove_catering = """const removeCatering = (index: number) => {
    setCateringOrders(cateringOrders.filter((_, i) => i !== index));
  };"""

new_remove_catering = """const removeCatering = (index: number) => {
    setCateringOrders(cateringOrders.filter((_, i) => i !== index));
  };
  
  // Update catering persons count
  const updateCateringPersons = (index: number, persons: number) => {
    setCateringOrders(cateringOrders.map((order, i) => 
      i === index ? { ...order, persons: Math.max(order.minPersons || 1, persons) } : order
    ));
  };
  
  // Add catering from DB partner
  const addCateringFromDB = (item: any, partner: any) => {
    setCateringOrders([...cateringOrders, {
      packageId: `db_${item.id}`,
      packageName: `${item.name_en} (${partner.name})`,
      pricePerPerson: item.price_per_person,
      persons: Math.max(adults, item.min_persons),
      minPersons: item.min_persons,
      notes: ''
    }]);
  };
  
  // Add watersport from partner with markup
  const addPartnerWatersport = (item: any, partner: any) => {
    setSelectedPartnerWatersports([...selectedPartnerWatersports, {
      id: item.id,
      name: item.name_en,
      partnerName: partner.name,
      pricePerHour: item.price_per_hour || 0,
      pricePerDay: item.price_per_day || 0,
      hours: item.price_per_day ? 0 : 1,
      days: item.price_per_day ? 1 : 0,
      markup: 15
    }]);
  };
  
  const removePartnerWatersport = (id: number) => {
    setSelectedPartnerWatersports(selectedPartnerWatersports.filter(w => w.id !== id));
  };
  
  const updatePartnerWatersport = (id: number, field: string, value: number) => {
    setSelectedPartnerWatersports(selectedPartnerWatersports.map(w =>
      w.id === id ? { ...w, [field]: value } : w
    ));
  };"""

if old_remove_catering in content:
    content = content.replace(old_remove_catering, new_remove_catering)
    print("3. Added catering/watersports helper functions")

# 4. Update CateringOrder interface to include minPersons
old_interface = """interface CateringOrder {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  persons: number;
  notes: string;
}"""

new_interface = """interface CateringOrder {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  persons: number;
  minPersons?: number;
  notes: string;
}"""

if old_interface in content:
    content = content.replace(old_interface, new_interface)
    print("4. Updated CateringOrder interface")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nDone! Now need to update UI sections...")
