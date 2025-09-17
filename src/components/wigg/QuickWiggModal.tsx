import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RatingButtons } from '@/components/wigg/RatingButtons';
import { WhyTagSelector, type SpoilerLevel } from '@/components/wigg/WhyTagSelector';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { getTvSeasons, getTvEpisodes } from '@/integrations/tmdb/client';
import { fetchAnimeEpisodes } from '@/integrations/anilist/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer } from 'vaul';

export type QuickWiggVariant = 'dialog' | 'sheet';

export type QuickWiggMedia = {
  id: string;
  title: string;
  type?: 'movie' | 'tv' | 'anime' | 'manga' | 'game' | 'book';
  year?: number | string;
  externalIds?: { tmdb_id?: number; anilist_id?: number };
};

export type QuickWiggEpisode = { id: string; number: number; title: string };
export type QuickWiggSeason = { number: number; title: string; episodes: QuickWiggEpisode[] };
export type QuickWiggUnits = { seasons?: QuickWiggSeason[] };

export type QuickWiggResult = {
  rating?: number;
  tags: string[];
  customTags?: string[];
  spoiler: SpoilerLevel;
  note?: string;
  scope: 'series' | 'season' | 'episode';
  seasonNo?: number;
  episodeNo?: number;
};

export function QuickWiggModal({
  open,
  onOpenChange,
  variant = 'dialog',
  media,
  units,
  onSave,
  footerExtra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: QuickWiggVariant;
  media: QuickWiggMedia | null;
  units?: QuickWiggUnits;
  onSave?: (result: QuickWiggResult) => void;
  footerExtra?: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [note, setNote] = React.useState('');
  const [rating, setRating] = React.useState<number | undefined>();
  const [tags, setTags] = React.useState<string[]>([]);
  const [customTags, setCustomTags] = React.useState<string[]>([]);
  const [spoiler, setSpoiler] = React.useState<SpoilerLevel>('none');

  // Optional lazy load of units when not provided
  const [lazyUnits, setLazyUnits] = React.useState<Units | undefined>(undefined);
  const [unitsLoading, setUnitsLoading] = React.useState(false);
  const [episodesLoading, setEpisodesLoading] = React.useState(false);
  const resolvedUnits = units ?? lazyUnits;

  // Scope + episodic selection
  const isEpisodic = Boolean(
    media && (media.type === 'tv' || media.type === 'anime') && (resolvedUnits?.seasons?.length || media.externalIds?.tmdb_id || media.externalIds?.anilist_id)
  );
  const [scope, setScope] = React.useState<'series' | 'season' | 'episode'>(isEpisodic ? 'episode' : 'series');
  const [seasonNo, setSeasonNo] = React.useState<string>('1');
  const [episodeNo, setEpisodeNo] = React.useState<string>('1');

  React.useEffect(() => {
    if (!isEpisodic) setScope('series');
  }, [isEpisodic]);

  // On open: fetch seasons (TMDB) or episodes (AniList) if none provided
  React.useEffect(() => {
    const fetchSeasonsAndMaybeEpisodes = async () => {
      if (!open || units || lazyUnits || !media) return;
      if (!(media.type === 'tv' || media.type === 'anime')) return;
      try {
        setUnitsLoading(true);
        // Prefer TMDB if available (has seasons)
        if (media.externalIds?.tmdb_id) {
          const seasons = await getTvSeasons(media.externalIds.tmdb_id);
          const mapped = (seasons || [])
            .filter((s: any) => (s.season_number || 0) > 0)
            .map((s: any) => ({ number: s.season_number, title: s.name || `Season ${s.season_number}`, episodes: [] as QuickWiggEpisode[] }));
          if (mapped.length) {
            setLazyUnits({ seasons: mapped });
            // Preload current season episodes
            const sn = parseInt(seasonNo) || mapped[0].number;
            setEpisodesLoading(true);
            const eps = await getTvEpisodes(media.externalIds.tmdb_id, sn);
            const epMapped: QuickWiggEpisode[] = (eps || []).map((e: any) => ({ id: e.id, number: e.episodeNumber || e.ordinal || 0, title: e.title || `Episode ${e.episodeNumber || e.ordinal}` }));
            setLazyUnits({ seasons: mapped.map(s => s.number === sn ? { ...s, episodes: epMapped } : s) });
            setEpisodesLoading(false);
          }
          setUnitsLoading(false);
          return;
        }
        // Fallback: AniList (no seasons, just episodes)
        if (media.externalIds?.anilist_id) {
          setUnitsLoading(true);
          const eps = await fetchAnimeEpisodes(media.externalIds.anilist_id);
          const epMapped: QuickWiggEpisode[] = (eps || []).map((e: any, i: number) => ({ id: e.id || `anilist-ep-${i+1}` , number: e.ordinal || e.episodeNumber || (i+1), title: e.title || `Episode ${i+1}` }));
          setLazyUnits({ seasons: [{ number: 1, title: 'Season 1', episodes: epMapped }] });
          setUnitsLoading(false);
        }
      } catch (err) {
        // Ignore errors; modal remains usable without units
        console.warn('QuickWigg: failed to load units', err);
        setEpisodesLoading(false);
        setUnitsLoading(false);
      }
    };
    fetchSeasonsAndMaybeEpisodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, media?.id]);

  // When season changes, fetch episodes for that season if missing and TMDB available
  React.useEffect(() => {
    const ensureSeasonEpisodes = async () => {
      if (!open || !lazyUnits || !media?.externalIds?.tmdb_id) return;
      const sn = parseInt(seasonNo);
      if (!sn || !(media.type === 'tv' || media.type === 'anime')) return;
      const target = lazyUnits.seasons?.find(s => s.number === sn);
      if (!target || (target.episodes && target.episodes.length)) return;
      try {
        const eps = await getTvEpisodes(media.externalIds.tmdb_id, sn);
        setEpisodesLoading(true);
        const epMapped: QuickWiggEpisode[] = (eps || []).map((e: any, i: number) => ({ id: e.id, number: e.episodeNumber || e.ordinal || (i+1), title: e.title || `Episode ${i+1}` }));
        setLazyUnits({ seasons: (lazyUnits.seasons || []).map(s => s.number === sn ? { ...s, episodes: epMapped } : s) });
        setEpisodesLoading(false);
      } catch (err) {
        console.warn('QuickWigg: failed to load episodes for season', sn, err);
        setEpisodesLoading(false);
      }
    };
    ensureSeasonEpisodes();
  }, [seasonNo, open, lazyUnits, media?.externalIds?.tmdb_id, media?.type]);

  const content = (
    <div className="space-y-4">
      {/* Context preview */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{media?.title ? `Quick add for ${media.title}` : 'Quick Wigg'}</div>
        <div id="barcode-target">
          <PacingBarcode
            titleId={media ? `quick-${media.id}` : 'quick-demo'}
            height={40}
            segmentCount={20}
            segments={[]}
            dataScope="community"
            colorMode="heat"
            interactive={false}
            className="rounded border"
          />
        </div>
      </div>

      {/* Scope + episodic pickers */}
      {isEpisodic && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Label className="text-sm">Scope</Label>
            <div className="flex gap-1">
              {(['series', 'season', 'episode'] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={scope === s ? 'default' : 'outline'}
                  onClick={() => setScope(s)}
                >
                  {s === 'series' ? 'Series' : s === 'season' ? 'Season' : 'Episode'}
                </Button>
              ))}
            </div>
          </div>
          {(scope === 'season' || scope === 'episode') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Season</Label>
                {unitsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-40 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                ) : (
                  <Select value={seasonNo} onValueChange={setSeasonNo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {(resolvedUnits?.seasons || []).map((s) => (
                        <SelectItem key={s.number} value={String(s.number)}>
                          Season {s.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {scope === 'episode' && (
                <div>
                  <Label className="text-xs">Episode</Label>
                  {episodesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-40 rounded-md" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    </div>
                  ) : (
                    <Select value={episodeNo} onValueChange={setEpisodeNo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select episode" />
                      </SelectTrigger>
                      <SelectContent>
                        {(resolvedUnits?.seasons || [])
                          .find((s) => String(s.number) === seasonNo)?.episodes
                          ?.map((e) => (
                            <SelectItem key={e.id} value={String(e.number)}>
                              Episode {e.number}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Quick rating */}
      <div>
        <div className="text-sm font-medium mb-2">Rating</div>
        <RatingButtons value={rating as any} onChange={(v) => setRating(v as number)} />
      </div>

      {/* Why tags */}
      <WhyTagSelector
        loading={unitsLoading || episodesLoading}
        selectedTags={tags}
        onTagsChange={setTags}
        spoilerLevel={spoiler}
        onSpoilerChange={setSpoiler}
        customTags={customTags}
        onCustomTagsChange={setCustomTags}
      />

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-sm">Notes (optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What made this moment work?"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {footerExtra}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          disabled={rating == null}
          onClick={() => {
            onSave?.({
              rating,
              tags,
              customTags,
              spoiler,
              note,
              scope,
              seasonNo: scope !== 'series' ? Number(seasonNo) : undefined,
              episodeNo: scope === 'episode' ? Number(episodeNo) : undefined,
            });
            onOpenChange(false);
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );

  const asSheet = isMobile || variant === 'sheet';
  if (asSheet) {
    if (isMobile) {
      return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[1000] bg-black/80" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1001] h-[85vh] rounded-t-2xl border-t bg-background">
              <div className="mx-auto w-full max-w-xl">
                <div className="mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-muted" />
                <div className="px-4">
                  <div className="pt-1 pb-2">
                    <h2 className="text-base font-semibold">
                      {media ? `Quick Wigg — ${media.title}` : 'Quick Wigg'}
                    </h2>
                  </div>
                  <div className="mt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 56px)' }}>
                    {content}
                  </div>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={`${isMobile ? 'h-[85vh] rounded-t-2xl' : 'sm:max-w-lg'} w-full flex flex-col`}>
          <SheetHeader>
            <SheetTitle>{media ? `Quick Wigg — ${media.title}` : 'Quick Wigg'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto flex-1">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{media ? `Quick Wigg — ${media.title}` : 'Quick Wigg'}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default QuickWiggModal;
