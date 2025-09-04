import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface SessionStats {
  n: number;
  peak: number;
  good: number;
  ok: number;
  skip: number;
}

interface SessionRecapProps {
  stats: SessionStats;
  className?: string;
}

export function SessionRecap({ stats, className = "" }: SessionRecapProps) {
  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Session recap</CardTitle>
        <CardDescription className="text-xs">
          Quick pulse of how you felt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl p-3 bg-muted">
            <div className="text-2xl font-bold">{stats.skip}</div>
            <div className="text-xs">zzz</div>
          </div>
          <div className="rounded-xl p-3 bg-muted">
            <div className="text-2xl font-bold">{stats.ok}</div>
            <div className="text-xs">good</div>
          </div>
          <div className="rounded-xl p-3 bg-muted">
            <div className="text-2xl font-bold">{stats.good}</div>
            <div className="text-xs">better</div>
          </div>
          <div className="rounded-xl p-3 bg-muted">
            <div className="text-2xl font-bold">{stats.peak}</div>
            <div className="text-xs">peak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}