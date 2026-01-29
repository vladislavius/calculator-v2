with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix - remove partners join that causes 400 error
old1 = ".select('*, partners(company_name)')"
new1 = ".select('*')"

if old1 in content:
    content = content.replace(old1, new1)
    print("Fixed partners join!")

# Also fix the mapping
old2 = """partner_name: b.partners?.company_name"""
new2 = """partner_name: 'Partner'"""

if old2 in content:
    content = content.replace(old2, new2)
    print("Fixed partner_name mapping!")

with open('app/page.tsx', 'w') as f:
    f.write(content)
    
print("Done!")
