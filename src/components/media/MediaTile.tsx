import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Plus, TrendingUp, Activity, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { useAuth } from '@/hooks/useAuth';
import { formatT2G } from '@/lib/wigg/format';
import { classifyPeakFromSegments, resampleSegments } from '@/lib/wigg/analysis';
import QuickWiggModal, { type QuickWiggVariant, type QuickWiggMedia, type QuickWiggUnits, type QuickWiggResult } from '@/components/wigg/QuickWiggModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MiniGoodnessCurve } from '@/components/wigg/MiniGoodnessCurve';

type Props = {
  title: string;
  imageUrl?: string | null;
  year?: number | string;
  ratingLabel?: string; // e.g., "8.2/10" or "82/100"
  tags?: string[]; // small badges, up to 2-3
  onAdd?: () => void;
  onClick?: () => void;
  className?: string;
  t2gLabelMode?: 'percent' | 'percent+detail';
  // Data needed for WIGG routing
  mediaData?: {
    source: string;
    id: string;
    title: string;
    type: string;
    posterUrl?: string;
    year?: number | string;
    runtime?: number;
  };
  // Quick Wigg prototype integration
  quickWiggEnabled?: boolean; // default: true (prototype)
  quickWiggVariant?: QuickWiggVariant; // default: 'dialog'
  quickWiggUnits?: QuickWiggUnits;
};

export function MediaTile({ title, imageUrl, year, ratingLabel, tags, onAdd, onClick, className, t2gLabelMode = 'percent+detail', mediaData, quickWiggEnabled = true, quickWiggVariant = 'dialog', quickWiggUnits }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const titleKey = useMemo(() => (mediaData ? `${mediaData.source}:${mediaData.id}` : title), [mediaData, title]);
  const { data: progressData } = useTitleProgress(titleKey);

  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('media-tile-data-layer');
  const legacyWiggsData = useUserWiggs(titleKey, { enabled: !useNewDataLayer });
  const newWiggsData = useUserWiggsDataLayer(titleKey, { enabled: useNewDataLayer });
  const { data: wiggsData, addWigg: addWiggLocal } = useNewDataLayer ? newWiggsData : legacyWiggsData;
  const pacingInsight = useMemo(() => classifyPeakFromSegments(progressData?.segments || []).label, [progressData?.segments]);
  const curveValues = useMemo(
    () => resampleSegments(progressData?.segments || [], 16),
    [progressData?.segments]
  );
  const PeakIcon = useMemo(() => {
    switch (pacingInsight) {
      case 'Even pacing':
        return Activity;
      case 'Peak late':
        return Minus;
      default:
        return TrendingUp;
    }
  }, [pacingInsight]);
  const [quickOpen, setQuickOpen] = useState(false);

  const handleAddWigg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check authentication first
    if (!user) {
      navigate('/auth', {
        state: {
          returnTo: window.location.pathname + window.location.search,
          message: 'Sign in to create your first WIGG point',
        },
      });
      return;
    }

    // Prototype: prefer quick modal when enabled
    if (quickWiggEnabled) {
      setQuickOpen(true);
      return;
    }
    // Legacy fallback
    if (mediaData) {
      navigate('/add-wigg', { state: { media: mediaData } });
    } else if (onAdd) onAdd();
  };
  return (
    <>
    <Card 
      className={cn(
        'p-4 bg-card hover:bg-muted/40 border-0 shadow-soft hover:shadow-medium transition-colors duration-200 group h-full relative',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Add WIGG Button */}
      <Button
        onClick={handleAddWigg}
        onPointerDownCapture={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        onMouseDownCapture={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onTouchStartCapture={(e) => {
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
        onDragStart={(e) => {
          e.stopPropagation();
        }}
        draggable={false}
        size="sm"
        className="absolute top-1 right-1 h-8 w-8 rounded-full p-0 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 pointer-events-auto touch-none select-none active:scale-95"
        aria-label="Add WIGG point"
      >
        <Plus className="h-4 w-4" />
      </Button>


      {imageUrl && (
        <div className="aspect-[2/3] mb-3 overflow-hidden rounded-lg bg-muted">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" draggable={false} width="200" height="300" />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <h3 className="font-medium text-foreground leading-tight line-clamp-2 min-h-[2lh]">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {ratingLabel && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span>{ratingLabel}</span>
            </span>
          )}
          {year && <span>{year}</span>}
        </div>
        {/* Compact Goodness Curve */}
        <div className="mt-1">
          <MiniGoodnessCurve
            values={curveValues}
            height={36}
            threshold={2}
            badThreshold={1.5}
            className="rounded"
          />
        </div>
        {/* Pacing insight + T2G */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <div className="inline-flex items-center gap-1">
            <PeakIcon className="h-4 w-4 text-purple-600" data-testid="peak-icon" />
          </div>
          {wiggsData?.t2gEstimatePct != null && (
            <div className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 text-primary" fill="currentColor" />
              <span>
                Gets good {
                  t2gLabelMode === 'percent'
                    ? `${wiggsData.t2gEstimatePct.toFixed(0)}%`
                    : formatT2G(
                        wiggsData.t2gEstimatePct,
                        typeof mediaData?.runtime === 'number' ? Number(mediaData.runtime) : undefined,
                        mediaData?.type
                      )
                }
              </span>
            </div>
          )}
        </div>
        {!!(tags && tags.length) && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
    {quickWiggEnabled && (
      <QuickWiggModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        variant={quickWiggVariant}
        media={(() => {
          if (mediaData) {
            const externalIds: any = {};
            if (mediaData.source?.startsWith('tmdb')) externalIds.tmdb_id = Number(mediaData.id);
            if (mediaData.source === 'anilist') externalIds.anilist_id = Number(mediaData.id);
            return {
              id: `${mediaData.source}:${mediaData.id}`,
              title: mediaData.title,
              type: mediaData.type as QuickWiggMedia['type'],
              year: mediaData.year,
              externalIds,
            } as QuickWiggMedia;
          }
          return { id: titleKey, title } as QuickWiggMedia;
        })()}
        units={quickWiggUnits}
        onSave={async (res: QuickWiggResult) => {
          try {
            if (!mediaData) return;
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (!userId) {
              navigate('/add-wigg', { state: { media: mediaData } });
              return;
            }

            // Upsert media and get DB id
            const mapType = (t?: string): 'movie' | 'tv' | 'anime' | 'game' | 'book' | 'podcast' => {
              const v = (t || '').toLowerCase();
              if (v === 'tv' || v === 'tmdb-tv') return 'tv';
              if (v === 'anime') return 'anime';
              if (v === 'game') return 'game';
              if (v === 'book' || v === 'manga') return 'book';
              if (v === 'podcast') return 'podcast';
              return 'movie';
            };
            const extIds: Record<string, any> = {};
            if (mediaData.source?.startsWith('tmdb')) extIds.tmdb_id = Number(mediaData.id);
            if (mediaData.source === 'anilist') extIds.anilist_id = Number(mediaData.id);
            if (mediaData.source === 'openlibrary') extIds.openlibrary_id = String(mediaData.id);
            if (mediaData.source === 'podcastindex') extIds.podcast_guid = String(mediaData.id);

            const { data: mediaId, error: upsertErr } = await supabase.rpc('upsert_media', {
              p_type: mapType(mediaData.type),
              p_title: mediaData.title,
              p_year: typeof mediaData.year === 'string' ? parseInt(mediaData.year) || null : (mediaData.year as any) ?? null,
              p_duration_sec: typeof mediaData.runtime === 'number' ? Number(mediaData.runtime) : null,
              p_pages: null,
              p_external_ids: extIds,
            });
            if (upsertErr) throw upsertErr;

            // Compute position percent across the series when episodic
            const seasons = quickWiggUnits?.seasons || [];
            const totalEps = seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
            let pct = 50; // default midpoint
            if (totalEps > 0) {
              if (res.scope === 'episode' && res.seasonNo && res.episodeNo) {
                const prevCount = seasons
                  .filter((s) => s.number < res.seasonNo!)
                  .reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
                const ordinal = prevCount + res.episodeNo;
                pct = Math.round((ordinal / totalEps) * 100);
              } else if (res.scope === 'season' && res.seasonNo) {
                const prevCount = seasons
                  .filter((s) => s.number < res.seasonNo!)
                  .reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
                const thisLen = seasons.find((s) => s.number === res.seasonNo)?.episodes?.length || 0;
                const mid = prevCount + thisLen / 2;
                pct = Math.round((mid / totalEps) * 100);
              } else {
                // series scope
                pct = 50;
              }
            }

            const spoilerMap: Record<string, '0' | '1' | '2'> = { none: '0', light: '1', heavy: '2' } as const;
            const p_spoiler = spoilerMap[(res as any).spoiler] || '0';
            const allTags = Array.from(
              new Set([
                ...(res.tags || []),
                ...((res.customTags as string[]) || []),
                typeof res.rating === 'number' ? `rating_${res.rating}` : undefined,
              ].filter(Boolean) as string[])
            );

            const { error: addErr } = await supabase.rpc('add_wigg', {
              p_media_id: mediaId as string,
              p_episode_id: null as any,
              p_user_id: userId,
              p_pos_kind: 'percent',
              p_pos_value: pct,
              p_span_start: null,
              p_span_end: null,
              p_tags: allTags,
              p_reason_short: (res.note || '').slice(0, 140) || null,
              p_spoiler,
            } as any);

            if (addErr) throw addErr;
            // Update local UI approximation
            try { await addWiggLocal?.(pct, res.note, res.rating); } catch {}
            toast({ title: 'Saved', description: 'Your Wigg has been added.' });
          } catch (err) {
            console.error('Quick add failed', err);
            toast({ title: 'Save failed', description: 'Could not add Wigg. Try Full Add.', variant: 'destructive' });
          }
        }}
        footerExtra={
          mediaData ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                setQuickOpen(false);
                navigate('/add-wigg', { state: { media: mediaData } });
              }}
            >
              Full Add
            </Button>
          ) : null
        }
      />
    )}
    </>
  );
}

export default MediaTile;
