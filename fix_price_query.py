with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix the query to check valid_to >= today instead of IS NULL
old1 = ".is('valid_to', null)"
new1 = ".gte('valid_to', new Date().toISOString().split('T')[0])"

if old1 in content:
    content = content.replace(old1, new1)
    print("Fixed valid_to check!")
else:
    print("Pattern not found, checking alternative...")
    if "valid_to" in content:
        print("valid_to found in file")

with open('app/page.tsx', 'w') as f:
    f.write(content)
