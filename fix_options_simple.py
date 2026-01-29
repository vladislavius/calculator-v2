with open('app/page.tsx', 'r') as f:
    content = f.read()

# Simplify the query - remove join that causes 400
old1 = ".select('*, feature:feature_catalog(*)')"
new1 = ".select('*')"

if old1 in content:
    content = content.replace(old1, new1)
    print("Simplified boat_options query!")

with open('app/page.tsx', 'w') as f:
    f.write(content)
