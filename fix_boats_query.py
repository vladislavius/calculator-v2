with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix the boats query - remove status filter or fix it
old_query = """.from('boats')
      .select('*, partners(company_name)')
      .eq('status', 'active')
      .order('name');"""

new_query = """.from('boats')
      .select('*, partners(company_name)')
      .order('name');"""

if old_query in content:
    content = content.replace(old_query, new_query)
    print("Fixed boats query!")
else:
    # Try alternative
    if ".eq('status', 'active')" in content:
        content = content.replace(".eq('status', 'active')", "")
        print("Removed status filter!")
    else:
        print("Query pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
