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
}

export function GoodnessCurve({ 
  data, 
  className = "", 
  threshold = 2.2 
}: GoodnessCurveProps) {
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
      <CardContent className="h-56">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No community data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 3]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="natural"
                dataKey="score"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={() => threshold}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
