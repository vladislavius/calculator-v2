with open('app/page.tsx', 'r') as f:
    content = f.read()

# Find handleSearch and add useEffect before it
old_handle_search = "  const handleSearch = async () => {"

new_code_before_search = """  // Load partners data on mount
  useEffect(() => {
    const loadPartnersData = async () => {
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
      if (toData) setTransferOptionsDB(toData);
    };
    
    loadPartnersData();
  }, []);

  const handleSearch = async () => {"""

if old_handle_search in content:
    content = content.replace(old_handle_search, new_code_before_search)
    print("Added useEffect for loading partners data!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
