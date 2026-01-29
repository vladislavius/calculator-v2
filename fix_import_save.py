with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Replace upsert with select + insert logic
old_upsert = '''.upsert({
          name: extractedData.partner_name,
          contact_phone: extractedData.partner_phone,
          contact_email: extractedData.partner_email,
          commission_percent: extractedData.commission_percent,
          contract_valid_until: extractedData.contract_end,
          notes: `Website: ${extractedData.partner_website}\\nAddress: ${extractedData.partner_address}\\nPayment: ${extractedData.payment_terms}\\nCancellation: ${extractedData.cancellation_policy}`
        }, { onConflict: 'name' })
        .select('id')
        .single();'''

new_logic = '''.select('id')
        .eq('name', extractedData.partner_name)
        .maybeSingle();

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
      }
      
      const partnerError = null;'''

content = content.replace(old_upsert, new_logic)

# Also remove the partnerId reassignment
content = content.replace('if (partnerError) throw partnerError;\n      const partnerId = partner.id;', 
                          'if (partnerError) throw partnerError;')

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Fixed import save logic!")
