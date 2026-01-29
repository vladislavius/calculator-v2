with open('app/page.tsx', 'r') as f:
    lines = f.readlines()

# Find and remove lines 642-653 (Agent View block)
new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    # Start skipping at "Agent View" block
    if 'Agent View' in line and i > 600:
        # Find the start of this block (go back to find the div)
        skip_until = i + 8  # Skip about 8 lines for the block
        # Remove previous 5 lines (the opening div)
        new_lines = new_lines[:-5]
        continue
    
    if i <= skip_until:
        continue
        
    new_lines.append(line)

with open('app/page.tsx', 'w') as f:
    f.writelines(new_lines)

print(f"Removed Agent View block. New line count: {len(new_lines)}")
