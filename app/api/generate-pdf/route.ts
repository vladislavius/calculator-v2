import { NextRequest, NextResponse } from 'next/server';

function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const { quote, client, notes } = await request.json();

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote - ${escapeHtml(quote.boat?.name || 'Yacht Charter')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1e3a5f; }
    .quote-date { text-align: right; color: #666; }
    .hero { background: #1e3a5f; color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .hero h1 { font-size: 28px; margin-bottom: 10px; }
    .hero-details { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
    .hero-detail { background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 8px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; color: #3b82f6; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f8f8; font-size: 12px; color: #666; }
    .price { text-align: right; font-weight: bold; }
    .total-box { background: #1e3a5f; color: white; padding: 20px 30px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 30px; }
    .total-amount { font-size: 32px; font-weight: bold; }
    .terms { background: #f8f8f8; padding: 20px; border-radius: 8px; margin-top: 30px; font-size: 12px; color: #666; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Phuket Yacht Charter</div>
    <div class="quote-date">Quote Date: ${new Date().toLocaleDateString()}</div>
  </div>
  
  <div class="hero">
    <h1>${escapeHtml(quote.boat?.name || 'Yacht Charter')}</h1>
    <div>${escapeHtml(quote.boat?.model || '')}</div>
    <div class="hero-details">
      <div class="hero-detail"><strong>Route:</strong> ${escapeHtml(quote.route?.name || quote.route?.destination || '-')}</div>
      <div class="hero-detail"><strong>Duration:</strong> ${quote.nights > 0 ? (Number(quote.nights) + 1) + 'D/' + Number(quote.nights) + 'N' : 'Day Trip'}</div>
      <div class="hero-detail"><strong>Guests:</strong> ${escapeHtml(quote.guests)}</div>
      <div class="hero-detail"><strong>Date:</strong> ${escapeHtml(quote.startDate || 'TBD')}</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Price Breakdown</div>
    <table>
      <tr><th>Description</th><th class="price">Amount (THB)</th></tr>
      <tr><td>Charter Base Price (${escapeHtml(quote.season)} season)</td><td class="price">${Number(quote.basePrice).toLocaleString()}</td></tr>
      ${quote.extras?.map((e: any) => '<tr><td>' + escapeHtml(e.name) + ' x' + Number(e.quantity) + '</td><td class="price">' + (Number(e.price) * Number(e.quantity)).toLocaleString() + '</td></tr>').join('') || ''}
      <tr><td><strong>Subtotal</strong></td><td class="price"><strong>${Number(quote.subtotal).toLocaleString()}</strong></td></tr>
      ${quote.markupAmount > 0 ? '<tr><td>Service Fee (' + Number(quote.markup) + '%)</td><td class="price">' + Number(quote.markupAmount).toLocaleString() + '</td></tr>' : ''}
    </table>
  </div>
  
  <div class="total-box">
    <div>TOTAL</div>
    <div class="total-amount">THB ${Number(quote.total).toLocaleString()}</div>
  </div>
  
  ${client?.name ? '<div class="section" style="margin-top:30px;"><div class="section-title">Client</div><p><strong>' + escapeHtml(client.name) + '</strong><br>' + escapeHtml(client.email || '') + '<br>' + escapeHtml(client.phone || '') + '</p></div>' : ''}

  ${notes ? '<div class="section"><div class="section-title">Notes</div><p>' + escapeHtml(notes).replace(/\n/g, '<br>') + '</p></div>' : ''}
  
  <div class="terms">
    <strong>Terms:</strong> 50% deposit required. Full payment 7 days before. Free cancellation 14+ days before.
  </div>
  
  <div class="footer">
    Phuket Yacht Charter | booking@phuketcharter.com | +66 81 234 5678
  </div>
  
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
