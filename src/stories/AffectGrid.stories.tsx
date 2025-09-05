import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AffectGrid, type AffectGridValue } from '@/components/wigg/AffectGrid';
import { Card, CardContent } from '@/components/ui/card';

const meta: Meta<typeof AffectGrid> = {
  title: 'Wigg/Rating System/Affect Grid',
  component: AffectGrid,
  parameters: {
    layout: 'centered',
    docs: { description: { component: '2D rating pad: X=goodness (meh→peak), Y=energy (calm→hype). Adds optional confidence dots.' } },
  },
};

export default meta;

type Story = StoryObj<typeof AffectGrid>;

export const Default: Story = {
  render: () => {
    const [val, setVal] = useState<AffectGridValue>({ quality: 0.6, energy: 0.4, confidence: 'med' });
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <AffectGrid value={val} onChange={setVal} />
          <div className="text-xs text-muted-foreground text-center">Move finger/cursor · Tap dots to set confidence</div>
        </CardContent>
      </Card>
    );
  },
};

export const Discrete: Story = {
  args: { discrete: true },
  render: (args) => {
    const [val, setVal] = useState<AffectGridValue>({ quality: 0.2, energy: 0.8, confidence: 'med' });
    return (
      <AffectGrid {...args} value={val} onChange={setVal} />
    );
  },
};

