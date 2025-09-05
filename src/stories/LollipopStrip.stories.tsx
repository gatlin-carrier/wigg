import type { Meta, StoryObj } from '@storybook/react';
import { LollipopStrip } from '@/components/wigg/LollipopStrip';

const meta: Meta<typeof LollipopStrip> = {
  title: 'Wigg/LollipopStrip',
  component: LollipopStrip,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    threshold: { control: 'number' },
    height: { control: 'number' },
    interactive: { control: 'boolean' },
    t2gEstimatePct: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof LollipopStrip>;

// Mock segments with varied scores
const mockSegments = Array.from({ length: 15 }, (_, i) => ({
  startPct: (i / 15) * 100,
  endPct: ((i + 1) / 15) * 100,
  meanScore: Math.random() * 4,
  userScore: Math.random() > 0.6 ? Math.random() * 4 : undefined,
}));

// Game that gets progressively better
const improvingGame = Array.from({ length: 20 }, (_, i) => {
  const position = i / 19;
  const score = 0.5 + position * 3.5; // 0.5 to 4.0 progression
  
  return {
    startPct: (i / 20) * 100,
    endPct: ((i + 1) / 20) * 100,
    meanScore: score,
  };
});

// Inconsistent quality
const inconsistentSegments = Array.from({ length: 12 }, (_, i) => ({
  startPct: (i / 12) * 100,
  endPct: ((i + 1) / 12) * 100,
  meanScore: Math.sin(i) * 1.5 + 2.5, // Oscillating between 1-4
}));

// Dense data requiring scroll
const denseSegments = Array.from({ length: 40 }, (_, i) => ({
  startPct: (i / 40) * 100,
  endPct: ((i + 1) / 40) * 100,
  meanScore: 1 + Math.random() * 3,
}));

export const Default: Story = {
  args: {
    titleId: 'lollipop-default',
    segments: mockSegments,
    threshold: 2,
    t2gEstimatePct: 35,
    height: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  args: {
    titleId: 'lollipop-interactive',
    segments: mockSegments,
    threshold: 2.5,
    t2gEstimatePct: 28,
    interactive: true,
    onMarkWigg: (pct: number) => {
      alert(`Marked WIGG at ${pct.toFixed(1)}%`);
    },
    height: 70,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Click any bead to mark a WIGG at that position',
      },
    },
  },
};

export const ProgressiveImprovement: Story = {
  args: {
    titleId: 'improving-game',
    segments: improvingGame,
    threshold: 2,
    t2gEstimatePct: 42,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-sm text-muted-foreground">
          A game that steadily improves over time - classic "slow burn" pattern
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates progression where quality steadily increases',
      },
    },
  },
};

export const InconsistentQuality: Story = {
  args: {
    titleId: 'inconsistent-quality',
    segments: inconsistentSegments,
    threshold: 3,
    t2gEstimatePct: 25,
    height: 80,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <div className="mb-4 text-sm text-muted-foreground">
          Mixed quality with high and low points throughout
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows content with inconsistent pacing and quality',
      },
    },
  },
};

export const DenseData: Story = {
  args: {
    titleId: 'dense-data',
    segments: denseSegments,
    threshold: 2.5,
    t2gEstimatePct: 15,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <div className="mb-4 text-sm text-muted-foreground">
          40 data points - requires horizontal scrolling
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Many data points that require horizontal scrolling on smaller screens',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    titleId: 'empty-data',
    segments: [],
    height: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no segment data is available',
      },
    },
  },
};

export const SingleDataPoint: Story = {
  args: {
    titleId: 'single-point',
    segments: [{
      startPct: 45,
      endPct: 55,
      meanScore: 3.2,
    }],
    t2gEstimatePct: 50,
    height: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Single data point centered in the strip',
      },
    },
  },
};

export const HighThreshold: Story = {
  args: {
    titleId: 'high-threshold',
    segments: improvingGame,
    threshold: 3.5, // Very high threshold
    t2gEstimatePct: 78,
    height: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-sm text-muted-foreground">
          High threshold (3.5/4) - T2G marker appears very late
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'High quality threshold results in later T2G estimate',
      },
    },
  },
};

export const ResponsiveSizes: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-6">
        <div className="w-full max-w-4xl">
          <div className="mb-2 text-sm font-medium">Large Container</div>
          <LollipopStrip
            titleId="responsive-large"
            segments={mockSegments}
            t2gEstimatePct={35}
            height={70}
          />
        </div>
        <div className="w-96">
          <div className="mb-2 text-sm font-medium">Medium Container</div>
          <LollipopStrip
            titleId="responsive-medium"
            segments={mockSegments}
            t2gEstimatePct={35}
            height={60}
          />
        </div>
        <div className="w-64">
          <div className="mb-2 text-sm font-medium">Small Container (with scroll)</div>
          <LollipopStrip
            titleId="responsive-small"
            segments={mockSegments}
            t2gEstimatePct={35}
            height={50}
          />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Responsive behavior - smaller containers enable horizontal scrolling',
      },
    },
  },
};