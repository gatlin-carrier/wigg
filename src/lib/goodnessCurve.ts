import type { ProgressSegment } from '@/hooks/useTitleProgress';

export type GoodnessCurveUnitKind = 'episode' | 'chapter';

export interface GoodnessCurvePoint {
  unit: number;
  label: string;
  score: number | null;
}

export interface GoodnessCurveSeriesPoint extends GoodnessCurvePoint {
  index: number;
}

export interface BuildGoodnessCurveSeriesOptions {
  data: GoodnessCurvePoint[];
  totalUnits?: number;
  unitLabelKind?: GoodnessCurveUnitKind;
  threshold?: number;
}

export interface BuiltGoodnessCurveSeries {
  series: GoodnessCurveSeriesPoint[];
  labelByIndex: Map<number, string>;
  values: number[];
  hasScores: boolean;
}

const DEFAULT_THRESHOLD = 2.2;

export function buildGoodnessCurveSeries({
  data,
  totalUnits,
  unitLabelKind = 'episode',
  threshold = DEFAULT_THRESHOLD,
}: BuildGoodnessCurveSeriesOptions): BuiltGoodnessCurveSeries {
  const byUnit = new Map<number, GoodnessCurvePoint>();
  data.forEach((point) => {
    if (!Number.isFinite(point.unit)) return;
    const safeUnit = Math.max(1, Math.floor(point.unit));
    byUnit.set(safeUnit, point);
  });

  const maxUnit = data.reduce((max, point) => Math.max(max, point.unit), 0);
  const total = Math.max(1, totalUnits || maxUnit || data.length);

  const makeLabel = (unit: number) => {
    const existing = byUnit.get(unit);
    if (existing?.label) return existing.label;
    return `${unitLabelKind === 'chapter' ? 'Ch' : 'Ep'}${unit}`;
  };

  const series: GoodnessCurveSeriesPoint[] = Array.from({ length: total }, (_, index) => {
    const unit = index + 1;
    const existing = byUnit.get(unit);
    return {
      index,
      unit,
      label: makeLabel(unit),
      score: existing?.score ?? null,
    };
  });

  const labelByIndex = new Map<number, string>();
  series.forEach((point) => {
    labelByIndex.set(point.index, point.label);
  });

  let hasScores = false;
  const fallback = typeof threshold === 'number' ? threshold : DEFAULT_THRESHOLD;
  let carry = fallback;
  const values = series.map((point) => {
    if (typeof point.score === 'number' && Number.isFinite(point.score)) {
      hasScores = true;
      carry = point.score;
      return point.score;
    }
    return carry;
  });

  return {
    series,
    labelByIndex,
    values: hasScores ? values : [],
    hasScores,
  };
}

export function segmentsToGoodnessCurvePoints(
  segments: ProgressSegment[] | undefined,
  unitLabelKind: GoodnessCurveUnitKind = 'episode',
): GoodnessCurvePoint[] {
  if (!segments?.length) {
    return [];
  }

  return segments.map((segment, index) => {
    const labelPrefix = unitLabelKind === 'chapter' ? 'Ch' : 'Ep';
    const score =
      segment.userScore ??
      segment.meanScore ??
      null;
    return {
      unit: index + 1,
      label: `${labelPrefix}${index + 1}`,
      score: score,
    };
  });
}

export function resampleSegmentsToGoodnessPoints(
  segments: ProgressSegment[] | undefined,
  desiredCount: number,
  unitLabelKind: GoodnessCurveUnitKind = 'episode',
): GoodnessCurvePoint[] {
  const safeCount = Math.max(1, desiredCount);
  if (!segments?.length) {
    return Array.from({ length: safeCount }, (_, index) => ({
      unit: index + 1,
      label: `${unitLabelKind === 'chapter' ? 'Ch' : 'Ep'}${index + 1}`,
      score: null,
    }));
  }

  if (segments.length === safeCount) {
    return segmentsToGoodnessCurvePoints(segments, unitLabelKind);
  }

  const ratio = segments.length / safeCount;
  return Array.from({ length: safeCount }, (_, index) => {
    const segmentIndex = Math.min(segments.length - 1, Math.floor(index * ratio));
    const segment = segments[segmentIndex];
    const score = segment.userScore ?? segment.meanScore ?? null;
    return {
      unit: index + 1,
      label: `${unitLabelKind === 'chapter' ? 'Ch' : 'Ep'}${index + 1}`,
      score,
    };
  });
}
