import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Pause, TimerReset } from "lucide-react";

export interface MediaPlayerControls {
  getTime: () => number;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  seekBy?: (delta: number) => void;
  seekTo?: (seconds: number) => void;
}

interface MediaPlayerProps {
  onReady: (controls: MediaPlayerControls) => void;
  initialVideoId?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

function secondsToClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`;
}

export function YouTubePlayer({ onReady, initialVideoId = "M7lc1UVf-VE" }: MediaPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [videoId, setVideoId] = useState<string>(initialVideoId);

  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const createPlayer = () => {
      if (!containerRef.current) return;
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
      }
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "270",
        width: "480",
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            const controls: MediaPlayerControls = {
              getTime: () => Number(playerRef.current?.getCurrentTime?.() || 0),
              play: () => playerRef.current?.playVideo?.(),
              pause: () => playerRef.current?.pauseVideo?.(),
              isPlaying: () => playerRef.current?.getPlayerState?.() === 1,
              seekBy: (delta: number) => {
                const currentTime = Number(playerRef.current?.getCurrentTime?.() || 0) + delta;
                playerRef.current?.seekTo?.(Math.max(0, currentTime), true);
              },
              seekTo: (seconds: number) => playerRef.current?.seekTo?.(Math.max(0, seconds), true),
            };
            onReady(controls);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [videoId, onReady]);

  const getCurrentTime = () => Number(playerRef.current?.getCurrentTime?.() || 0);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Playback (YouTube demo)</CardTitle>
        <CardDescription className="text-xs">
          Official IFrame Player API; Moment Tool reads time from here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Label className="text-xs">Video ID</Label>
          <Input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="max-w-[220px]"
            placeholder="YouTube video ID"
          />
        </div>
        
        <div className="w-full flex justify-center">
          <div className="rounded-xl overflow-hidden border" style={{ width: 480 }}>
            <div ref={containerRef} />
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => playerRef.current?.playVideo?.()}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => playerRef.current?.pauseVideo?.()}
          >
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => playerRef.current?.seekTo?.(0, true)}
          >
            <TimerReset className="h-4 w-4 mr-1" />
            Restart
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (playerRef.current) {
                playerRef.current.seekTo(Math.max(0, getCurrentTime() - 5), true);
              }
            }}
          >
            -5s
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (playerRef.current) {
                playerRef.current.seekTo(getCurrentTime() + 5, true);
              }
            }}
          >
            +5s
          </Button>
          <div className="ml-auto text-xs font-mono">
            {secondsToClock(getCurrentTime())}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}