with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Default markup back to 0
content = content.replace(
    'const [markupPercent, setMarkupPercent] = useState(10);',
    'const [markupPercent, setMarkupPercent] = useState(0);'
)

# 2. Fix calculation - markup should apply to total and show in final price
old_return = '''return {
      agent: baseAgent,
      client: baseClient,
      childrenDiscount,
      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      markup,
      totalAgent: baseAgent + allExtras,
      totalClient: baseClient + allExtras + markup - childrenDiscount
    };'''

new_return = '''const totalBeforeMarkup = baseClient + allExtras - childrenDiscount;
    const markupAmount = markupPercent > 0 ? Math.round(totalBeforeMarkup * markupPercent / 100) : 0;
    
    return {
      agent: baseAgent,
      client: baseClient,
      childrenDiscount,
      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      markup: markupAmount,
      totalAgent: baseAgent + allExtras - childrenDiscount,
      totalClient: totalBeforeMarkup + markupAmount
    };'''

content = content.replace(old_return, new_return)

# Remove old markup calculation if exists
content = content.replace(
    '''// Apply markup to everything (base + extras)
    const subtotalForMarkup = (baseClient - childrenDiscount) + allExtras;
    const markup = markupPercent > 0 ? Math.round(subtotalForMarkup * markupPercent / 100) : 0;''',
    ''
)

content = content.replace(
    '''// Apply markup
    const markup = markupPercent > 0 ? Math.round(allExtras * markupPercent / 100) : 0;''',
    ''
)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Markup calculation fixed!")
