with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Find and replace the boat options saving section
old_options = '''// 4. Save boat options (features/extras)
        if (boat.features) {
          const allFeatures = [...(boat.features.included || []), ...(boat.features.paid || [])];
          for (const feature of allFeatures) {
            if (!feature.name) continue;
            
            const { data: existingOpt } = await supabase
              .from('boat_options')
              .select('id')
              .eq('boat_id', boatId)
              .ilike('option_name', feature.name)
              .maybeSingle();
            
            if (existingOpt) {
              await supabase.from('boat_options').update({
                price: feature.price || 0,
                status: feature.included ? 'included' : 'paid_optional'
              }).eq('id', existingOpt.id);
            } else {
              await supabase.from('boat_options').insert({
                boat_id: boatId,
                option_name: feature.name,
                option_name_ru: feature.name,
                option_category: 'extras',
                status: feature.included ? 'included' : 'paid_optional',
                price: feature.price || 0,
                price_per: feature.pricePer || 'per trip'
              });
            }
          }
        }'''

new_options = '''// 4. Save boat options - find in options_catalog first
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
                  code: feature.name.toLowerCase().replace(/\\s+/g, '_').substring(0, 30),
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
        }'''

if old_options in content:
    content = content.replace(old_options, new_options)
    print("Fixed import options logic!")
else:
    print("Old pattern not found, checking current code...")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
