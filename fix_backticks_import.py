with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix the escaped backticks
content = content.replace(
    ".or(\\`name.ilike.%\\${route.destination.split(' ')[0]}%,name_en.ilike.%\\${route.destination.split(' ')[0]}%\\`);",
    ".ilike('name', '%' + route.destination.split(' ')[0] + '%');"
)

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Fixed backticks!")
