with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix: Change RPC call to direct query (more reliable)
old_rpc = '''const { data, error } = await supabase.rpc('get_boat_options', {
        p_boat_id: boat.boat_id
      });'''

new_rpc = '''const { data, error } = await supabase
        .from('boat_options')
        .select(\`
          id,
          status,
          price,
          price_per,
          quantity_included,
          notes,
          options_catalog (
            name_en,
            name_ru,
            category_id,
            option_categories (
              name_en,
              code
            )
          )
        \`)
        .eq('boat_id', boat.boat_id)
        .eq('available', true);
      
      // Transform data to expected format
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        option_name: item.options_catalog?.name_en || 'Unknown',
        option_name_ru: item.options_catalog?.name_ru || '',
        option_category: item.options_catalog?.option_categories?.name_en || 'Other',
        category_code: item.options_catalog?.option_categories?.code || 'other',
        status: item.status,
        price: item.price,
        price_per: item.price_per,
        quantity_included: item.quantity_included,
        notes: item.notes
      }));
      
      if (error) throw error;
      setBoatOptions(transformed);
      return;'''

content = content.replace(old_rpc, new_rpc)

# Also fix the setBoatOptions line after
content = content.replace(
    '''if (error) throw error;
      setBoatOptions(data || []);''',
    '''// Already set above'''
)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Options loading fixed!")
