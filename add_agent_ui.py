with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add Agent View toggle after the header, before the search section
old_section = '''<div className="text-right">
              <p className="text-sm text-blue-200">Менеджер системы</p>
              <p className="font-semibold">Профессиональный подбор</p>
            </div>'''

new_section = '''<div className="flex items-center gap-6">
              {/* Agent View Toggle */}
              <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAgentPrice}
                    onChange={(e) => setShowAgentPrice(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Agent View</span>
                </label>
                {showAgentPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">+</span>
                    <input
                      type="number"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-sm text-gray-800 border rounded"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs">%</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-200">Менеджер системы</p>
                <p className="font-semibold">Профессиональный подбор</p>
              </div>
            </div>'''

content = content.replace(old_section, new_section)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Agent UI toggle added!")
