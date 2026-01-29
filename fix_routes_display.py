with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Show Overnight for routes with duration_nights > 0
old_badge = "route.duration_nights > 0 ? 'Overnight' : 'Day Trip'"
if old_badge not in content:
    # The logic might be inverted or different
    old_check = "route.duration_nights > 0"
    if old_check in content:
        print("Duration check exists")

# Fix 2: Route display - check the route card
old_route_badge = """<div style={{ 
                      background: route.duration_nights > 0 ? '#8b5cf6' : '#10b981',"""

new_route_badge = """<div style={{ 
                      background: (route.duration_nights || 0) > 0 ? '#8b5cf6' : '#10b981',"""

if old_route_badge in content:
    content = content.replace(old_route_badge, new_route_badge)
    print("Fixed route badge background!")

# Fix route label
old_label = "route.duration_nights > 0 ? 'Overnight' : 'Day Trip'"
new_label = "(route.duration_nights || 0) > 0 ? 'Overnight' : 'Day Trip'"

if old_label in content:
    content = content.replace(old_label, new_label)
    print("Fixed route label!")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
