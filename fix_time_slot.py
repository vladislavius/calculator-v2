with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Change select to use charter_type instead of time_slot
old_select = "value={route.time_slot} onChange={(e) => updateRoute(ri, 'time_slot', e.target.value)}"
new_select = "value={route.charter_type || 'overnight'} onChange={(e) => updateRoute(ri, 'charter_type', e.target.value)}"

if old_select in content:
    content = content.replace(old_select, new_select)
    print("Fixed select to use charter_type!")
else:
    print("Select pattern not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
