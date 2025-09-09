import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const meta: Meta<typeof PacingBarcode> = {
  title: 'Wigg/PacingBarcode',
  component: PacingBarcode,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    height: { control: 'number' },
    segmentCount: { control: 'number' },
    interactive: { control: 'boolean' },
    t2gEstimatePct: { control: 'number' },
    currentPct: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof PacingBarcode>;

// Mock segments data
const mockSegments = Array.from({ length: 20 }, (_, i) => ({
  startPct: (i / 20) * 100,
  endPct: ((i + 1) / 20) * 100,
  meanScore: Math.random() * 4, // 0-4 scale
  userScore: Math.random() > 0.7 ? Math.random() * 4 : undefined,
}));

// Game that starts slow but gets great
const slowStartSegments = Array.from({ length: 20 }, (_, i) => {
  const position = i / 19;
  let score: number;
  
  if (position < 0.3) {
    score = 0.5 + Math.random() * 1; // 0.5-1.5 early
  } else if (position < 0.6) {
    score = 1.5 + Math.random() * 1.5 + (position - 0.3) * 3; // Rising
  } else {
    score = 3 + Math.random() * 1; // 3-4 late
  }

  return {
    startPct: (i / 20) * 100,
    endPct: ((i + 1) / 20) * 100,
    meanScore: Math.min(4, score),
  };
});

export const Default: Story = {
  args: {
    titleId: 'game-123',
    height: 60,
    segmentCount: 20,
    segments: mockSegments,
    t2gEstimatePct: 35,
    interactive: false,
  },
};

export const Interactive: Story = {
  args: {
    titleId: 'game-456',
    height: 60,
    segmentCount: 25,
    segments: mockSegments,
    t2gEstimatePct: 42,
    currentPct: 25,
    interactive: true,
  },
};

export const SlowStart: Story = {
  args: {
    titleId: 'game-789',
    height: 60,
    segments: slowStartSegments,
    t2gEstimatePct: 58,
  },
  parameters: {
    docs: {
      description: {
        story: 'A game that starts slow but becomes excellent later - classic "gets good" pattern',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    titleId: 'game-empty',
    height: 32,
    segments: [],
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with no data available',
      },
    },
  },
};

export const Card: Story = {
  args: {
    titleId: 'card-example',
    height: 60,
    segmentCount: 16,
    segments: mockSegments,
    t2gEstimatePct: 28,
  },
  decorators: [
    (Story) => (
      <div className="w-64 p-4 border rounded">
        <div className="mb-2 font-semibold">Game Title</div>
        <Story />
        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          <span>⭐ Gets good ~28%</span>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'How the barcode appears in a card layout',
      },
    },
  },
};

export const Responsive: Story = {
  args: {
    titleId: 'responsive-example',
    segments: mockSegments,
    t2gEstimatePct: 35,
    interactive: true,
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="w-96">
          <div className="mb-2 text-sm font-medium">Desktop (segmentCount: 30)</div>
          <PacingBarcode
            titleId="responsive-desktop"
            height={60}
            segmentCount={30}
            segments={mockSegments}
            t2gEstimatePct={35}
            interactive={true}
          />
        </div>
        <div className="w-64">
          <div className="mb-2 text-sm font-medium">Tablet (segmentCount: 20)</div>
          <PacingBarcode
            titleId="responsive-tablet"
            height={60}
            segmentCount={20}
            segments={mockSegments}
            t2gEstimatePct={35}
          />
        </div>
        <div className="w-48">
          <div className="mb-2 text-sm font-medium">Mobile (segmentCount: 12)</div>
          <PacingBarcode
            titleId="responsive-mobile"
            height={60}
            segmentCount={12}
            segments={mockSegments}
            t2gEstimatePct={35}
          />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Responsive behavior across different screen sizes',
      },
    },
  },
};

export const CommunityVsLocal: Story = {
  render: function Story() {
    // Create segments that differ between mean and user
    const segments = Array.from({ length: 20 }, (_, i) => ({
      startPct: (i / 20) * 100,
      endPct: ((i + 1) / 20) * 100,
      meanScore: Math.max(0, Math.min(4, 2 + Math.sin(i / 3) + (Math.random() - 0.5) * 0.3)),
      userScore: Math.random() > 0.5 ? Math.max(0, Math.min(4, 2 + Math.cos(i / 4) + (Math.random() - 0.5) * 0.3)) : undefined,
    }));
    return (
      <div className="space-y-4 w-[520px] max-w-full">
        <div>
          <div className="text-sm font-medium mb-1">Community</div>
          <PacingBarcode titleId="comm" segments={segments} height={60} dataScope="community" />
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Local</div>
          <PacingBarcode titleId="local" segments={segments} height={60} dataScope="local" />
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Auto (prefers local, falls back to community)</div>
          <PacingBarcode titleId="auto" segments={segments} height={60} dataScope="auto" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compare rendering using community (mean) vs local (user) scores via the new dataScope prop.',
      },
    },
  },
};
