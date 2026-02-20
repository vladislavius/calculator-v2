import { createClient } from '@supabase/supabase-js';

// Единственный экземпляр Supabase для всего приложения
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
