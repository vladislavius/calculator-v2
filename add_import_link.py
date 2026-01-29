with open('app/page.tsx', 'r') as f:
    content = f.read()

# Find the Agent View section and add Import button before it
old_text = '''{/* Agent View Toggle */}'''

new_text = '''{/* Import Contract Button */}
              <a
                href="/import"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                📄 Import Contract
              </a>
              
              {/* Agent View Toggle */}'''

content = content.replace(old_text, new_text)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Import link added!")
