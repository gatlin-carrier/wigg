import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useLiveCapture } from '@/hooks/useLiveCapture';
import { Star, Clock, TrendingUp } from 'lucide-react';

import { RealtimeGoodnessCurve } from './RealtimeGoodnessCurve';

export interface RealtimeWiggOverlayProps {
  titleId: string;
  titleName?: string;
  isOpen: boolean;
  onClose: () => void;
  mediaType?: 'movie' | 'tv' | 'game' | 'book' | 'manga';
  estimatedTotalMinutes?: number;
}

export function RealtimeWiggOverlay({
  titleId,
  titleName = 'Title',
  isOpen,
  onClose,
  mediaType = 'game',
  estimatedTotalMinutes,
}: RealtimeWiggOverlayProps) {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  
  const { toast } = useToast();
  const { data: progressData } = useTitleProgress(titleId);
  const { data: wiggsData, addWigg } = useUserWiggs(titleId);
  const { data: liveData, markWigg, setCurrentPct } = useLiveCapture();

  // Format time display based on media type
  const formatCurrentTime = useCallback((pct: number): string => {
    if (!estimatedTotalMinutes) return `${pct.toFixed(1)}%`;

    const currentMinutes = (pct / 100) * estimatedTotalMinutes;
    
    switch (mediaType) {
      case 'game': {
        const hours = Math.floor(currentMinutes / 60);
        const mins = Math.round(currentMinutes % 60);
        return `${hours}h ${mins}m`;
      }
      case 'book':
      case 'manga': {
        const pages = Math.round(currentMinutes); // estimatedTotalMinutes represents pages for books
        return `Page ${pages}`;
      }
      default: {
        if (currentMinutes < 60) return `${Math.round(currentMinutes)}m`;
        const hrs = Math.floor(currentMinutes / 60);
        const minutes = Math.round(currentMinutes % 60);
        return minutes === 0 ? `${hrs}h` : `${hrs}h ${minutes}m`;
      }
    }
  }, [estimatedTotalMinutes, mediaType]);

  // Calculate T2G confidence based on variance in recent segments
  const getT2GConfidence = (): { level: 'low' | 'medium' | 'high'; variance: number } => {
    if (!progressData?.segments || !wiggsData?.t2gEstimatePct) {
      return { level: 'low', variance: 1 };
    }

    const recentSegments = progressData.segments.slice(-10);
    const scores = recentSegments
      .map(s => s.userScore || s.meanScore)
      .filter(Boolean) as number[];

    if (scores.length < 3) return { level: 'low', variance: 1 };

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;

    if (variance < 0.5) return { level: 'high', variance };
    if (variance < 1.2) return { level: 'medium', variance };
    return { level: 'low', variance };
  };

  const handleMarkWigg = useCallback(async () => {
    setIsMarking(true);
    try {
      const currentPct = liveData.currentPct;
      await markWigg(currentPct, note || undefined);
      
      // Also add to user wiggs if note provided or for persistence
      if (note || Math.random() > 0.5) { // Mock: sometimes add to persistent storage
        await addWigg(currentPct, note || undefined, 2); // Default to "better" rating
      }

      toast({
        title: 'WIGG marked!',
        description: `Marked at ${currentPct.toFixed(1)}% • ${formatCurrentTime(currentPct)}`,
        duration: 2000
      });

      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      toast({
        title: 'Failed to mark WIGG',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsMarking(false);
    }
  }, [liveData.currentPct, markWigg, note, addWigg, toast, formatCurrentTime]);

  const handleScrub = useCallback((pct: number) => {
    setCurrentPct(pct);
  }, [setCurrentPct]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        handleMarkWigg();
      } else if (event.key === ' ' && !showNoteInput) {
        event.preventDefault();
        handleMarkWigg();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleMarkWigg, showNoteInput]);

  const confidence = getT2GConfidence();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[600px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <span className="truncate">{titleName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="ml-2">
                Live Capture
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col space-y-6 py-4 min-h-0">
          {/* Current Progress */}
          <div className="flex-shrink-0 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {liveData.currentPct.toFixed(1)}%
              </span>
              {estimatedTotalMinutes && (
                <span className="text-muted-foreground">
                  • {formatCurrentTime(liveData.currentPct)}
                </span>
              )}
            </div>
            
            {wiggsData?.t2gEstimatePct && (
              <div className="flex items-center justify-center gap-2">
                <Star className="h-3 w-3 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Gets good around {wiggsData.t2gEstimatePct.toFixed(1)}%
                </span>
                <Badge 
                  variant={confidence.level === 'high' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {confidence.level === 'high' ? 'High confidence' : 
                   confidence.level === 'medium' ? 'Medium confidence' : 'Estimated'}
                </Badge>
              </div>
            )}
          </div>

          {/* Interactive Goodness Curve */}
          <div className="flex-shrink-0 px-4">
            <RealtimeGoodnessCurve
              segments={progressData?.segments}
              segmentCount={Math.min(30, Math.max(18, Math.floor(window.innerWidth / 18)))}
              height={96}
              currentPct={liveData.currentPct}
              t2gEstimatePct={wiggsData?.t2gEstimatePct}
              onScrub={handleScrub}
              onScrubEnd={handleScrub}
            />
            <div className="text-xs text-center text-muted-foreground mt-2">
              Drag across the curve to scrub • Press Enter to mark at current position
            </div>
          </div>

          {/* Mark WIGG Button */}
          <div className="flex-shrink-0 px-4 space-y-4">
            <Button
              onClick={handleMarkWigg}
              disabled={isMarking}
              size="lg"
              className="w-full h-14 text-lg font-semibold"
            >
              {isMarking ? (
                'Marking...'
              ) : (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Mark WIGG
                  <span className="text-sm opacity-80">
                    ({liveData.currentPct.toFixed(1)}%)
                  </span>
                </div>
              )}
            </Button>

          </div>

          {/* Recent Activity */}
          <div className="flex-1 min-h-0 px-4">
            <div className="h-full overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Recent Activity
                </div>
                
                {wiggsData?.entries?.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {entry.pct.toFixed(1)}%
                        </span>
                        {estimatedTotalMinutes && (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrentTime(entry.pct)}
                          </span>
                        )}
                      </div>
                      {entry.note && (
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}

                {(!wiggsData?.entries || wiggsData.entries.length === 0) && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No WIGGs marked yet. Start by marking your first moment!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Context Box & Quick Note */}
          <div className="flex-shrink-0 px-4 space-y-4 border-t pt-4">
            {/* Context/Keyboard Shortcuts */}
            <div className="text-xs text-center text-muted-foreground bg-muted/30 rounded-lg p-3">
              Space or Cmd+Enter to mark • Drag the curve to adjust position
            </div>

            {/* Quick Note Toggle */}
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-muted-foreground"
              >
                {showNoteInput ? 'Hide note' : 'Add note'}
              </Button>
            </div>

            {/* Optional Note Input */}
            {showNoteInput && (
              <div className="space-y-2">
                <Label htmlFor="wigg-note" className="text-sm">
                  Quick note (optional)
                </Label>
                <Input
                  id="wigg-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Why is this moment good? (e.g., 'Great boss fight', 'Plot twist')"
                  maxLength={140}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleMarkWigg();
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {note.length}/140
                </div>
              </div>
            )}
          </div>
          
          {/* Live announcements for screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {`Current progress ${liveData.currentPct.toFixed(1)} percent.`}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
