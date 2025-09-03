import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WHY_TAGS } from "./WhyTagSelector";
import { type Moment } from "./MomentCapture";

interface MomentsPanelProps {
  moments: Moment[];
  progressOrdinal: number;
  className?: string;
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function secondsToClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`;
}

export function MomentsPanel({ 
  moments, 
  progressOrdinal, 
  className = "" 
}: MomentsPanelProps) {
  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Moments</CardTitle>
        <CardDescription className="text-xs">
          Blurred until you reach that episode/chapter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {moments.length === 0 && (
          <div className="text-xs text-muted-foreground">
            No moments yet — drop one with the tool at the bottom-right.
          </div>
        )}
        {moments.map((moment) => {
          const digitsOnly = moment.unitId.replace(/[^0-9]/g, "");
          const beyondProgress = parseInt(digitsOnly || "0") > progressOrdinal;
          
          return (
            <div
              key={moment.id}
              className="flex items-center justify-between border rounded-xl p-2"
            >
              <div
                className={classNames(
                  "flex items-center gap-3",
                  beyondProgress && "blur-sm select-none"
                )}
              >
                <Badge variant="secondary" className="text-[10px]">
                  {moment.anchorType === "timestamp"
                    ? secondsToClock(moment.anchorValue)
                    : `p.${moment.anchorValue}`}
                </Badge>
                <div className="text-sm flex gap-1 flex-wrap">
                  {moment.whyTags.map((tagId) => (
                    <Badge
                      key={`${moment.id}-${tagId}`}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {WHY_TAGS.find((tag) => tag.id === tagId)?.label ?? tagId}
                    </Badge>
                  ))}
                  {moment.notes && (
                    <span className="text-muted-foreground">
                      — {moment.notes}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {moment.spoilerLevel}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}