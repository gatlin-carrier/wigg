import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Play,
  Pause,
  TimerReset,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { WhyTagSelector, type SpoilerLevel } from "./WhyTagSelector";
import { type Unit } from "./SwipeRating";
import { type MediaPlayerControls } from "./MediaPlayer";

export type MediaType = "tv" | "anime" | "book" | "manga" | "webtoon" | "podcast";

export type Moment = {
  id: string;
  unitId: string;
  anchorType: "timestamp" | "page" | "panel";
  anchorValue: number;
  whyTags: string[];
  spoilerLevel: SpoilerLevel;
  notes?: string;
};

interface MomentCaptureProps {
  mediaType: MediaType;
  unit: Unit | null;
  onAddMoment: (moment: Moment) => void;
  externalPlayer?: MediaPlayerControls | null;
  className?: string;
}

function secondsToClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`;
}

export function MomentCapture({
  mediaType,
  unit,
  onAddMoment,
  externalPlayer,
  className = "",
}: MomentCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [seconds, setSeconds] = useState(60);
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [spoilerLevel, setSpoilerLevel] = useState<SpoilerLevel>("none");
  
  const timerRef = useRef<number | null>(null);
  const isTimedMedia = mediaType === "tv" || mediaType === "anime" || mediaType === "podcast";

  useEffect(() => {
    if (!isOpen || !isTimedMedia) return;

    if (externalPlayer) {
      timerRef.current = window.setInterval(() => {
        try {
          const time = externalPlayer.getTime?.();
          if (typeof time === "number" && !Number.isNaN(time)) {
            setSeconds(time);
          }
        } catch {}
      }, 250);
    } else if (isPlaying) {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isOpen, isTimedMedia, isPlaying, externalPlayer]);

  const togglePlay = () => {
    if (externalPlayer) {
      const nowPlaying = externalPlayer.isPlaying?.();
      if (nowPlaying) {
        externalPlayer.pause?.();
      } else {
        externalPlayer.play?.();
      }
      setIsPlaying(!nowPlaying);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const nudgeTime = (delta: number) => {
    if (externalPlayer && externalPlayer.seekBy) {
      externalPlayer.seekBy(delta);
    } else {
      setSeconds((s) => Math.max(0, s + delta));
    }
  };

  const saveMoment = () => {
    if (!unit) return;
    
    const anchorValue = isTimedMedia
      ? (externalPlayer ? Math.floor(externalPlayer.getTime?.() || 0) : seconds)
      : page;

    const moment: Moment = {
      id: Math.random().toString(36).slice(2),
      unitId: unit.id,
      anchorType: isTimedMedia ? "timestamp" : "page",
      anchorValue,
      whyTags: selectedTags,
      spoilerLevel,
      notes: notes || undefined,
    };
    
    onAddMoment(moment);
    
    // Reset form
    setSelectedTags([]);
    setNotes("");
    setSpoilerLevel("none");
    setIsOpen(false);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-30 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? (
            <Minimize2 className="h-4 w-4 mr-1" />
          ) : (
            <Maximize2 className="h-4 w-4 mr-1" />
          )}
          {isOpen ? "Hide Moment Tool" : "Moment Tool"}
        </Button>
        <Button
          className="rounded-full"
          onClick={saveMoment}
          disabled={!isOpen || !unit}
        >
          <BookmarkPlus className="h-4 w-4 mr-1" />
          Mark
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-[min(420px,92vw)]"
          >
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Drop a moment on{" "}
                  <span className="font-semibold">
                    {unit?.title ?? "(choose a unit)"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Hold to mark in video mode, or use the page picker in reading mode.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isTimedMedia ? (
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="secondary" onClick={togglePlay}>
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="font-mono text-xl tracking-wider">
                      {secondsToClock(seconds)}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (externalPlayer?.seekTo) {
                          externalPlayer.seekTo(0);
                        } else {
                          setSeconds(0);
                        }
                      }}
                    >
                      <TimerReset className="h-4 w-4" />
                    </Button>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => nudgeTime(-5)}
                      >
                        -5s
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => nudgeTime(5)}
                      >
                        +5s
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Page</Label>
                      <Input
                        value={page}
                        onChange={(e) =>
                          setPage(Math.max(1, parseInt(e.target.value || "1")))
                        }
                        className="w-16 text-center"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <WhyTagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  spoilerLevel={spoilerLevel}
                  onSpoilerChange={setSpoilerLevel}
                />

                <div>
                  <Label className="text-xs">Notes (≤ 120 chars, optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 120))}
                    placeholder="Add a short note or quote…"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={saveMoment}>
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    Save moment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}