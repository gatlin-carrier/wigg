import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlameKindling } from "lucide-react";
import { MiniGoodnessCurve } from './MiniGoodnessCurve';

export interface GoodnessCurveData {
  unit: number;
  label: string;
  score: number;
}

interface GoodnessCurveProps {
  data: GoodnessCurveData[];
  className?: string;
  threshold?: number;
  totalUnits?: number;
  unitLabelKind?: 'episode' | 'chapter';
}

export function GoodnessCurve({ 
  data,
  className = "", 
  threshold = 2.2,
  totalUnits,
  unitLabelKind = 'episode'
}: GoodnessCurveProps) {
  // Build evenly spaced series data while keeping labels available for axis annotations
  const { series, labelByIndex } = React.useMemo(() => {
    const byUnit = new Map<number, GoodnessCurveData>();
    data.forEach((d) => byUnit.set(d.unit, d));
    const total = Math.max(1, totalUnits || data.length);
    const makeLabel = (u: number) => {
      const existing = byUnit.get(u);
      if (existing?.label) return existing.label;
      return `${unitLabelKind === 'chapter' ? 'Ch' : 'E'}${u}`;
    };
    const items = Array.from({ length: total }, (_, i) => {
      const unit = i + 1;
      const d = byUnit.get(unit);
      return {
        index: i, // 0-based index
        unit,
        label: makeLabel(unit),
        score: (d?.score as number | null) ?? null,
      } as any;
    });
    const m = new Map<number, string>();
    items.forEach((r: any) => m.set(r.index, r.label));
    return { series: items, labelByIndex: m };
  }, [data, totalUnits, unitLabelKind]);

  const hasScores = React.useMemo(() => series.some((item) => typeof item.score === 'number'), [series]);

  const curveValues = React.useMemo(() => {
    if (!hasScores) return [] as number[];
    const fallback = typeof threshold === 'number' ? threshold : 2;
    const firstDefined = series.find((item) => typeof item.score === 'number');
    let carry = firstDefined?.score ?? fallback;
    return series.map((item) => {
      if (typeof item.score === 'number') {
        carry = item.score;
        return item.score;
      }
      return carry;
    });
  }, [hasScores, series, threshold]);

  const chartHeight = 160;

  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FlameKindling className="h-4 w-4" />
          Goodness Curve
        </CardTitle>
        <CardDescription className="text-xs">
          Rolling feel of the season/arc. Threshold line marks where it "gets good" and stays there.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-56 p-0">
        {!hasScores ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No community data available yet
          </div>
        ) : (
          <div className="flex h-full flex-col px-4 py-4">
            <div className="relative flex-1">
              <MiniGoodnessCurve
                className="relative z-10"
                values={curveValues}
                height={chartHeight}
                threshold={threshold}
                gridLines={[1, 2]}
                showPeakMarker
                showPeakPlayhead
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{labelByIndex.get(0)}</span>
              {series.length > 2 && (
                <span>{labelByIndex.get(Math.floor((series.length - 1) / 2))}</span>
              )}
              <span>{labelByIndex.get(series.length - 1)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
