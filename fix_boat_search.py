with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Fix boat search to be more flexible
old_search = '''.ilike('name', boat.name);'''

new_search = '''.or(\`name.ilike.%\${boat.name.split(' ').pop()}%,name.ilike.%\${boat.name}%\`);'''

# Actually let's use simpler approach - search by last word (usually boat name)
content = content.replace(
    ".ilike('name', boat.name);",
    ".ilike('name', '%' + boat.name.split(' ').pop() + '%');"
)

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Fixed boat search!")
