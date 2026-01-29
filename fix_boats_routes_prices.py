with open('app/import/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the "// 2. Save boats" section and replace everything after it until catch block
new_boats_routes = '''      // 2. Smart boats upsert - find by name + partner
      const savedBoatIds: Record<string, number> = {};
      
      for (const boat of extractedData.boats) {
        console.log('Processing boat:', boat.name);
        
        // Find existing boat by name and partner
        const { data: existingBoats } = await supabase
          .from('boats')
          .select('*')
          .eq('partner_id', partnerId)
          .ilike('name', '%' + boat.name.split(' ')[0] + '%');
        
        let boatId;
        
        if (existingBoats && existingBoats.length > 0) {
          // Update existing boat
          boatId = existingBoats[0].id;
          console.log('Updating existing boat:', existingBoats[0].name, 'ID:', boatId);
          
          await supabase.from('boats').update({
            boat_type: boat.type || existingBoats[0].boat_type,
            model: boat.model || existingBoats[0].model,
            length_ft: boat.length_ft || existingBoats[0].length_ft,
            year_built: boat.year_built || existingBoats[0].year_built,
            cabins: boat.cabins || existingBoats[0].cabins,
            max_guests_day: boat.max_pax_day || existingBoats[0].max_guests_day,
            max_guests_overnight: boat.max_pax_overnight || existingBoats[0].max_guests_overnight
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
              model: boat.model || null,
              length_ft: boat.length_ft || null,
              year_built: boat.year_built || null,
              cabins: boat.cabins || null,
              max_guests_day: boat.max_pax_day || 10,
              max_guests_overnight: boat.max_pax_overnight || 6
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
      }

      // 3. Smart routes and prices upsert with SEASONALITY
      for (const route of extractedData.routes) {
        console.log('Processing route:', route.destination);
        
        // Find or create route
        const { data: existingRoutes } = await supabase
          .from('routes')
          .select('id')
          .ilike('name', '%' + route.destination.split(' ')[0] + '%');
        
        let routeId;
        
        if (existingRoutes && existingRoutes.length > 0) {
          routeId = existingRoutes[0].id;
          console.log('Using existing route ID:', routeId);
        } else {
          // Create new route
          const { data: newRoute, error: routeError } = await supabase
            .from('routes')
            .insert({
              name: route.destination,
              description: route.destination + ' trip',
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

        // 4. SEASONAL PRICES - key logic
        // For each boat, create/update price for this route + season
        for (const [boatName, boatId] of Object.entries(savedBoatIds)) {
          const season = route.season || 'high';
          const today = new Date().toISOString().split('T')[0];
          
          console.log('Processing price for boat:', boatName, 'route:', route.destination, 'season:', season);
          
          // Find existing price for this boat + route + season
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
            // Close old price and create new one (version history)
            const oldPrice = existingPrices[0];
            console.log('Closing old price ID:', oldPrice.id, 'Creating new version');
            
            // Close old price
            await supabase
              .from('route_prices')
              .update({ valid_to: today })
              .eq('id', oldPrice.id);
            
            // Create new price version
            await supabase
              .from('route_prices')
              .insert({
                boat_id: boatId,
                route_id: routeId,
                season: season,
                time_slot: route.time_slot || 'full_day',
                base_price: route.base_price || oldPrice.base_price,
                agent_price: route.agent_price || route.base_price || oldPrice.agent_price,
                client_price: route.base_price || oldPrice.client_price,
                fuel_surcharge: route.fuel_surcharge || oldPrice.fuel_surcharge || 0,
                extra_pax_price: oldPrice.extra_pax_price || 2000,
                base_pax: oldPrice.base_pax || 2,
                valid_from: today,
                valid_to: '2027-12-31'
              });
            
            console.log('Created new price version');
            
          } else {
            // Create new price
            console.log('Creating new price for boat:', boatId, 'route:', routeId);
            
            await supabase
              .from('route_prices')
              .insert({
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
            
            console.log('Created new price');
          }
        }
      }

      // 5. Save boat options (extras) if any
      if (extractedData.extras && extractedData.extras.length > 0) {
        for (const [boatName, boatId] of Object.entries(savedBoatIds)) {
          for (const extra of extractedData.extras) {
            // Check if option exists
            const { data: existingOption } = await supabase
              .from('boat_options')
              .select('id')
              .eq('boat_id', boatId)
              .ilike('option_name', '%' + extra.name.split(' ')[0] + '%')
              .maybeSingle();
            
            if (existingOption) {
              // Update price
              await supabase
                .from('boat_options')
                .update({
                  price: extra.price || 0,
                  status: extra.included ? 'included' : 'paid_optional'
                })
                .eq('id', existingOption.id);
            } else {
              // Create new option
              await supabase
                .from('boat_options')
                .insert({
                  boat_id: boatId,
                  option_name: extra.name,
                  option_name_ru: extra.name,
                  option_category: extra.category || 'extras',
                  status: extra.included ? 'included' : 'paid_optional',
                  price: extra.price || 0,
                  price_per: extra.per || 'per trip'
                });
            }
          }
        }
        console.log('Saved boat options');
      }

      setSaveStatus('✅ Успешно сохранено! Партнёр, лодки, маршруты и цены обновлены.');
      
    } catch (err) {
'''

# Find the start of boats section
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '// 2. Save boats' in line or '// 2. Smart boats' in line:
        start_idx = i
    if start_idx and '} catch (err)' in line:
        end_idx = i
        break

if start_idx and end_idx:
    new_lines = lines[:start_idx] + [new_boats_routes] + lines[end_idx+1:]
    with open('app/import/page.tsx', 'w') as f:
        f.writelines(new_lines)
    print(f"Replaced lines {start_idx+1} to {end_idx+1} with full import logic!")
else:
    print(f"Could not find block. start={start_idx}, end={end_idx}")

