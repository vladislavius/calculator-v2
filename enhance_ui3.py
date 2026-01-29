import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add transferPrice state if not exists
old_transfer_state = "const [transferType, setTransferType] = useState<'none' | 'standard' | 'minivan' | 'vip'>('none');"
new_transfer_state = """const [transferType, setTransferType] = useState<string>('none');
  const [transferPrice, setTransferPrice] = useState(0);
  const [transferMarkup, setTransferMarkup] = useState(15);"""

if old_transfer_state in content:
    content = content.replace(old_transfer_state, new_transfer_state)
    print("1. Added transfer state variables")

# 2. Update calculations to include boat markup and partner watersports
old_calc = """    const selectedTransfer = TRANSFER_OPTIONS.find(t => t.type === transferType);
    const transferTotal = selectedTransfer?.price || 0;"""

new_calc = """    // Transfer calculation (with markup if from DB)
    let transferTotal = 0;
    if (transferType.startsWith('db_')) {
      transferTotal = Math.round(transferPrice * (1 + transferMarkup / 100));
    } else {
      const selectedTransfer = TRANSFER_OPTIONS.find(t => t.type === transferType);
      transferTotal = selectedTransfer?.price || 0;
    }
    
    // Partner watersports calculation
    const partnerWatersportsTotal = selectedPartnerWatersports.reduce((sum, w) => {
      const base = (w.pricePerHour * w.hours) + (w.pricePerDay * w.days);
      return sum + Math.round(base * (1 + w.markup / 100));
    }, 0);"""

if old_calc in content:
    content = content.replace(old_calc, new_calc)
    print("2. Updated transfer calculation with markup")

# 3. Update totals calculation to include boat markup
old_totals = """    const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal;
    
    const agentTotal = agentPrice + allExtras;
    const clientTotal = clientPrice + allExtras;"""

new_totals = """    const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal + partnerWatersportsTotal;
    
    // Apply boat markup to base price
    const boatPriceWithMarkup = Math.round(agentPrice * (1 + boatMarkup / 100));
    
    const agentTotal = agentPrice + allExtras;
    const clientTotal = boatPriceWithMarkup + allExtras;"""

if old_totals in content:
    content = content.replace(old_totals, new_totals)
    print("3. Updated totals with boat markup")

# 4. Update return object to include new values
old_return = """      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      total: clientTotal"""

new_return = """      extras: extrasTotal,
      catering: cateringTotal,
      drinks: drinksTotal,
      toys: toysTotal,
      services: servicesTotal,
      transfer: transferTotal,
      fees: feesTotal,
      partnerWatersports: partnerWatersportsTotal,
      boatPriceWithMarkup: boatPriceWithMarkup,
      total: clientTotal"""

if old_return in content:
    content = content.replace(old_return, new_return)
    print("4. Updated return values")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nUI Part 3 done!")
