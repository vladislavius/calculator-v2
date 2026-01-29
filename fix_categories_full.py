with open('app/page.tsx', 'r') as f:
    content = f.read()

old_code = """['equipment', 'water_toys', 'services', 'food', 'drinks', 'transfers'].map(category => {
                const categoryFeatures = options.filter(f =>
                  f.option?.category_id === category.id &&
                  (f.status === 'paid_optional' || f.status === 'available') &&
                  f.price && Number(f.price) > 0
                );

                if (categoryFeatures.length === 0) return null;

                const categoryNames: Record<string, string> = {
                  equipment: '🎣 Оборудование',
                  water_toys: '🏄 Водные игрушки',
                  services: '👨‍🍳 Сервисы',
                  food: '🍽 Питание',
                  drinks: '🍷 Напитки',
                  transfers: '🚗 Трансферы',
                };

                return (
                  <div key={category} style={{ marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'rgba(255,255,255,0.8)' }}>
                      {category.name || category}
                    </h3>"""

new_code = """[
                  { id: 4, name: '🏄 Водные игрушки' },
                  { id: 6, name: '👨‍🍳 Сервисы' },
                  { id: 3, name: '🍷 Напитки' },
                  { id: 5, name: '🚗 Трансферы' },
                  { id: 8, name: '🎉 Другое' },
                ].map(category => {
                const categoryFeatures = options.filter(f =>
                  f.option?.category_id === category.id &&
                  (f.status === 'paid_optional' || f.status === 'available') &&
                  f.price && Number(f.price) > 0
                );

                if (categoryFeatures.length === 0) return null;

                return (
                  <div key={category.id} style={{ marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'rgba(255,255,255,0.8)' }}>
                      {category.name}
                    </h3>"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Fixed categories!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
