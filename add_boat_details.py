with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add state for boat details modal
old_state = "const [generatingPdf, setGeneratingPdf] = useState(false);"
new_state = """const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showBoatDetails, setShowBoatDetails] = useState(false);
  const [includedOptions, setIncludedOptions] = useState<any[]>([]);"""

content = content.replace(old_state, new_state)

# Add function to load included options
old_load = "const loadRoutes = async (boatId: number) => {"
new_load = """const loadIncludedOptions = async (boatId: number) => {
    const { data } = await supabase
      .from('boat_options')
      .select('*, option:options_catalog(*)')
      .eq('boat_id', boatId)
      .eq('status', 'included');
    
    if (data) {
      setIncludedOptions(data);
    }
  };

  const loadRoutes = async (boatId: number) => {"""

content = content.replace(old_load, new_load)

# Call loadIncludedOptions when selecting boat
old_select = """setSelectedBoat(boat);
    setSelectedRoute(null);
    setSelectedPrice(null);
    setPrices([]);
    loadRoutes(boat.id);
    setStep(2);"""

new_select = """setSelectedBoat(boat);
    setSelectedRoute(null);
    setSelectedPrice(null);
    setPrices([]);
    loadRoutes(boat.id);
    loadIncludedOptions(boat.id);
    setStep(2);"""

content = content.replace(old_select, new_select)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Added boat details loading!")
