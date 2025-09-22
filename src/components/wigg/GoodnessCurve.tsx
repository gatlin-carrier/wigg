import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlameKindling } from "lucide-react";
import { MiniGoodnessCurve } from './MiniGoodnessCurve';
import {
  buildGoodnessCurveSeries,
  type GoodnessCurvePoint,
  type GoodnessCurveUnitKind,
} from '@/lib/goodnessCurve';

export type GoodnessCurveData = GoodnessCurvePoint;

interface GoodnessCurveProps {
  data: GoodnessCurvePoint[];
  className?: string;
  threshold?: number;
  totalUnits?: number;
  unitLabelKind?: GoodnessCurveUnitKind;
}

export function GoodnessCurve({ 
  data,
  className = "", 
  threshold = 2.2,
  totalUnits,
  unitLabelKind = 'episode'
}: GoodnessCurveProps) {
  const { series, labelByIndex, values: curveValues, hasScores } = React.useMemo(
    () =>
      buildGoodnessCurveSeries({
        data,
        totalUnits,
        unitLabelKind,
        threshold,
      }),
    [data, totalUnits, unitLabelKind, threshold],
  );

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
