import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Кэш чтобы не дёргать Supabase для каждой карточки отдельно
let cachedUnavailable: Record<number, Array<{date_from: string, date_to: string}>> | null = null;
let cachedCalendarBoats: Set<number> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export async function preloadAvailability() {
  if (cachedUnavailable && Date.now() - cacheTime < CACHE_TTL) return;

  const today = new Date().toISOString().split('T')[0];
  const in14days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [{ data: unavail }, { data: cals }] = await Promise.all([
    sb.from('boat_unavailable_dates')
      .select('boat_id, date_from, date_to')
      .gte('date_to', today)
      .lte('date_from', in14days),
    sb.from('boat_calendars').select('boat_id').eq('active', true)
  ]);

  cachedUnavailable = {};
  (unavail || []).forEach((u: any) => {
    if (!cachedUnavailable![u.boat_id]) cachedUnavailable![u.boat_id] = [];
    cachedUnavailable![u.boat_id].push({ date_from: u.date_from, date_to: u.date_to });
  });

  cachedCalendarBoats = new Set((cals || []).map((c: any) => c.boat_id));
  cacheTime = Date.now();
}

export function useBoatAvailability(boatId: number, searchDate?: string) {
  const [days, setDays] = useState<Array<{ date: Date, status: 'free' | 'busy' | 'unknown', isSearchDate: boolean }>>([]);

  useEffect(() => {
    async function load() {
      await preloadAvailability();

      const startDate = new Date(); // всегда с сегодня
      startDate.setHours(0, 0, 0, 0);

      const hasCalendar = cachedCalendarBoats?.has(boatId) ?? false;
      const unavailable = cachedUnavailable?.[boatId] || [];

      const result = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const isBusy = unavailable.some(u => dateStr >= u.date_from && dateStr <= u.date_to);
        const status = !hasCalendar ? 'unknown' : isBusy ? 'busy' : 'free';
        const isSearchDate = searchDate ? dateStr === searchDate : i === 0;

        result.push({ date: d, status, isSearchDate });
      }
      setDays(result);
    }
    load();
  }, [boatId, searchDate]);

  return days;
}
