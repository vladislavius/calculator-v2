with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix: Change category filter to use category_id
# Category IDs: 3=drinks, 4=water_toys, 5=transfers, 6=services, 8=other

old_filter = """['equipment', 'water_toys', 'services', 'food', 'drinks', 'transfers'].map(category => {
                const categoryFeatures = options.filter(f =>
                  f.option?.category === category &&
                  (f.status === 'paid_optional' || f.status === 'available') &&
                  f.price && f.price > 0
                );

                if (categoryFeatures.length === 0) return null;

                const categoryNames: Record<string, string> = {
                  equipment: '🎣 Оборудование',
                  water_toys: '🏄 Водные игрушки',
                  services: '👨‍🍳 Сервисы',
                  food: '🍽 Питание',
                  drinks: '🍷 Напитки',
                  transfers: '🚗 Трансферы',
                };"""

new_filter = """[
                  { id: 4, name: '🏄 Водные игрушки' },
                  { id: 6, name: '👨‍🍳 Сервисы' },
                  { id: 3, name: '🍷 Напитки' },
                  { id: 5, name: '🚗 Трансферы' },
                  { id: 8, name: '🎉 Другое' },
                ].map(category => {
                const categoryOptions = options.filter(f =>
                  f.option?.category_id === category.id &&
                  (f.status === 'paid_optional' || f.status === 'available') &&
                  f.price && Number(f.price) > 0
                );

                if (categoryOptions.length === 0) return null;

                const categoryNames: Record<number, string> = {
                  4: '🏄 Водные игрушки',
                  6: '👨‍🍳 Сервисы',
                  3: '🍷 Напитки',
                  5: '🚗 Трансферы',
                  8: '🎉 Другое',
                };"""

if old_filter in content:
    content = content.replace(old_filter, new_filter)
    print("Fixed category filter!")
else:
    print("Pattern not found, trying simpler fix...")
    # Simpler replacement
    content = content.replace("f.option?.category === category", "f.option?.category_id === category.id")
    content = content.replace("f.price && f.price > 0", "f.price && Number(f.price) > 0")
    print("Applied simpler fixes")

# Also fix the categoryNames reference
content = content.replace("categoryNames[category]", "category.name")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
