with open('app/page.tsx', 'r') as f:
    content = f.read()

# Replace the options loading query to support both direct fields and catalog
old_query = '''const { data, error } = await supabase
        .from('boat_options')
        .select(`
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
        `)
        .eq('boat_id', boat.boat_id)
        .eq('available', true);'''

new_query = '''const { data, error } = await supabase
        .from('boat_options')
        .select('*')
        .eq('boat_id', boat.boat_id);'''

content = content.replace(old_query, new_query)

# Also fix the transformation to use direct fields
old_transform = '''// Transform data to expected format
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
      }));'''

new_transform = '''// Transform data to expected format - support both direct fields and catalog
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        option_name: item.option_name || item.options_catalog?.name_en || 'Unknown',
        option_name_ru: item.option_name_ru || item.options_catalog?.name_ru || '',
        option_category: item.option_category || item.options_catalog?.option_categories?.name_en || 'Other',
        category_code: item.category_code || item.options_catalog?.option_categories?.code || 'other',
        status: item.status || 'paid_optional',
        price: item.price || 0,
        price_per: item.price_per || 'per day',
        quantity_included: item.quantity_included || 0,
        notes: item.notes || ''
      }));
      
      console.log('Loaded boat options:', transformed);'''

content = content.replace(old_transform, new_transform)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Fixed options loading!")
