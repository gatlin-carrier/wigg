import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlameKindling } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  // Build series data with categorical x-axis but force full width with specific Recharts settings
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
      <CardContent className="h-56 p-0 [&_.recharts-wrapper]:!w-full [&_.recharts-surface]:!w-full">
        {series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No community data available yet
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg 
              className="w-full h-full border-2 border-red-500" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[1, 2].map((level) => (
                <line
                  key={level}
                  x1={0}
                  x2={100}
                  y1={100 - (level / 3) * 80}
                  y2={100 - (level / 3) * 80}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                />
              ))}
              
              {/* Threshold line */}
              {threshold !== undefined && (
                <line
                  x1={0}
                  x2={100}
                  y1={100 - (threshold / 3) * 80}
                  y2={100 - (threshold / 3) * 80}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.5}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                />
              )}
              
              {/* Data line */}
              <polyline
                points={series
                  .filter(d => d.score !== null)
                  .map((d, i, arr) => {
                    const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                    const y = 100 - ((d.score || 0) / 3) * 80;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              {series.length > 0 && [
                <span key="first">{labelByIndex.get(0)}</span>,
                series.length > 2 && <span key="mid">{labelByIndex.get(Math.floor((series.length - 1) / 2))}</span>,
                <span key="last">{labelByIndex.get(series.length - 1)}</span>
              ].filter(Boolean)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
