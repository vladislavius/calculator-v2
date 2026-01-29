# This will update the import page to handle pricing_rules
with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Find the saveToDatabase function and add pricing rules saving
old_success = "setSaveStatus('✅ Успешно! Партнёр, лодки, маршруты и сезонные цены сохранены.');"

new_success = '''// 5. Save pricing rules (complex pricing with seasons/guests/duration)
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
      
      setSaveStatus('✅ Успешно! Партнёр, лодки, ценовые правила (' + (extractedData.pricing_rules?.length || 0) + ' вариантов) и опции сохранены.');'''

if old_success in content:
    content = content.replace(old_success, new_success)
    print("Updated import with pricing rules!")
else:
    print("Pattern not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
