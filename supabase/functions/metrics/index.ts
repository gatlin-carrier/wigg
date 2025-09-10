import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProgressSegment = { startPct: number; endPct: number; meanScore?: number; userScore?: number };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (a[base + 1] !== undefined) return a[base] + rest * (a[base + 1] - a[base]);
  return a[base];
}

function classifyPeakFromSegments(segments: ProgressSegment[]): { label: string; peak_at_pct: number } {
  // Lightweight mid/late/early classifier using simple resample + max
  if (!segments?.length) return { label: 'Unknown pacing', peak_at_pct: 50 };
  const bins = 24;
  const out = new Array<number>(bins).fill(2);
  for (let i = 0; i < bins; i++) {
    const binStart = (i / bins) * 100;
    const binEnd = ((i + 1) / bins) * 100;
    let w = 0; let s = 0;
    for (const seg of segments) {
      const v = seg.userScore ?? seg.meanScore;
      if (v == null) continue;
      const overlap = Math.max(0, Math.min(binEnd, seg.endPct) - Math.max(binStart, seg.startPct));
      if (overlap > 0) { w += overlap; s += v * overlap; }
    }
    if (w > 0) out[i] = s / w;
  }
  let maxIdx = 0; for (let i = 1; i < bins; i++) if (out[i] > out[maxIdx]) maxIdx = i;
  const peak_at_pct = (maxIdx / (bins - 1)) * 100;
  if (peak_at_pct >= 33 && peak_at_pct <= 66) return { label: 'Peak mid', peak_at_pct };
  if (peak_at_pct > 66) return { label: 'Peak late', peak_at_pct };
  return { label: 'Strong start', peak_at_pct };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const payload = await req.json();
    const action = String(payload?.action || 'get_metrics');
    const title_id = String(payload?.title_id || '').trim();
    if (!title_id) throw new Error('title_id is required');
    const sb = supabaseAdmin();

    if (action === 'get_metrics') {
      const { data, error } = await sb.from('title_metrics').select('*').eq('title_id', title_id).maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ metrics: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'recompute') {
      // Load user_first_good samples
      const { data: rows, error } = await sb.from('user_first_good').select('first_good_pct').eq('title_id', title_id);
      if (error) throw error;
      const values = (rows || []).map((r) => Number(r.first_good_pct)).filter((v) => isFinite(v));
      const med = median(values);
      const q1 = quantile(values, 0.25);
      const q3 = quantile(values, 0.75);
      const iqr = q1 != null && q3 != null ? q3 - q1 : null;

      // Optional peak classification from provided segments
      let peak_label: string | null = null;
      let peak_at_pct: number | null = null;
      if (Array.isArray(payload?.segments)) {
        const cls = classifyPeakFromSegments(payload.segments as ProgressSegment[]);
        peak_label = cls.label;
        peak_at_pct = cls.peak_at_pct;
      }

      const upsert = {
        title_id,
        t2g_comm_pct: med,
        t2g_comm_iqr: iqr,
        sample_size: values.length,
        peak_label,
        peak_at_pct,
        updated_at: new Date().toISOString(),
      };
      const { data: up, error: upErr } = await sb.from('title_metrics').upsert(upsert, { onConflict: 'title_id' }).select('*').maybeSingle();
      if (upErr) throw upErr;
      return new Response(JSON.stringify({ metrics: up }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'upsert_user_first_good') {
      const user_id = String(payload?.user_id || '').trim();
      const first_good_pct = Number(payload?.first_good_pct);
      if (!user_id) throw new Error('user_id is required');
      if (!isFinite(first_good_pct)) throw new Error('first_good_pct is required');
      const { data, error } = await sb.from('user_first_good').upsert({ user_id, title_id, first_good_pct }).select('*').maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ row: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

