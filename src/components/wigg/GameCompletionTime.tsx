import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, GamepadIcon, ChevronRight } from "lucide-react";

interface GameCompletionTimeProps {
  gameTitle: string;
  onCompletionTimeSet: (hours: number) => void;
  className?: string;
}

export function GameCompletionTime({ 
  gameTitle, 
  onCompletionTimeSet,
  className = "" 
}: GameCompletionTimeProps) {
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");

  const commonCompletionTimes = [
    { hours: 8, description: "Indie games, short campaigns" },
    { hours: 15, description: "Most single-player games" },
    { hours: 25, description: "RPGs, open-world games" },
    { hours: 50, description: "JRPGs, massive RPGs" },
    { hours: Infinity, description: "MMOs, live-service games" },
  ];

  const handleQuickSelect = (selectedHours: number) => {
    onCompletionTimeSet(selectedHours);
  };

  const handleCustomSubmit = () => {
    const totalHours = parseInt(hours || "0") + (parseInt(minutes || "0") / 60);
    if (totalHours > 0) {
      onCompletionTimeSet(totalHours);
    }
  };

  const formatTime = (hours: number) => {
    if (hours === Infinity) return "∞";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <GamepadIcon className="h-5 w-5 text-primary" />
          Game Completion Time
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How long did it take you to complete <span className="font-medium">{gameTitle}</span>?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Select</Label>
          <div className="flex flex-wrap gap-2">
            {commonCompletionTimes.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickSelect(option.hours)}
                className="flex items-center justify-center gap-2 px-3 py-2 border rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all group text-xs"
              >
                {formatTime(option.hours)}
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Choose based on typical game length
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Custom Time</Label>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
              <Input
                id="hours"
                type="number"
                placeholder="0"
                min="0"
                max="1000"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                placeholder="0"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="text-center"
              />
            </div>
            <Button 
              onClick={handleCustomSubmit}
              disabled={!hours && !minutes}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Set Time
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          This helps us show where in your playthrough you rated different moments
        </div>
      </CardContent>
    </Card>
  );
}