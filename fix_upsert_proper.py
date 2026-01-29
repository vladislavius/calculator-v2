with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Replace the entire partner save logic with proper upsert
old_logic = '''console.log('Looking for partner:', extractedData.partner_name);
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('name', extractedData.partner_name)
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

new_logic = '''// Find or create partner using ilike for case-insensitive match
      console.log('Looking for partner:', extractedData.partner_name);
      
      let partnerId;
      
      // Try to find existing partner
      const { data: existingPartners } = await supabase
        .from('partners')
        .select('id, name')
        .ilike('name', extractedData.partner_name);
      
      console.log('Found partners:', existingPartners);
      
      if (existingPartners && existingPartners.length > 0) {
        // Use existing partner
        partnerId = existingPartners[0].id;
        console.log('Using existing partner ID:', partnerId);
        
        // Update partner info
        await supabase
          .from('partners')
          .update({
            contact_phone: extractedData.partner_phone || null,
            contact_email: extractedData.partner_email || null,
            commission_percent: extractedData.commission_percent || 15,
            notes: `Website: ${extractedData.partner_website || ''}\\nAddress: ${extractedData.partner_address || ''}`
          })
          .eq('id', partnerId);
      } else {
        // Create new partner - let DB generate ID
        console.log('Creating new partner');
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,
            contact_phone: extractedData.partner_phone || null,
            contact_email: extractedData.partner_email || null,
            commission_percent: extractedData.commission_percent || 15,
            notes: `Website: ${extractedData.partner_website || ''}\\nAddress: ${extractedData.partner_address || ''}`
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        partnerId = newPartner.id;
        console.log('Created new partner ID:', partnerId);
      }'''

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    print("Fixed partner save logic!")
else:
    print("Pattern not found - checking what we have...")
    # Try to find the section
    if 'Looking for partner' in content:
        print("Found 'Looking for partner' in code")
    if 'maybeSingle' in content:
        print("Found 'maybeSingle' in code")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
