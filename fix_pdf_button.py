with open('app/page.tsx', 'r') as f:
    content = f.read()

# Replace PDF button with working function
old_pdf_btn = '''<button style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                      📄 Скачать PDF
                    </button>'''

new_pdf_btn = '''<button 
                      onClick={async () => {
                        const pdfData = {
                          boatName: selectedBoat.boat_name,
                          boatType: selectedBoat.boat_type,
                          partnerName: selectedBoat.partner_name,
                          routeName: selectedBoat.route_name,
                          date: searchDate,
                          duration: timeSlots.find(t => t.value === timeSlot)?.label,
                          adults, children, infants,
                          occasion: specialOccasion,
                          basePrice: selectedBoat.base_price,
                          fuelSurcharge: selectedBoat.fuel_surcharge,
                          childrenDiscount: totals.childrenDiscount,
                          extras: totals.extras,
                          catering: totals.catering,
                          drinks: totals.drinks,
                          toys: totals.toys,
                          services: totals.services,
                          transfer: totals.transfer,
                          fees: totals.fees,
                          totalClient: totals.totalClient,
                          customerName, customerPhone, customerEmail,
                          includedOptions: boatOptions.filter(o => o.status === 'included').map(o => o.option_name)
                        };
                        const res = await fetch('/api/generate-pdf', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(pdfData)
                        });
                        const html = await res.text();
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(html);
                          printWindow.document.close();
                          setTimeout(() => printWindow.print(), 500);
                        }
                      }}
                      style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                      📄 Скачать PDF
                    </button>'''

content = content.replace(old_pdf_btn, new_pdf_btn)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("PDF button fixed!")
