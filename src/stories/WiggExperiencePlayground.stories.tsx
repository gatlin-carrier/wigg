import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo, useState } from 'react';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { useFeatureFlag } from '@/lib/featureFlags';
import { useMilestones } from '@/hooks/useMilestones';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { LollipopStrip } from '@/components/wigg/LollipopStrip';
import { MilestonePath } from '@/components/wigg/MilestonePath';
import { StoryRail } from '@/components/wigg/StoryRail';
import { ActPager } from '@/components/wigg/ActPager';
import { RealtimeWiggOverlay } from '@/components/wigg/RealtimeWiggOverlay';
import { ContextChips, type ContextChip } from '@/components/wigg/ContextChips';
import { NoteComposer } from '@/components/wigg/NoteComposer';
import { RatingButtons } from '@/components/wigg/RatingButtons';
import { RatingDial } from '@/components/wigg/RatingDial';
import { RatingSlider } from '@/components/wigg/RatingSlider';
import { SwipeRating, type Unit } from '@/components/wigg/SwipeRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type GraphVariant = 'barcode' | 'lollipop' | 'milestones' | 'storyRail' | 'actPager';
type RatingVariant = 'buttons' | 'dial' | 'slider' | 'grid' | 'swipe';
type Viewport = 'mobile' | 'tablet' | 'desktop';

const meta: Meta = {
  title: 'Wigg/Playground/Experience Builder',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

const CONTEXT_OPTIONS: ContextChip[] = [
  { id: 'pacing', label: 'Pacing', emoji: '⏩' },
  { id: 'world', label: 'World opens', emoji: '🗺️' },
  { id: 'twist', label: 'Plot twist', emoji: '🤯' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'art', label: 'Art spike', emoji: '🎨' },
  { id: 'boss', label: 'Boss', emoji: '👹' },
];

export const ExperienceBuilder: Story = {
  render: function Story() {
    const titleId = 'playground-title';
    const { data: progress } = useTitleProgress(titleId);
    // Feature flag for data layer coexistence
    const useNewDataLayer = useFeatureFlag('wigg-experience-playground-data-layer');
    const legacyWiggsData = useUserWiggs(titleId, { enabled: !useNewDataLayer });
    const newWiggsData = useUserWiggsDataLayer(titleId, { enabled: useNewDataLayer });
    const { data: wiggs } = useNewDataLayer ? newWiggsData : legacyWiggsData;
    const { data: milestones } = useMilestones(titleId);

    const [viewport, setViewport] = useState<Viewport>('mobile');
    const [graph, setGraph] = useState<GraphVariant>('barcode');
    const [rating, setRating] = useState<RatingVariant>('buttons');
    const [editGraph, setEditGraph] = useState(false);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [tags, setTags] = useState<string[]>(['world']);
    const [note, setNote] = useState('');
    const [lastSwipe, setLastSwipe] = useState<number | null>(null);
    const [sliderValue, setSliderValue] = useState<number>(2);

    const widths: Record<Viewport, number> = { mobile: 390, tablet: 768, desktop: 1200 };
    const width = widths[viewport];

    const segmentScores = useMemo(() => {
      return (progress?.segments || []).map(s => ({ pct: (s.startPct + s.endPct) / 2, score: s.userScore || s.meanScore || 2 }));
    }, [progress?.segments]);

    const unit: Unit = { id: 'u1', title: 'Episode 1 · The Beginning', ordinal: 1, subtype: 'episode', runtimeSec: 1420 };

    const renderGraph = () => {
      switch (graph) {
        case 'barcode':
          return (
            <PacingBarcode
              titleId={titleId}
              height={60}
              segmentCount={viewport === 'mobile' ? 20 : 30}
              segments={progress?.segments || []}
              t2gEstimatePct={wiggs?.t2gEstimatePct}
              interactive={!editGraph}
              editable={editGraph}
              showFisheye={true}
              suppressGlobalListeners={true}
              suppressHaptics={true}
            />
          );
        case 'lollipop':
          return (
            <LollipopStrip
              titleId={titleId}
              segments={progress?.segments || []}
              t2gEstimatePct={wiggs?.t2gEstimatePct}
              interactive={false}
            />
          );
        case 'milestones':
          return (
            <MilestonePath
              titleId={titleId}
              milestones={milestones?.items || []}
              segmentScores={segmentScores}
            />
          );
        case 'storyRail':
          return (
            <StoryRail
              titleId={titleId}
              milestones={milestones?.items || []}
              currentPct={25}
              t2gEstimatePct={wiggs?.t2gEstimatePct}
            />
          );
        case 'actPager':
          return (
            <ActPager
              titleId={titleId}
              milestones={milestones?.items || []}
              segments={progress?.segments || []}
            />
          );
      }
    };

    const renderRating = () => {
      switch (rating) {
        case 'buttons':
          return <RatingButtons onChange={(v) => setLastSwipe(v)} />;
        case 'dial':
          return <RatingDial onChange={(v) => setLastSwipe(v)} />;
        case 'slider':
          return <RatingSlider onChange={(v) => setLastSwipe(v)} />;
        case 'grid':
          return (
            <div className="flex items-center justify-center">
              {/* AffectGrid is imported in other stories; reuse NoteComposer + Context instead here */}
              <div className="text-xs text-muted-foreground">Use Affect Grid story for details; choose other rating here.</div>
            </div>
          );
        case 'swipe':
          return (
            <div className="max-w-full">
              <SwipeRating unit={unit} onSwiped={(_, v) => setLastSwipe(v)} />
            </div>
          );
      }
    };

    return (
      <div className="p-4 space-y-4">
        {/* Configurator */}
        <Card>
          <CardContent className="p-3 grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Viewport</div>
              <div className="flex gap-2">
                {(['mobile','tablet','desktop'] as Viewport[]).map(v => (
                  <Button key={v} size="sm" variant={viewport === v ? 'default' : 'outline'} onClick={() => setViewport(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Graph</div>
              <div className="flex flex-wrap gap-2">
                {(['barcode','lollipop','milestones','storyRail','actPager'] as GraphVariant[]).map(g => (
                  <Button key={g} size="sm" variant={graph === g ? 'default' : 'outline'} onClick={() => setGraph(g)}>
                    {g}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="flex flex-wrap gap-2">
                {(['buttons','dial','slider','swipe'] as RatingVariant[]).map(r => (
                  <Button key={r} size="sm" variant={rating === r ? 'default' : 'outline'} onClick={() => setRating(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tools</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={editGraph ? 'default' : 'outline'} onClick={() => setEditGraph(x => !x)}>Edit Graph</Button>
                <Button size="sm" variant="outline" onClick={() => setOverlayOpen(true)}>Open Overlay</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <div className="mx-auto" style={{ width }}>
          {/* Header title + graph */}
          <Card className="mb-3">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Infinity Quest</div>
                  <div className="text-xs text-muted-foreground">Long-form action adventure · 2024</div>
                </div>
                <div className="text-xs text-muted-foreground">T2G {wiggs?.t2gEstimatePct?.toFixed(0) ?? '—'}%</div>
              </div>
              {renderGraph()}
            </CardContent>
          </Card>

          {/* Rating + Context */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {rating === 'slider' ? (
                <div className="space-y-4">
                  {/* Slider */}
                  <div>
                    <RatingSlider
                      orientation="horizontal"
                      showIcons
                      scale={5}
                      value={sliderValue}
                      onChange={(v) => { setSliderValue(v); setLastSwipe(v); }}
                    />
                  </div>
                  {/* Notes directly under slider */}
                  <div>
                    <div className="text-sm font-medium mb-2">Notes</div>
                    <NoteComposer value={note} onChange={setNote} />
                  </div>
                  {/* Context chips */}
                  <div>
                    <div className="text-sm font-medium mb-2">Add context</div>
                    <ContextChips options={CONTEXT_OPTIONS} selected={tags} onChange={setTags} />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm font-medium mb-2">Rate this moment</div>
                    {/* Use horizontal slider with icons when slider mode is chosen elsewhere */}
                    {rating === 'slider' ? (
                      <RatingSlider
                        orientation="horizontal"
                        showIcons
                        scale={5}
                        value={sliderValue}
                        onChange={(v) => { setSliderValue(v); setLastSwipe(v); }}
                      />
                    ) : (
                      renderRating()
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Last: {lastSwipe ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Add context</div>
                    <ContextChips options={CONTEXT_OPTIONS} selected={tags} onChange={setTags} />
                  </div>
                  <div>
                    <NoteComposer value={note} onChange={setNote} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overlay (safe for Storybook) */}
        <RealtimeWiggOverlay
          titleId={titleId}
          titleName={'Infinity Quest'}
          isOpen={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          mediaType={'game'}
          estimatedTotalMinutes={1800}
          storybookSafe
        />
      </div>
    );
  },
};
