with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Add debug logging before partner operations
old_code = '''const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('name', extractedData.partner_name)
        .maybeSingle();'''

new_code = '''console.log('Looking for partner:', extractedData.partner_name);
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('name', extractedData.partner_name)
        .maybeSingle();
      console.log('Found partner:', partner, 'Error:', partnerError);'''

content = content.replace(old_code, new_code)

# Also add logging before insert
old_insert = '''// Create new partner
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,'''

new_insert = '''// Create new partner
        console.log('Creating new partner:', extractedData.partner_name);
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            name: extractedData.partner_name,'''

content = content.replace(old_insert, new_insert)

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Added debug logging!")
