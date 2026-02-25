// IMPORTANT: Never commit real API keys. Set these in your environment before running.
// Usage: OLD_SUPABASE_URL=... OLD_SUPABASE_KEY=... NEW_SUPABASE_URL=... NEW_SUPABASE_KEY=... node migrate2.js
const OLD_URL = (process.env.OLD_SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
const OLD_KEY = process.env.OLD_SUPABASE_KEY || (() => { throw new Error('OLD_SUPABASE_KEY env var is required'); })();
const NEW_URL = (process.env.NEW_SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
const NEW_KEY = process.env.NEW_SUPABASE_KEY || (() => { throw new Error('NEW_SUPABASE_KEY env var is required'); })();

const tables = [
  'partners', 'boats', 'routes', 'options_catalog',
  'route_prices', 'boat_options', 'boat_pricing_rules',
  'import_history', 'partner_menus', 'route_fees'
];

async function getColumns(url, key, table) {
  // Insert empty to get column error, or try OPTIONS
  const res = await fetch(`${url}/${table}?limit=0`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  // Get columns from response headers
  const contentProfile = res.headers.get('content-profile');
  // Alternative: try inserting {} and parse error
  const res2 = await fetch(`${url}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': key, 'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify({})
  });
  const err = await res2.json();
  // Parse column names from error details
  if (err.details) {
    const match = err.details.match(/Failing row contains \(([^)]+)\)/);
  }
  return null;
}

async function tryInsert(table, row) {
  const res = await fetch(`${NEW_URL}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': NEW_KEY, 'Authorization': `Bearer ${NEW_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (res.ok) return { ok: true };
  const err = await res.json();
  return { ok: false, error: err };
}

async function migrate() {
  for (const table of tables) {
    process.stdout.write(`${table}: `);
    
    const res = await fetch(`${OLD_URL}/${table}?select=*&limit=10000`, {
      headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
    });
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('0 rows (skip)');
      continue;
    }

    // Try first row to discover bad columns
    let badCols = new Set();
    let attempts = 0;
    let testRow = { ...data[0] };
    
    while (attempts < 15) {
      const result = await tryInsert(table, testRow);
      if (result.ok) break;
      
      const msg = result.error.message || '';
      const colMatch = msg.match(/Could not find the '(\w+)' column/);
      if (colMatch) {
        badCols.add(colMatch[1]);
        delete testRow[colMatch[1]];
        attempts++;
      } else {
        // Other error (FK, etc) - skip discovery
        break;
      }
    }
    
    if (badCols.size > 0) {
      console.log(`(removing cols: ${[...badCols].join(', ')})`);
      process.stdout.write(`  inserting: `);
    }
    
    // Clean all rows
    const cleaned = data.map(row => {
      const r = { ...row };
      for (const col of badCols) delete r[col];
      return r;
    });
    
    // Delete test row if it was inserted
    await fetch(`${NEW_URL}/${table}?id=eq.${data[0].id}`, {
      method: 'DELETE',
      headers: { 'apikey': NEW_KEY, 'Authorization': `Bearer ${NEW_KEY}` }
    });
    
    // Batch insert
    let inserted = 0;
    for (let i = 0; i < cleaned.length; i += 50) {
      const batch = cleaned.slice(i, i + 50);
      const insertRes = await fetch(`${NEW_URL}/${table}`, {
        method: 'POST',
        headers: {
          'apikey': NEW_KEY, 'Authorization': `Bearer ${NEW_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(batch)
      });
      
      if (insertRes.ok) {
        inserted += batch.length;
      } else {
        const err = await insertRes.text();
        if (i === 0) console.log(`ERR: ${err.substring(0, 120)}`);
      }
    }
    
    console.log(`${inserted}/${data.length} rows`);
  }
}

migrate().catch(e => console.error(e));
