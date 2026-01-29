with open('app/import/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with "// 1. Save partner" and replace the block
new_block = '''      // 1. Smart partner upsert - find by partial name match
      const partnerFirstWord = extractedData.partner_name.split(' ')[0];
      console.log('Looking for partner containing:', partnerFirstWord);
      
      const { data: existingPartners } = await supabase
        .from('partners')
        .select('*')
        .ilike('name', '%' + partnerFirstWord + '%');
      
      console.log('Found partners:', existingPartners);
      
      let partnerId;
      
      if (existingPartners && existingPartners.length > 0) {
        // Partner exists - update with new data
        const existing = existingPartners[0];
        partnerId = existing.id;
        console.log('Updating existing partner:', existing.name, 'ID:', partnerId);
        
        await supabase.from('partners').update({
          contact_phone: extractedData.partner_phone || existing.contact_phone,
          contact_email: extractedData.partner_email || existing.contact_email,
          commission_percent: extractedData.commission_percent || existing.commission_percent || 15,
          contract_valid_until: extractedData.contract_end || existing.contract_valid_until,
          notes: extractedData.partner_website || extractedData.partner_address 
            ? (existing.notes || '') + '\\n---\\nUpdated: ' + new Date().toISOString().split('T')[0] + '\\nWebsite: ' + (extractedData.partner_website || '') + '\\nAddress: ' + (extractedData.partner_address || '')
            : existing.notes
        }).eq('id', partnerId);
        
      } else {
        // Create new partner
        console.log('Creating new partner:', extractedData.partner_name);
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,
            contact_phone: extractedData.partner_phone || null,
            contact_email: extractedData.partner_email || null,
            commission_percent: extractedData.commission_percent || 15
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        partnerId = newPartner.id;
        console.log('Created partner ID:', partnerId);
      }

'''

# Find start and end of the block to replace
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '// 1. Save partner' in line or '// 1. Smart partner' in line:
        start_idx = i
    if start_idx and '// 2. Save boats' in line:
        end_idx = i
        break

if start_idx and end_idx:
    # Replace the block
    new_lines = lines[:start_idx] + [new_block] + lines[end_idx:]
    with open('app/import/page.tsx', 'w') as f:
        f.writelines(new_lines)
    print(f"Replaced lines {start_idx+1} to {end_idx+1} with smart upsert!")
else:
    print(f"Could not find block. start={start_idx}, end={end_idx}")

