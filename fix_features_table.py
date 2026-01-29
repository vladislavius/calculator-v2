with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix table name - should be boat_options not boat_features
old1 = ".from('boat_features')"
new1 = ".from('boat_options')"

if old1 in content:
    content = content.replace(old1, new1)
    print("Fixed boat_features -> boat_options!")

# Fix the join - features -> feature_catalog
old2 = ".select('*, feature:features(*)')"
new2 = ".select('*, feature:feature_catalog(*)')"

if old2 in content:
    content = content.replace(old2, new2)
    print("Fixed features -> feature_catalog!")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
