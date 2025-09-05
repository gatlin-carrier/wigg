import type { Meta, StoryObj } from '@storybook/react';
import { RealTimeVisualization } from '@/components/wigg/RealTimeVisualization';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

const meta: Meta<typeof RealTimeVisualization> = {
  title: 'Wigg/RealTimeVisualization',
  component: RealTimeVisualization,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['curve', 'bars', 'pulse', 'barcode'],
    },
    mediaType: {
      control: 'select',
      options: ['movie', 'tv', 'anime', 'game', 'book', 'manga'],
    },
    currentPosition: { control: 'number', min: 0, max: 1, step: 0.01 },
    runtime: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof RealTimeVisualization>;

// Mock session stats
const mockSessionStats = {
  n: 45,
  peak: 8,
  good: 15,
  ok: 12,
  skip: 10,
};

// Mock real-time ratings (what user has rated so far)
const mockCurrentRatings: SwipeValue[] = [
  0, 0, 1, 1, 1, 2, 1, 2, 3, 2, 3, 3, 2, 1, 2, 3, 3, 3, 2, 1
];

// Shorter ratings for mobile demo
const shortRatings: SwipeValue[] = [0, 1, 1, 2, 2, 3, 3, 2, 1, 2];

export const GameDesktop: Story = {
  args: {
    titleId: 'game-desktop-demo',
    sessionStats: mockSessionStats,
    currentRatings: mockCurrentRatings,
    variant: 'curve',
    mediaType: 'game',
    runtime: 60, // 60 hours
    currentPosition: 0.42,
    onSeek: (position: number) => {
      console.log(`Seeked to ${(position * 100).toFixed(1)}%`);
    },
    onMarkWigg: (pct: number) => {
      console.log(`Marked WIGG at ${pct.toFixed(1)}%`);
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-sm text-muted-foreground">
          Desktop view - uses curve visualization
        </div>
        <Story />
      </div>
    ),
  ],
};

export const GameMobileBarcode: Story = {
  args: {
    titleId: 'game-mobile-demo',
    sessionStats: { ...mockSessionStats, n: 10 },
    currentRatings: shortRatings,
    variant: 'curve', // Should automatically use barcode on mobile
    mediaType: 'game',
    runtime: 40,
    currentPosition: 0.35,
    onSeek: (position: number) => {
      console.log(`Mobile seeked to ${(position * 100).toFixed(1)}%`);
    },
    onMarkWigg: (pct: number) => {
      console.log(`Mobile marked WIGG at ${pct.toFixed(1)}%`);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Mobile view - automatically uses barcode for all variants
        </div>
        <Story />
      </div>
    ),
  ],
};

export const MovieMobile: Story = {
  args: {
    titleId: 'movie-mobile-demo',
    sessionStats: { n: 12, peak: 3, good: 5, ok: 3, skip: 1 },
    currentRatings: [0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 2, 1],
    variant: 'pulse', // Should use barcode on mobile regardless
    mediaType: 'movie',
    runtime: 142, // 142 minutes
    currentPosition: 0.68,
    onSeek: (position: number) => {
      console.log(`Movie seeked to ${(position * 100).toFixed(1)}%`);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Movie on mobile - uses barcode instead of pulse
        </div>
        <Story />
      </div>
    ),
  ],
};

export const BookMobile: Story = {
  args: {
    titleId: 'book-mobile-demo',
    sessionStats: { n: 8, peak: 2, good: 4, ok: 2, skip: 0 },
    currentRatings: [1, 1, 2, 2, 3, 2, 3, 3],
    variant: 'bars',
    mediaType: 'book',
    runtime: 400, // 400 pages
    currentPosition: 0.52,
    onMarkWigg: (pct: number) => {
      console.log(`Book marked WIGG at ${pct.toFixed(1)}%`);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Book on mobile - barcode shows page-based progress
        </div>
        <Story />
      </div>
    ),
  ],
};

export const ExplicitBarcode: Story = {
  args: {
    titleId: 'explicit-barcode-demo',
    sessionStats: mockSessionStats,
    currentRatings: mockCurrentRatings,
    variant: 'barcode', // Explicitly request barcode
    mediaType: 'game',
    runtime: 80,
    currentPosition: 0.25,
    onSeek: (position: number) => {
      console.log(`Barcode seeked to ${(position * 100).toFixed(1)}%`);
    },
    onMarkWigg: (pct: number) => {
      console.log(`Barcode marked WIGG at ${pct.toFixed(1)}%`);
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-sm text-muted-foreground">
          Explicitly requested barcode variant (works on desktop too)
        </div>
        <Story />
      </div>
    ),
  ],
};

export const EmptyState: Story = {
  args: {
    titleId: 'empty-state-demo',
    sessionStats: { n: 0, peak: 0, good: 0, ok: 0, skip: 0 },
    currentRatings: [],
    variant: 'curve', // Will use barcode on mobile
    mediaType: 'game',
    currentPosition: 0.15,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Empty state - no ratings yet
        </div>
        <Story />
      </div>
    ),
  ],
};

export const ProgressiveSession: Story = {
  args: {
    titleId: 'progressive-demo',
    sessionStats: { n: 5, peak: 0, good: 1, ok: 2, skip: 2 },
    currentRatings: [0, 0, 1, 1, 2], // Getting better over time
    variant: 'curve',
    mediaType: 'game',
    runtime: 50,
    currentPosition: 0.18,
    onSeek: (position: number) => {
      console.log(`Progressive seeked to ${(position * 100).toFixed(1)}%`);
    },
    onMarkWigg: (pct: number) => {
      console.log(`Progressive marked WIGG at ${pct.toFixed(1)}%`);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Progressive session - getting better over time
        </div>
        <Story />
      </div>
    ),
  ],
};

export const ComparisonView: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Desktop (Curve)</h3>
          <div className="w-full max-w-2xl">
            <RealTimeVisualization
              titleId="comparison-desktop"
              sessionStats={mockSessionStats}
              currentRatings={mockCurrentRatings}
              variant="curve"
              mediaType="game"
              runtime={60}
              currentPosition={0.42}
              onSeek={(pos) => console.log('Desktop seek:', pos)}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Mobile (Barcode - Auto)</h3>
          <div className="w-full max-w-sm">
            <RealTimeVisualization
              titleId="comparison-mobile"
              sessionStats={mockSessionStats}
              currentRatings={shortRatings}
              variant="curve" // Will auto-use barcode on mobile
              mediaType="game"
              runtime={60}
              currentPosition={0.42}
              onSeek={(pos) => console.log('Mobile seek:', pos)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Desktop (Explicit Barcode)</h3>
          <div className="w-full max-w-2xl">
            <RealTimeVisualization
              titleId="comparison-barcode"
              sessionStats={mockSessionStats}
              currentRatings={mockCurrentRatings}
              variant="barcode"
              mediaType="game"
              runtime={60}
              currentPosition={0.42}
              onSeek={(pos) => console.log('Barcode seek:', pos)}
            />
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of curve vs barcode visualizations',
      },
    },
  },
};