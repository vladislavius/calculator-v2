import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({ 
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1'
    });
    const { text } = await request.json();

    const systemPrompt = `You are a menu parser for yacht charter companies.

Extract menu sets from the provided text. Each SET is a complete meal package.

RULES:
1. Group dishes into SETS (e.g., "Thai Set 1", "Western Set 2", "Kid Set 1")
2. Extract the category: thai, western, vegetarian, kids, seafood, bbq, other
3. List all dishes in each set
4. If price is mentioned, extract it (per person)
5. Translate dish names to Russian

RETURN JSON:
{
  "menu_name": "name of the menu document",
  "sets": [
    {
      "name": "Thai Set 1",
      "name_ru": "Тайский сет 1",
      "category": "thai",
      "price": null,
      "dishes": ["Tom Yum Goong", "Stir-fried Chicken with Cashew Nuts", "Fried Chicken Wings", "Steamed Rice", "Dessert of the Day"],
      "dishes_ru": ["Том Ям с креветками", "Жареная курица с орехами кешью", "Жареные куриные крылышки", "Рис на пару", "Десерт дня"]
    }
  ],
  "notes": "IMPORTANT conditions in ENGLISH",
  "notes_ru": "IMPORTANT conditions translated to RUSSIAN, e.g.: 'Меню Thai, Vegetarian, Western и Kid только для ПОЛНОДНЕВНЫХ чартеров. Для спидботов: обед в ресторане — ваучер 500 THB/чел. Сообщите об аллергиях или диетических требованиях.'"
}

CATEGORIES:
- thai: Thai cuisine sets
- western: Western/European cuisine
- vegetarian: Vegetarian/Vegan options
- kids: Children's menu
- seafood: Seafood focused
- bbq: BBQ/Grill options
- other: Other types

Extract ALL sets from the menu. Be thorough.`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this menu:\n\n${text.substring(0, 15000)}` }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const data = JSON.parse(content);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Menu parse error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
