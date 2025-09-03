import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";
import { type SwipeValue } from "./SwipeRating";

interface TimeBasedRatingProps {
  mediaType: "movie" | "game";
  mediaTitle: string;
  onRatingSubmit: (hours: number, minutes: number, rating: SwipeValue, comment?: string) => void;
  className?: string;
}

export function TimeBasedRating({ 
  mediaType, 
  mediaTitle, 
  onRatingSubmit, 
  className = "" 
}: TimeBasedRatingProps) {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [rating, setRating] = useState<SwipeValue | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating !== null) {
      onRatingSubmit(hours, minutes, rating, comment);
      setSubmitted(true);
    }
  };

  const getRatingData = (value: SwipeValue) => {
    switch (value) {
      case 0: return { label: "Never Gets Good", color: "#94A3B8", emoji: "😴" };
      case 1: return { label: "Eventually Gets Good", color: "#F59E0B", emoji: "🌱" };
      case 2: return { label: "Gets Really Good", color: "#3B82F6", emoji: "⚡" };
      case 3: return { label: "Peak Experience", color: "#EF4444", emoji: "🔥" };
    }
  };

  if (submitted) {
    return (
      <Card className={`rounded-2xl shadow-sm w-full ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rating Submitted!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Thanks for sharing when {mediaTitle} gets good
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSubmitted(false)}
            className="w-full sm:w-auto"
          >
            Rate Another Time Point
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-2xl shadow-sm w-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          When does {mediaTitle} get good?
        </CardTitle>
        <CardDescription className="text-xs">
          Mark the time when you felt the {mediaType} really picked up and became engaging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Time Point</Label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="100"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="text-center"
                placeholder="0"
              />
            </div>
            <div className="text-muted-foreground">:</div>
            <div className="flex-1">
              <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.min(59, parseInt(e.target.value) || 0))}
                className="text-center"
                placeholder="00"
              />
            </div>
          </div>
          {(hours > 0 || minutes > 0) && (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {hours}h {minutes.toString().padStart(2, '0')}m
              </Badge>
            </div>
          )}
        </div>

        {/* Rating Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">How good does it get?</Label>
          <div className="grid grid-cols-2 gap-2">
            {([0, 1, 2, 3] as SwipeValue[]).map((value) => {
              const ratingData = getRatingData(value);
              return (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    rating === value 
                      ? "border-primary bg-primary/10 scale-105" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg mb-1">{ratingData.emoji}</div>
                  <div className="text-xs font-medium">{ratingData.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            Quick note (optional)
          </Label>
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., 'After the tutorial ends' or 'When the mystery kicks in'"
            className="text-sm"
            maxLength={100}
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={rating === null}
          className="w-full"
          size="lg"
        >
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}