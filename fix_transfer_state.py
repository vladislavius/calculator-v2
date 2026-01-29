with open('app/page.tsx', 'r') as f:
    content = f.read()

old_transfer = """  const [transferDropoff, setTransferDropoff] = useState<TransferOrder>({
    type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: ''
  });"""

new_transfer = """  const [transferDropoff, setTransferDropoff] = useState<TransferOrder>({
    type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: ''
  });
  const [transferPrice, setTransferPrice] = useState(0);
  const [transferMarkup, setTransferMarkup] = useState(15);"""

if old_transfer in content:
    content = content.replace(old_transfer, new_transfer)
    print("Added transferPrice and transferMarkup state!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
