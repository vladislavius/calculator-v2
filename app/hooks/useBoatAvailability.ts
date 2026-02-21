import { useState, useEffect } from 'react';
import { supabase as sb } from '../lib/supabase';

let cachedUnavailable: Record<number, Array<{date_from: string, date_to: string}>> | null = null;
let cachedCalendarBoats: Set<number> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;
let loadingPromise: Promise<void> | null = null;

export async function preloadAvailability() {
  if (cachedUnavailable && Date.now() - cacheTime < CACHE_TTL) return;
  
  // Prevent concurrent loads
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = (async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const in14days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const [unavailRes, calsRes] = await Promise.all([
        sb.from('boat_unavailable_dates')
          .select('boat_id, date_from, date_to')
          .gte('date_to', today)
          .lte('date_from', in14days),
        sb.from('boat_calendars').select('boat_id').eq('active', true)
      ]);

      cachedUnavailable = {};
      (unavailRes.data || []).forEach((u: any) => {
        if (!cachedUnavailable![u.boat_id]) cachedUnavailable![u.boat_id] = [];
        cachedUnavailable![u.boat_id].push({ date_from: u.date_from, date_to: u.date_to });
      });
      cachedCalendarBoats = new Set((calsRes.data || []).map((c: any) => c.boat_id));
    } catch {
      cachedUnavailable = {};
      cachedCalendarBoats = new Set();
    }
    cacheTime = Date.now();
    loadingPromise = null;
  })();
  
  return loadingPromise;
}

export function useBoatAvailability(boatId: number, searchDate?: string) {
  const [days, setDays] = useState<Array<{ date: Date, status: 'free' | 'busy' | 'unknown', isSearchDate: boolean }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await preloadAvailability();
      if (cancelled) return;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const hasCalendar = cachedCalendarBoats?.has(boatId) ?? false;
      const unavailable = cachedUnavailable?.[boatId] || [];

      const result = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const isBusy = unavailable.some(u => dateStr >= u.date_from && dateStr <= u.date_to);
        const status: 'free' | 'busy' | 'unknown' = !hasCalendar ? 'unknown' : isBusy ? 'busy' : 'free';
        const isSearchDate = searchDate ? dateStr === searchDate : i === 0;

        result.push({ date: d, status, isSearchDate });
      }
      setDays(result);
    }
    load();
    return () => { cancelled = true; };
  }, [boatId, searchDate]);

  return days;
}
