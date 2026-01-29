with open('app/import/page.tsx', 'r') as f:
    content = f.read()

# Remove the duplicate declaration
content = content.replace('''      const partnerError = null;

      if (partnerError) throw partnerError;

      // 2. Save boats''', '''      // 2. Save boats''')

with open('app/import/page.tsx', 'w') as f:
    f.write(content)

print("Fixed duplicate partnerError!")
