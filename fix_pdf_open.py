with open('app/page.tsx', 'r') as f:
    content = f.read()

old_code = """if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${selectedBoat.name}-${startDate}.pdf`;
        a.click();
      }"""

new_code = """if (response.ok) {
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Fixed PDF to open in new window!")
else:
    print("Pattern not found")

with open('app/page.tsx', 'w') as f:
    f.write(content)
