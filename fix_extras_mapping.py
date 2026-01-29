with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix the mapping - AI returns optional_extras, UI expects extras
old_mapping = "extras: aiData.extras?.map((e: any) => ({"
new_mapping = "extras: (aiData.optional_extras || aiData.extras || []).map((e: any) => ({"

if old_mapping in content:
    content = content.replace(old_mapping, new_mapping)
    print("Fixed extras mapping!")
else:
    print("Pattern not found, checking alternative...")
    # Try to find and show context
    if "aiData.extras" in content:
        print("Found aiData.extras - needs manual fix")
    else:
        print("aiData.extras not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
