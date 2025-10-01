import { supabase } from '@/integrations/supabase/client';
import { handleError, handleSuccess } from '../utils/errorHandler';
import type { DataLayerResponse } from '../types/errors';
import type { ProgressSegment } from '@/hooks/useTitleProgress';

interface TitleSegmentRow {
  id?: string;
  title_id?: string;
  segment_count?: number | null;
  segment_index?: number | null;
  start_pct?: number | null;
  end_pct?: number | null;
  segment_start_pct?: number | null;
  segment_end_pct?: number | null;
  mean_score?: number | null;
  user_score?: number | null;
  sample_size?: number | null;
  total_length_sec?: number | null;
  updated_at?: string | null;
}

interface TitleProgressRecord {
  segments: ProgressSegment[];
  segmentCount: number;
  sampleSize: number | null;
  totalLengthSeconds: number | null;
}

function coerceNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function deriveSegmentBounds(row: TitleSegmentRow, index: number, segmentCount: number): { startPct: number; endPct: number } {
  const count = segmentCount > 0 ? segmentCount : 1;
  const idx = typeof row.segment_index === 'number' ? row.segment_index : index;
  const start = row.start_pct ?? row.segment_start_pct;
  const end = row.end_pct ?? row.segment_end_pct;
  const computedStart = (idx / count) * 100;
  const computedEnd = ((idx + 1) / count) * 100;
  return {
    startPct: start ?? computedStart,
    endPct: end ?? computedEnd,
  };
}

export const titleProgressClient = {
  async getTitleSegments(titleId: string): Promise<DataLayerResponse<TitleProgressRecord>> {
    if (!titleId) {
      return handleError({ code: 'INVALID_ARGUMENT', message: 'titleId is required' });
    }

    try {
      const query = supabase
        .from('title_segments')
        .select('*')
        .eq('title_id', titleId)
        .order('segment_count', { ascending: false })
        .order('segment_index', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return handleError(error);
      }

      const rows = (data as TitleSegmentRow[] | null) ?? [];
      if (rows.length === 0) {
        return handleSuccess({
          segments: [],
          segmentCount: 0,
          sampleSize: null,
          totalLengthSeconds: null,
        });
      }

      // Group rows by segment_count and pick the densest set.
      const grouped = new Map<number, TitleSegmentRow[]>();
      rows.forEach((row, index) => {
        const count = coerceNumber(row.segment_count, 0);
        const key = count > 0 ? count : rows.length;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push({ ...row, segment_index: row.segment_index ?? index });
      });

      const bestCount = Array.from(grouped.keys()).sort((a, b) => b - a)[0];
      const bestRows = (grouped.get(bestCount) ?? rows).sort((a, b) => coerceNumber(a.segment_index, 0) - coerceNumber(b.segment_index, 0));

      const segments: ProgressSegment[] = bestRows.map((row, index) => {
        const bounds = deriveSegmentBounds(row, index, bestCount);
        const meanScore = row.mean_score ?? undefined;
        const userScore = row.user_score ?? undefined;
        return {
          startPct: bounds.startPct,
          endPct: bounds.endPct,
          meanScore,
          userScore,
        };
      });

      const sampleSize = bestRows.reduce<number | null>((acc, row) => {
        const value = row.sample_size ?? null;
        if (value == null) return acc;
        if (acc == null) return value;
        return Math.max(acc, value);
      }, null);

      const totalLengthSeconds = bestRows.reduce<number | null>((acc, row) => {
        const value = row.total_length_sec ?? null;
        if (value == null) return acc;
        if (acc == null) return value;
        return Math.max(acc, value);
      }, null);

      return handleSuccess({
        segments,
        segmentCount: bestCount,
        sampleSize,
        totalLengthSeconds,
      });
    } catch (error) {
      return handleError(error);
    }
  },
};
