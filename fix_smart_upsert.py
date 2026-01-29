with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Find the partner save section and replace entirely
old_section = '''// 1. Save partner
      console.log('Looking for partner:', extractedData.partner_name);
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .ilike('name', '%' + extractedData.partner_name.split(' ')[0] + '%')
        .limit(1)
        .maybeSingle();
      console.log('Found partner:', partner, 'Error:', partnerError);

      let partnerId;

      if (partner) {
        // Partner exists - update it
        partnerId = partner.id;
        await supabase
          .from('partners')
          .update({
            contact_phone: extractedData.partner_phone,
            contact_email: extractedData.partner_email,
            commission_percent: extractedData.commission_percent,
            contract_valid_until: extractedData.contract_end,
            notes: `Website: ${extractedData.partner_website}\\nAddress: ${extractedData.partner_address}\\nPayment: ${extractedData.payment_terms}\\nCancellation: ${extractedData.cancellation_policy}`
          })
          .eq('id', partnerId);
      } else {
        // Create new partner
        console.log('Creating new partner:', extractedData.partner_name);
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,
            contact_phone: extractedData.partner_phone,
            contact_email: extractedData.partner_email,
            commission_percent: extractedData.commission_percent,
            contract_valid_until: extractedData.contract_end,
            notes: `Website: ${extractedData.partner_website}\\nAddress: ${extractedData.partner_address}\\nPayment: ${extractedData.payment_terms}\\nCancellation: ${extractedData.cancellation_policy}`
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        partnerId = newPartner.id;
      }'''

new_section = '''// 1. Smart partner upsert - find by partial name match
      const partnerFirstWord = extractedData.partner_name.split(' ')[0];
      console.log('Looking for partner containing:', partnerFirstWord);
      
      const { data: existingPartners } = await supabase
        .from('partners')
        .select('*')
        .ilike('name', '%' + partnerFirstWord + '%');
      
      console.log('Found partners:', existingPartners);
      
      let partnerId;
      
      if (existingPartners && existingPartners.length > 0) {
        // Partner exists - smart update (only update non-empty new values)
        const existing = existingPartners[0];
        partnerId = existing.id;
        console.log('Updating existing partner:', existing.name, 'ID:', partnerId);
        
        const updates: Record<string, unknown> = {};
        
        // Only update if new value exists and is different
        if (extractedData.partner_phone && extractedData.partner_phone !== existing.contact_phone) {
          updates.contact_phone = extractedData.partner_phone;
        }
        if (extractedData.partner_email && extractedData.partner_email !== existing.contact_email) {
          updates.contact_email = extractedData.partner_email;
        }
        if (extractedData.commission_percent && extractedData.commission_percent !== existing.commission_percent) {
          updates.commission_percent = extractedData.commission_percent;
        }
        if (extractedData.contract_end) {
          updates.contract_valid_until = extractedData.contract_end;
        }
        
        // Append to notes instead of replacing
        const newNotes = [
          extractedData.partner_website ? 'Website: ' + extractedData.partner_website : '',
          extractedData.partner_address ? 'Address: ' + extractedData.partner_address : '',
          extractedData.payment_terms ? 'Payment: ' + extractedData.payment_terms : '',
          extractedData.cancellation_policy ? 'Cancellation: ' + extractedData.cancellation_policy : ''
        ].filter(Boolean).join('\\n');
        
        if (newNotes) {
          updates.notes = existing.notes ? existing.notes + '\\n---\\n' + newNotes : newNotes;
        }
        
        if (Object.keys(updates).length > 0) {
          console.log('Applying updates:', updates);
          await supabase.from('partners').update(updates).eq('id', partnerId);
        }
      } else {
        // Create new partner
        console.log('Creating new partner:', extractedData.partner_name);
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,
            contact_phone: extractedData.partner_phone || null,
            contact_email: extractedData.partner_email || null,
            commission_percent: extractedData.commission_percent || 15,
            notes: [
              extractedData.partner_website ? 'Website: ' + extractedData.partner_website : '',
              extractedData.partner_address ? 'Address: ' + extractedData.partner_address : ''
            ].filter(Boolean).join('\\n') || null
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        partnerId = newPartner.id;
        console.log('Created partner ID:', partnerId);
      }'''

if old_section in content:
    content = content.replace(old_section, new_section)
    print("Applied smart upsert logic!")
else:
    print("Section not found, showing current code...")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
