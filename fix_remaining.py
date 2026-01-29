with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix remaining references
content = content.replace("BoatFeature", "BoatOption")
content = content.replace("// Load boat features", "// Load boat options")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Fixed remaining references!")
