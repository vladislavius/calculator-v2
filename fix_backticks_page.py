with open('app/page.tsx', 'r') as f:
    content = f.read()

# Fix escaped backticks
content = content.replace('\\`', '`')

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Fixed backticks!")
