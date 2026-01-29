with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Default markup 10%
content = content.replace(
    'const [markupPercent, setMarkupPercent] = useState(0);',
    'const [markupPercent, setMarkupPercent] = useState(10);'
)

# Fix 2: Apply markup to client total (not just extras)
old_calc = '''const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal;

    // Apply markup
    const markup = markupPercent > 0 ? Math.round(allExtras * markupPercent / 100) : 0;'''

new_calc = '''const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal;

    // Apply markup to everything (base + extras)
    const subtotalForMarkup = (baseClient - childrenDiscount) + allExtras;
    const markup = markupPercent > 0 ? Math.round(subtotalForMarkup * markupPercent / 100) : 0;'''

content = content.replace(old_calc, new_calc)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Markup fixed!")
