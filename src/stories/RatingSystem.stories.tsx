import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { RatingButtons } from '@/components/wigg/RatingButtons';
import { RatingDial } from '@/components/wigg/RatingDial';
import { RatingSlider } from '@/components/wigg/RatingSlider';
import { SwipeRating, type SwipeValue, type Unit } from '@/components/wigg/SwipeRating';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const meta: Meta = {
  title: 'Wigg/Rating System',
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
    docs: { description: { component: 'Creative explorations for the 4-level rating system (zzz, good, better, peak). All options are touch-friendly and accessible.' } },
  },
};

export default meta;

type Story = StoryObj;

export const CompactButtons: Story = {
  render: function Story() {
    const [value, setValue] = useState<SwipeValue | null>(1);
    return (
      <Card className="w-[360px]">
        <CardContent className="p-4 space-y-3">
          <div className="text-sm text-muted-foreground">Compact grid buttons (as used in AddWigg retro):</div>
          <RatingButtons value={value ?? undefined} onChange={setValue} size="compact" />
          <div className="text-xs text-center text-muted-foreground">Selected: {value ?? 'none'}</div>
        </CardContent>
      </Card>
    );
  },
};

export const SwipeCard: Story = {
  render: function Story() {
    const unit: Unit = { id: '1', title: 'Episode 1 · The Beginning', ordinal: 1, subtype: 'episode', runtimeSec: 1420 };
    const [last, setLast] = useState<SwipeValue | null>(null);
    return (
      <div className="space-y-3 w-[380px]">
        <SwipeRating
          unit={unit}
          onSwiped={(_, v) => setLast(v)}
        />
        <div className="text-xs text-muted-foreground text-center">Swipe or use A S D F · Last: {last ?? '—'}</div>
      </div>
    );
  },
};

export const RadialDial: Story = {
  render: function Story() {
    const [value, setValue] = useState<SwipeValue>(2);
    return (
      <div className="space-y-3">
        <RatingDial value={value} onChange={setValue} />
        <div className="text-xs text-center text-muted-foreground">Tap segments · Selected: {value}</div>
      </div>
    );
  },
};

export const VerticalSlider: Story = {
  render: function Story() {
    const [value, setValue] = useState<SwipeValue>(1);
    return (
      <div className="space-y-4 flex items-center gap-6">
        <RatingSlider value={value} onChange={setValue} />
        <div className="text-xs text-muted-foreground">One‑handed vertical slider</div>
      </div>
    );
  },
};

export const MixedPanel: Story = {
  render: function Story() {
    const [value, setValue] = useState<SwipeValue>(1);
    return (
      <Card className="w-[380px]">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Episode 3 · The Twist</div>
            <Badge variant="secondary" className="text-xs">LIVE</Badge>
          </div>
          <RatingDial value={value} onChange={setValue} />
          <RatingButtons value={value} onChange={setValue} size="regular" />
          <div className="text-xs text-muted-foreground text-center">Dial for coarse · Buttons for confirm</div>
        </CardContent>
      </Card>
    );
  },
};

