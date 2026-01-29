import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add new state variables for partner watersports total in calculations
old_transfer_calc = """    // Transfer
    const transferTotal = transferPickup.price + transferDropoff.price;"""

new_transfer_calc = """    // Transfer (include DB transfer with markup)
    let transferTotal = transferPickup.price + transferDropoff.price;
    if (transferPrice > 0) {
      transferTotal += Math.round(transferPrice * (1 + transferMarkup / 100));
    }
    
    // Partner watersports (with individual markup)
    const partnerWatersportsTotal = selectedPartnerWatersports.reduce((sum, w) => {
      const base = (w.pricePerHour * w.hours) + (w.pricePerDay * w.days);
      return sum + Math.round(base * (1 + w.markup / 100));
    }, 0);"""

if old_transfer_calc in content:
    content = content.replace(old_transfer_calc, new_transfer_calc)
    print("1. Updated transfer calculation")

# 2. Update allExtras to include partnerWatersportsTotal
old_all_extras = "const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal;"
new_all_extras = "const allExtras = extrasTotal + cateringTotal + drinksTotal + toysTotal + servicesTotal + transferTotal + feesTotal + partnerWatersportsTotal;"

if old_all_extras in content:
    content = content.replace(old_all_extras, new_all_extras)
    print("2. Updated allExtras calculation")

# 3. Update totals calculation to apply boat markup
old_before_markup = "const totalBeforeMarkup = baseClient + allExtras - childrenDiscount;"
new_before_markup = """// Apply boat markup to base price for client
    const boatPriceWithMarkup = Math.round(baseClient * (1 + boatMarkup / 100));
    const totalBeforeMarkup = boatPriceWithMarkup + allExtras - childrenDiscount;"""

if old_before_markup in content:
    content = content.replace(old_before_markup, new_before_markup)
    print("3. Updated totalBeforeMarkup with boat markup")

# 4. Find and update the return statement to include new values
# Let's look for the return statement pattern
old_return_pattern = r"return \{\s*agent: \d+,\s*client: \d+,"
# We need to find the actual return in calculate totals

# Find the section and add partnerWatersports to return
old_return = """      transfer: transferTotal,
      fees: feesTotal,
      total: finalTotal,"""

new_return = """      transfer: transferTotal,
      fees: feesTotal,
      partnerWatersports: partnerWatersportsTotal,
      boatPriceWithMarkup: boatPriceWithMarkup,
      total: finalTotal,"""

if old_return in content:
    content = content.replace(old_return, new_return)
    print("4. Updated return values")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("\nUI Part 3 fixed done!")
