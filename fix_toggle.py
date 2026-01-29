with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix toggleExtra function - change feature to option
old_func = """const toggleExtra = (option: BoatOption) => {
    const existing = selectedExtras.find(e => e.featureId === feature.option_id);

    if (existing) {
      setSelectedExtras(selectedExtras.filter(e => e.featureId !== feature.option_id));
    } else {
      setSelectedExtras([...selectedExtras, {
        featureId: feature.option_id,
        name: feature.option?.name_en || '',
        nameRu: feature.option?.name_ru || '',
        quantity: 1,
        price: feature.price || 0,
        priceUnit: feature.price_unit || 'per_trip',
        category: feature.option?.category || 'other'
      }]);
    }
  };"""

new_func = """const toggleExtra = (opt: BoatOption) => {
    const existing = selectedExtras.find(e => e.featureId === opt.option_id);

    if (existing) {
      setSelectedExtras(selectedExtras.filter(e => e.featureId !== opt.option_id));
    } else {
      setSelectedExtras([...selectedExtras, {
        featureId: opt.option_id,
        name: opt.option?.name_en || '',
        nameRu: opt.option?.name_ru || '',
        quantity: 1,
        price: Number(opt.price) || 0,
        priceUnit: opt.price_per || 'trip',
        category: String(opt.option?.category_id) || 'other'
      }]);
    }
  };"""

if old_func in content:
    content = content.replace(old_func, new_func)
    print("Fixed toggleExtra!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
