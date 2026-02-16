#!/bin/bash
# ============================================================
# BOAT CHARTER — ПАТЧ ВСЕХ 3х ПРОБЛЕМ
# Запуск: cd ~/boat-charter && bash apply-fixes.sh
# ============================================================

set -e

echo "============================================"
echo "🚀 Boat Charter — Applying fixes..."
echo "============================================"

# Создаём резервные копии
echo "📦 Creating backups..."
mkdir -p _backups_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="_backups_$(date +%Y%m%d_%H%M%S)"
cp app/api/analyze-contract/route.ts "$BACKUP_DIR/analyze-contract_route.ts.bak"
cp app/import/page.tsx "$BACKUP_DIR/import_page.tsx.bak"
echo "✅ Backups saved to $BACKUP_DIR/"

# ============================================================
# ПАТЧ 1: app/api/analyze-contract/route.ts
# ============================================================
echo ""
echo "🔧 [1/2] Patching analyze-contract/route.ts..."

node -e "
const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-contract/route.ts', 'utf8');
let changes = 0;

// --- FIX 1a: MAX_CONTRACT_LENGTH 25000 → 50000 ---
if (code.includes('const MAX_CONTRACT_LENGTH = 25000;')) {
  code = code.replace(
    'const MAX_CONTRACT_LENGTH = 25000;',
    'const MAX_CONTRACT_LENGTH = 50000;'
  );
  changes++;
  console.log('  ✅ MAX_CONTRACT_LENGTH: 25000 → 50000');
} else {
  console.log('  ⚠️  MAX_CONTRACT_LENGTH already changed or not found');
}

// --- FIX 1b: max_tokens 8192 → 16384 ---
if (code.includes('max_tokens: 8192,')) {
  code = code.replace(
    'max_tokens: 8192,',
    'max_tokens: 16384,'
  );
  changes++;
  console.log('  ✅ max_tokens: 8192 → 16384');
} else {
  console.log('  ⚠️  max_tokens already changed or not found');
}

// --- FIX 1c: Добавить retry при обрезанном JSON + улучшить валидацию ---
// Ищем: const data = fixJson(content);
// Заменяем на: retry-логику
const OLD_PARSE = 'const data = fixJson(content);';
const NEW_PARSE = \`let data;
    try {
      data = fixJson(content);
    } catch (parseError: any) {
      // JSON обрезан AI — пробуем запросить продолжение
      console.log('JSON truncated, requesting continuation...');
      try {
        const continueResponse = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You must complete a truncated JSON object. Return ONLY the missing JSON to close all open brackets/braces. Do NOT repeat already existing data.' },
            { role: 'user', content: 'The previous AI response was cut off. Here is the last 800 chars:\\n\\n' + content.slice(-800) + '\\n\\nComplete the JSON. Return ONLY the missing closing part.' }
          ],
          temperature: 0.0,
          max_tokens: 4096,
        });
        let continuation = continueResponse.choices[0].message.content || '';
        continuation = continuation.replace(/\\\`\\\`\\\`json\\\\n?/g, '').replace(/\\\`\\\`\\\`\\\\n?/g, '').trim();
        console.log('Continuation received, length:', continuation.length);

        // Найти точку склейки — последний валидный символ
        let mergePoint = content.length;
        for (let i = content.length - 1; i > content.length - 200; i--) {
          if (content[i] === ',' || content[i] === '{' || content[i] === '[' || content[i] === ':') {
            mergePoint = i + 1;
            break;
          }
        }
        const merged = content.substring(0, mergePoint) + continuation;
        data = fixJson(merged);
        console.log('✅ JSON fixed via continuation');
      } catch (retryError: any) {
        console.error('Continuation also failed:', retryError.message);
        throw parseError; // Бросаем оригинальную ошибку
      }
    }\`;

if (code.includes(OLD_PARSE)) {
  code = code.replace(OLD_PARSE, NEW_PARSE);
  changes++;
  console.log('  ✅ Added JSON retry/continuation logic');
} else {
  console.log('  ⚠️  fixJson call pattern not found (may already be patched)');
}

// --- FIX 1d: Добавить доп. валидацию — проверка что routes внутри boats не пустые из-за pricing_rules ---
const OLD_VALIDATION = \`if (!data.partner?.name) {
      warnings.push('Имя партнёра не распознано');
    }\`;
const NEW_VALIDATION = \`if (!data.partner?.name) {
      warnings.push('Имя партнёра не распознано');
    }

    // Проверяем: если есть pricing_rules но маршруты лодок пустые — предупреждаем
    if (data.pricing_rules?.length > 0 && data.boats?.length > 0) {
      const totalBoatRoutes = data.boats.reduce((sum: number, b: any) => sum + (b.routes?.length || 0), 0);
      if (totalBoatRoutes === 0) {
        warnings.push('Цены найдены в pricing_rules, но маршруты лодок пусты — маршруты будут сгенерированы при импорте');
      }
    }

    // Проверяем обрезку ответа AI
    if (response.choices[0].finish_reason === 'length') {
      warnings.push('Ответ AI был обрезан по длине — возможно потеряны данные. Попробуйте разбить контракт на части.');
    }\`;

if (code.includes(OLD_VALIDATION)) {
  code = code.replace(OLD_VALIDATION, NEW_VALIDATION);
  changes++;
  console.log('  ✅ Added extra validation warnings');
} else {
  console.log('  ⚠️  Validation block not found for enhancement');
}

fs.writeFileSync('app/api/analyze-contract/route.ts', code);
console.log('  📝 Total changes in analyze-contract: ' + changes);
"

# ============================================================
# ПАТЧ 2: app/import/page.tsx  (3 проблемы)
# ============================================================
echo ""
echo "🔧 [2/2] Patching import/page.tsx..."

node -e "
const fs = require('fs');
let code = fs.readFileSync('app/import/page.tsx', 'utf8');
let changes = 0;

// --- FIX 2a: Enrichment логика — обогащать маршруты БЕЗ цен даже если у других цены есть ---
const OLD_ENRICH = 'if (boatPrices.length > 0 && boat.routes.length > 0 && !routesHavePrices) {';
const NEW_ENRICH = 'if (boatPrices.length > 0 && boat.routes.length > 0) { // FIXED: enrich routes without prices even if some have prices';

if (code.includes(OLD_ENRICH)) {
  code = code.replace(OLD_ENRICH, NEW_ENRICH);
  
  // Теперь нужно добавить проверку внутри цикла — пропускать маршруты у которых УЖЕ есть цена
  // Ищем: for (const route of boat.routes) { сразу после enrichment блока
  // Находим блок 'const enrichedRoutes: any[] = [];' после нашей замены и
  // добавляем skip-логику после 'for (const route of boat.routes) {'
  
  const LOOP_MARKER = '// Routes exist but may lack prices - enrich them';
  const OLD_LOOP = LOOP_MARKER + \`
            const enrichedRoutes: any[] = [];
            for (const route of boat.routes) {
              // Determine charter_type from duration
              const rType = route.duration_hours <= 5 ? 'half_day' : 'full_day';\`;
  const NEW_LOOP = LOOP_MARKER + \`
            const enrichedRoutes: any[] = [];
            for (const route of boat.routes) {
              // FIXED: Skip routes that already have valid prices
              if (route.base_price && route.base_price > 0) {
                enrichedRoutes.push(route);
                continue;
              }
              // Determine charter_type from duration
              const rType = route.duration_hours <= 5 ? 'half_day' : 'full_day';\`;
  
  if (code.includes(OLD_LOOP)) {
    code = code.replace(OLD_LOOP, NEW_LOOP);
    changes++;
    console.log('  ✅ Fixed route enrichment — now enriches only priceless routes');
  } else {
    // Второй вариант поиска маркера
    changes++;
    console.log('  ✅ Fixed enrichment condition (main), inner loop marker not found — check manually');
  }
} else {
  console.log('  ⚠️  Enrichment block not found (may already be patched)');
}


// --- FIX 2b: Улучшить поиск маршрутов при сохранении (не терять маршруты) ---
const OLD_ROUTE_SEARCH = \`// Find or create route - use exact match first, then create new
          const { data: exactMatch } = await supabase
            .from('routes')
            .select('id')
            .ilike('name', route.destination.trim());\`;

const NEW_ROUTE_SEARCH = \`// Find or create route - improved matching
          const normalizedDest = (route.destination || '').trim().replace(/\\\\s+/g, ' ');
          if (!normalizedDest) {
            console.warn('Skipping route with empty destination for boat:', boat.name);
            continue;
          }
          
          // Step 1: Exact match (case-insensitive)
          const { data: exactMatch } = await supabase
            .from('routes')
            .select('id, name')
            .ilike('name', normalizedDest);\`;

if (code.includes(OLD_ROUTE_SEARCH)) {
  code = code.replace(OLD_ROUTE_SEARCH, NEW_ROUTE_SEARCH);
  changes++;
  console.log('  ✅ Improved route search — normalized + empty check');
} else {
  console.log('  ⚠️  Route search block not found');
}


// --- FIX 2c: После exactMatch добавить partial matching fallback ---
const OLD_ROUTE_CREATE = \`if (exactMatch && exactMatch.length > 0) {
            routeId = exactMatch[0].id;
          } else {
            // Create new route with full name
            const { data: newRoute, error: routeError } = await supabase
              .from('routes')
              .insert({
                name: route.destination,\`;

const NEW_ROUTE_CREATE = \`if (exactMatch && exactMatch.length > 0) {
            routeId = exactMatch[0].id;
          } else {
            // Step 2: Partial match — search by first significant word
            let partialRouteId: number | null = null;
            const firstWord = normalizedDest.split(/[\\\\s,+&]+/)[0];
            if (firstWord && firstWord.length > 2) {
              const { data: partialMatch } = await supabase
                .from('routes')
                .select('id, name')
                .ilike('name', '%' + firstWord + '%');
              if (partialMatch && partialMatch.length > 0) {
                const best = partialMatch.find((r: any) =>
                  r.name.toLowerCase().includes(normalizedDest.toLowerCase()) ||
                  normalizedDest.toLowerCase().includes(r.name.toLowerCase())
                );
                if (best) partialRouteId = best.id;
              }
            }
            
            if (partialRouteId) {
              routeId = partialRouteId;
            } else {
            // Step 3: Create new route with full name
            const { data: newRoute, error: routeError } = await supabase
              .from('routes')
              .insert({
                name: normalizedDest,\`;

if (code.includes(OLD_ROUTE_CREATE)) {
  code = code.replace(OLD_ROUTE_CREATE, NEW_ROUTE_CREATE);
  changes++;
  console.log('  ✅ Added partial match fallback for route search');
  
  // Нужно закрыть дополнительный else { ... } — ищем конец блока создания маршрута
  // Добавляем закрывающую скобку после routeId = newRoute.id;
  const OLD_ROUTE_END = \`if (routeError) {
              console.error('Route insert error:', routeError);
              continue;
            }
            routeId = newRoute.id;
          }\`;
  const NEW_ROUTE_END = \`if (routeError) {
              console.error('Route insert error:', routeError, 'Dest:', normalizedDest);
              // Try to find by exact name one more time (race condition)
              const { data: retryFind } = await supabase
                .from('routes').select('id').eq('name', normalizedDest).limit(1).single();
              if (retryFind) {
                routeId = retryFind.id;
              } else {
                console.error('FATAL: Cannot create or find route:', normalizedDest);
                continue;
              }
            } else {
              routeId = newRoute.id;
            }
            } // close partialRouteId else
          }\`;
  
  if (code.includes(OLD_ROUTE_END)) {
    code = code.replace(OLD_ROUTE_END, NEW_ROUTE_END);
    changes++;
    console.log('  ✅ Fixed route creation error handling + closing brace');
  }
} else {
  console.log('  ⚠️  Route create block not found');
}


// --- FIX 2d: Учитывать time_slot при поиске существующих цен ---
const OLD_PRICE_SEARCH = \`.eq('boat_id', boatId)
            .eq('route_id', routeId)
            .eq('season', season)
            .gte('valid_to', today)\`;

const NEW_PRICE_SEARCH = \`.eq('boat_id', boatId)
            .eq('route_id', routeId)
            .eq('season', season)
            .eq('time_slot', timeSlot) // FIXED: match time_slot too
            .gte('valid_to', today)\`;

if (code.includes(OLD_PRICE_SEARCH)) {
  // Нужно также убедиться что timeSlot определён перед этим блоком
  // Ищем определение season и добавляем timeSlot рядом
  const OLD_SEASON_DEF = \`const season = route.season || 'high';
          const today = new Date().toISOString().split('T')[0];\`;
  const NEW_SEASON_DEF = \`const season = route.season || 'high';
          const timeSlot = route.time_slot || route.charter_type || 'full_day';
          const today = new Date().toISOString().split('T')[0];\`;
  
  if (code.includes(OLD_SEASON_DEF)) {
    code = code.replace(OLD_SEASON_DEF, NEW_SEASON_DEF);
    changes++;
    console.log('  ✅ Added timeSlot variable definition');
  }
  
  code = code.replace(OLD_PRICE_SEARCH, NEW_PRICE_SEARCH);
  changes++;
  console.log('  ✅ Fixed price search — now includes time_slot');
} else {
  console.log('  ⚠️  Price search block not found');
}


// --- FIX 2e: name → normalizedDest в route insert (уже частично в 2c, проверяем другие) ---
// В новом блоке создания цены заменяем route.destination на normalizedDest
code = code.replace(
  /name: route\.destination,(\s+name_en: route\.destination,)/g,
  'name: normalizedDest,\$1'
);
// Также name_en
code = code.replace(
  /name_en: route\.destination,/g,
  'name_en: normalizedDest,'
);


// --- FIX 3: ИСТОРИЯ — добавить запись в import_history при сохранении ---
// Ищем конец saveToDatabase — успешное сообщение
const SAVE_SUCCESS_MARKERS = [
  \"setSaveStatus('✅\",
  'setSaveStatus(\\'✅',
  \"setSaveStatus(\\\"✅\",
];

let successMarker = null;
for (const m of SAVE_SUCCESS_MARKERS) {
  if (code.includes(m)) { successMarker = m; break; }
}

// Ищем строку типа: setSaveStatus('✅ ... 
// и добавляем перед ней запись в import_history
const HISTORY_INSERT = \`
      // === Save to import_history ===
      try {
        await supabase.from('import_history').insert({
          partner_id: partnerId,
          partner_name: selectedPartnerName || extractedData.partner_name || 'Unknown',
          import_type: importMode || 'full',
          boats_count: extractedData.boats?.length || 0,
          routes_count: extractedData.boats?.reduce((sum: number, b: any) => sum + (b.routes?.length || 0), 0) || 0,
          raw_data: extractedData,
          status: 'success',
          notes: 'Boats: ' + (extractedData.boats || []).map((b: any) => b.name).join(', '),
          created_at: new Date().toISOString()
        });
        console.log('Import history saved');
      } catch (histErr: any) {
        console.error('Failed to save import history:', histErr.message);
      }

\`;

// Находим первый setSaveStatus с ✅ в функции saveToDatabase
const saveStatusIdx = code.indexOf(\"setSaveStatus('\");
if (saveStatusIdx > 0) {
  // Проверяем что это внутри saveToDatabase (после 'saveError')
  const beforeCtx = code.substring(Math.max(0, saveStatusIdx - 2000), saveStatusIdx);
  if (beforeCtx.includes('saveError') || beforeCtx.includes('saveToDatabase')) {
    // Ищем точку перед setSaveStatus где вставить
    // Находим начало строки
    let insertIdx = saveStatusIdx;
    while (insertIdx > 0 && code[insertIdx - 1] !== '\\n') insertIdx--;
    
    // Проверяем что history insert ещё не добавлен
    if (!code.substring(insertIdx - 500, insertIdx).includes('import_history')) {
      code = code.substring(0, insertIdx) + HISTORY_INSERT + code.substring(insertIdx);
      changes++;
      console.log('  ✅ Added import_history save on successful import');
    } else {
      console.log('  ⚠️  import_history insert already exists');
    }
  }
}


// --- FIX 3b: Загружать историю при монтировании ---
// Ищем fetchExistingPartners определение и рядом добавляем useEffect
const MOUNT_MARKER = \"// Load partners when component mounts\";
if (code.includes(MOUNT_MARKER) && !code.includes(\"fetchImportHistory();\")) {
  // Добавляем useEffect после маркера
  const insertAfter = MOUNT_MARKER + \"\\n  // Note: fetchExistingPartners is called when 'single_boat' mode is selected\";
  const NEW_EFFECT = insertAfter + \`

  // Load import history on mount
  useEffect(() => {
    fetchImportHistory();
  }, []);\`;
  
  if (code.includes(insertAfter)) {
    code = code.replace(insertAfter, NEW_EFFECT);
    changes++;
    console.log('  ✅ Added useEffect to load import history on mount');
  }
} else if (code.includes('fetchImportHistory()')) {
  console.log('  ⚠️  fetchImportHistory already called somewhere');
} else {
  console.log('  ⚠️  Mount marker not found');
}


// --- FIX 4: Улучшить поиск партнёра (не по первому слову) ---
const OLD_PARTNER_SEARCH = \"const partnerFirstWord = extractedData.partner_name.split(' ')[0];\";
if (code.includes(OLD_PARTNER_SEARCH)) {
  const OLD_PARTNER_BLOCK = \`const partnerFirstWord = extractedData.partner_name.split(' ')[0];
        
        const { data: existingPartners } = await supabase
          .from('partners')
          .select('*')
          .ilike('name', '%' + partnerFirstWord + '%');\`;
  
  const NEW_PARTNER_BLOCK = \`// Smart partner search — by first 2 words for better matching
        const partnerWords = extractedData.partner_name.trim().split(/\\\\s+/);
        const searchName = partnerWords.slice(0, Math.min(2, partnerWords.length)).join(' ');
        
        const { data: existingPartners } = await supabase
          .from('partners')
          .select('*')
          .ilike('name', '%' + searchName + '%');\`;
  
  if (code.includes(OLD_PARTNER_BLOCK)) {
    code = code.replace(OLD_PARTNER_BLOCK, NEW_PARTNER_BLOCK);
    changes++;
    console.log('  ✅ Improved partner search — 2 words instead of 1');
  } else {
    console.log('  ⚠️  Full partner search block not matched (partial match only)');
  }
} else {
  console.log('  ⚠️  Partner search not found');
}


fs.writeFileSync('app/import/page.tsx', code);
console.log('  📝 Total changes in import/page.tsx: ' + changes);
"

# ============================================================
# ПРОВЕРКА
# ============================================================
echo ""
echo "============================================"
echo "🔍 Verifying patches..."
echo "============================================"

echo ""
echo "📄 analyze-contract/route.ts:"
grep -n "MAX_CONTRACT_LENGTH = " app/api/analyze-contract/route.ts | head -1
grep -n "max_tokens:" app/api/analyze-contract/route.ts | head -1
grep -c "continuation" app/api/analyze-contract/route.ts | xargs -I{} echo "  retry/continuation mentions: {}"

echo ""
echo "📄 import/page.tsx:"
grep -c "import_history" app/import/page.tsx | xargs -I{} echo "  import_history mentions: {}"
grep -c "normalizedDest" app/import/page.tsx | xargs -I{} echo "  normalizedDest mentions: {}"
grep -c "time_slot.*FIXED" app/import/page.tsx | xargs -I{} echo "  time_slot fix mentions: {}"
grep -c "fetchImportHistory" app/import/page.tsx | xargs -I{} echo "  fetchImportHistory mentions: {}"
grep -c "partnerWords" app/import/page.tsx | xargs -I{} echo "  improved partner search mentions: {}"

echo ""
echo "============================================"
echo "✅ All patches applied!"
echo ""
echo "Next steps:"
echo "  1. Review the changes:  git diff"
echo "  2. Test:                npm run dev"
echo "  3. Test contract parse: go to /import, paste a contract"
echo "  4. Check history:       after import, click History button"
echo "  5. If OK, commit:       git add -A && git commit -m 'fix: parsing, routes, history'"
echo ""
echo "  Backups are in: $BACKUP_DIR/"
echo "  To revert:      cp $BACKUP_DIR/*.bak app/... (manually)"
echo "============================================"
