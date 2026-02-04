import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text, type } = await request.json();
    
    const prompts: Record<string, string> = {
      catering: `Parse catering menu. Return JSON array: [{"name_en":"Tom Yam","name_ru":"Том Ям","price_per_person":350,"category":"soup"}]. Menu: ${text}`,
      watersports: `Parse watersports. Return JSON array: [{"name_en":"Jet Ski","name_ru":"Гидроцикл","price_per_hour":2500,"price_per_day":10000}]. Text: ${text}`,
      decorations: `Parse decorations. Return JSON array: [{"name_en":"Balloons","name_ru":"Шары","price":5000,"category":"balloons"}]. Text: ${text}`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON array, no markdown.' },
        { role: 'user', content: prompts[type] || prompts.catering }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });
    
    let content = response.choices[0].message.content || '[]';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const items = JSON.parse(content);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
