with open('app/page.tsx', 'r') as f:
    content = f.read()

# Remove CATERING_PACKAGES mock data
old_catering = """const CATERING_PACKAGES = [
  { id: 'thai_basic', name: 'Thai Basic', nameRu: 'Тайский базовый', price: 600, minPersons: 4, items: ['Pad Thai', 'Fried Rice', 'Spring Rolls', 'Fresh Fruits'] },
  { id: 'thai_premium', name: 'Thai Premium', nameRu: 'Тайский премиум', price: 900, minPersons: 4, items: ['Tom Yum', 'Green Curry', 'Grilled Fish', 'Mango Sticky Rice'] },
  { id: 'seafood_bbq', name: 'Seafood BBQ', nameRu: 'BBQ из морепродуктов', price: 1500, minPersons: 6, items: ['Lobster', 'Prawns', 'Fish', 'Squid', 'Salads'] },
  { id: 'western', name: 'Western Style', nameRu: 'Западный', price: 1200, minPersons: 4, items: ['Steak', 'Burgers', 'Salads', 'Desserts'] },
  { id: 'vegan', name: 'Vegan Healthy', nameRu: 'Веган', price: 800, minPersons: 2, items: ['Tofu', 'Vegetables', 'Rice', 'Fruits'] },
  { id: 'kids', name: 'Kids Menu', nameRu: 'Детское меню', price: 500, minPersons: 2, items: ['Chicken Nuggets', 'Fries', 'Fruits', 'Ice Cream'] },
];"""

new_catering = "// CATERING_PACKAGES moved to database (catering_menu table)"

if old_catering in content:
    content = content.replace(old_catering, new_catering)
    print("1. Removed CATERING_PACKAGES mock data")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
