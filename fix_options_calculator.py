with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Change table name
content = content.replace("from('boat_options')", "from('boat_options')")  # already correct

# Fix 2: Change the select to join with options_catalog
old_select = ".from('boat_options')\n      .select('*')\n      .eq('boat_id', boatId)"
new_select = """.from('boat_options')
      .select('*, option:options_catalog(*)')
      .eq('boat_id', boatId)
      .eq('available', true)"""

if old_select in content:
    content = content.replace(old_select, new_select)
    print("Fixed boat_options select!")
else:
    # Try alternative pattern
    if ".from('boat_options')" in content and ".select('*')" in content:
        content = content.replace(
            ".select('*')\n      .eq('boat_id', boatId);",
            ".select('*, option:options_catalog(*)')\n      .eq('boat_id', boatId)\n      .eq('available', true);"
        )
        print("Fixed with alternative pattern!")

# Fix 3: Update the interface and mapping for features -> options
content = content.replace("interface BoatFeature", "interface BoatOption")
content = content.replace("BoatFeature[]", "BoatOption[]")
content = content.replace("feature_id", "option_id")
content = content.replace("feature?.", "option?.")
content = content.replace("feature:", "option:")
content = content.replace("setFeatures", "setOptions")
content = content.replace("features.filter", "options.filter")
content = content.replace("features.", "options.")
content = content.replace("[features,", "[options,")
content = content.replace("features]", "options]")

# Fix status check - change 'available' to 'paid_optional' for extras
old_status = "f.status === 'available'"
new_status = "(f.status === 'paid_optional' || f.status === 'available')"
content = content.replace(old_status, new_status)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done!")
