with open('app/import/page.tsx', 'r') as f:
    lines = f.readlines()

new_save_block = '''
      // 2. Smart boats upsert - find by name + partner
      const savedBoatIds: Record<string, number> = {};
      
      for (const boat of extractedData.boats) {
        console.log('Processing boat:', boat.name);
        
        // Find existing boat by name and partner
        const { data: existingBoats } = await supabase
          .from('boats')
          .select('*')
          .eq('partner_id', partnerId)
          .ilike('name', boat.name);
        
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
          const boatCode = extractedData.partner_name.substring(0, 3).toUpperCase() + '-' + boat.name.replace(/\\s/g, '').substring(0, 8);
          
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
              max_guests_day: boat.max_pax_day || 10,
              max_guests_overnight: boat.max_pax_overnight || 6,
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
            .or(\`name.ilike.%\${route.destination.split(' ')[0]}%,name_en.ilike.%\${route.destination.split(' ')[0]}%\`);
          
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
                duration_hours: route.duration_hours || 8
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
        
        // 4. Save boat options (features/extras)
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
        }
      }

      setSaveStatus('✅ Успешно! Партнёр, лодки, маршруты и сезонные цены сохранены.');
    } catch (error: any) {
'''

# Find start and end
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '// 2. Save boats' in line:
        start_idx = i
    if start_idx and '} catch (error: any)' in line:
        end_idx = i
        break

if start_idx and end_idx:
    new_lines = lines[:start_idx] + [new_save_block] + lines[end_idx+1:]
    with open('app/import/page.tsx', 'w') as f:
        f.writelines(new_lines)
    print(f"Replaced lines {start_idx+1} to {end_idx+1} with full seasonal import logic!")
else:
    print(f"Could not find block. start={start_idx}, end={end_idx}")

