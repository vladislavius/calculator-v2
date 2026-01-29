with open('app/page.tsx', 'r') as f:
    content = f.read()

# Remove escaped backticks
content = content.replace('\\`', '`')

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Backticks fixed!")
