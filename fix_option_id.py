with open('app/page.tsx', 'r') as f:
    content = f.read()

# Change from option_id to id for unique selection
content = content.replace('e.featureId === option.option_id', 'e.featureId === option.id')
content = content.replace('e.featureId !== option.option_id', 'e.featureId !== option.id')
content = content.replace('featureId: option.option_id', 'featureId: option.id')
content = content.replace('e.featureId === feature.option_id', 'e.featureId === feature.id')
content = content.replace('e.featureId !== feature.option_id', 'e.featureId !== feature.id')
content = content.replace('featureId: feature.option_id', 'featureId: feature.id')
content = content.replace('updateExtraQuantity(feature.option_id', 'updateExtraQuantity(feature.id')

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Fixed option ID references!")
