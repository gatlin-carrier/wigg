import type { Meta, StoryObj } from '@storybook/react';
import { MilestonePath } from '@/components/wigg/MilestonePath';

const meta: Meta<typeof MilestonePath> = {
  title: 'Wigg/MilestonePath',
  component: MilestonePath,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    height: { control: 'number' },
    maxWidth: { control: 'number' },
    focusPct: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof MilestonePath>;

const gameMilestones = [
  { id: '1', pct: 5, label: 'Tutorial', icon: '🎯' },
  { id: '2', pct: 15, label: 'First Boss', icon: '⚔️' },
  { id: '3', pct: 25, label: 'New Powers', icon: '✨' },
  { id: '4', pct: 40, label: 'Plot Twist', icon: '🔄' },
  { id: '5', pct: 55, label: 'Midpoint', icon: '⚖️' },
  { id: '6', pct: 70, label: 'Major Boss', icon: '🏆' },
  { id: '7', pct: 85, label: 'Climax', icon: '🔥' },
  { id: '8', pct: 95, label: 'Resolution', icon: '🌟' },
];

const movieMilestones = [
  { id: '1', pct: 10, label: 'Inciting Incident', icon: '⚡' },
  { id: '2', pct: 25, label: 'Plot Point 1', icon: '🎬' },
  { id: '3', pct: 50, label: 'Midpoint', icon: '⚖️' },
  { id: '4', pct: 75, label: 'Plot Point 2', icon: '🎭' },
  { id: '5', pct: 90, label: 'Climax', icon: '🔥' },
];

const crowdedMilestones = [
  { id: '1', pct: 12, label: 'Opening', icon: '🎪' },
  { id: '2', pct: 14, label: 'Setup', icon: '🎯' },
  { id: '3', pct: 16, label: 'Hook', icon: '🎣' },
  { id: '4', pct: 45, label: 'Midpoint', icon: '⚖️' },
  { id: '5', pct: 47, label: 'Revelation', icon: '💡' },
  { id: '6', pct: 49, label: 'Stakes', icon: '🎲' },
  { id: '7', pct: 85, label: 'Climax', icon: '🔥' },
];

const segmentScores = [
  { pct: 0, score: 1.5 },
  { pct: 20, score: 2.2 },
  { pct: 40, score: 3.1 },
  { pct: 60, score: 3.8 },
  { pct: 80, score: 3.5 },
  { pct: 100, score: 4.0 },
];

export const GameStory: Story = {
  args: {
    titleId: 'game-story-123',
    milestones: gameMilestones,
    height: 120,
    maxWidth: 800,
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical game progression with major story beats',
      },
    },
  },
};

export const MovieStructure: Story = {
  args: {
    titleId: 'movie-123',
    milestones: movieMilestones,
    height: 100,
    maxWidth: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'Classic three-act movie structure',
      },
    },
  },
};

export const WithColorGradient: Story = {
  args: {
    titleId: 'colored-path',
    milestones: gameMilestones,
    segmentScores: segmentScores,
    height: 140,
  },
  parameters: {
    docs: {
      description: {
        story: 'Path colored by quality scores - darker means higher quality',
      },
    },
  },
};

export const WithFocus: Story = {
  args: {
    titleId: 'focused-path',
    milestones: gameMilestones,
    focusPct: 40,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows current progress cursor at 40%',
      },
    },
  },
};

export const CrowdedMilestones: Story = {
  args: {
    titleId: 'crowded-milestones',
    milestones: crowdedMilestones,
    height: 140,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates collision avoidance when milestones are close together',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    titleId: 'empty-milestones',
    milestones: [],
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no milestones are available',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    titleId: 'interactive-path',
    milestones: gameMilestones,
    onSelect: (milestoneId: string) => {
      alert(`Selected milestone: ${milestoneId}`);
    },
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click milestones to select them (shows alert for demo)',
      },
    },
  },
};

export const Responsive: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-6">
        <div className="w-full max-w-4xl">
          <div className="mb-2 text-sm font-medium">Large (800px)</div>
          <MilestonePath
            titleId="responsive-large"
            milestones={gameMilestones}
            height={120}
            maxWidth={800}
          />
        </div>
        <div className="w-full max-w-2xl">
          <div className="mb-2 text-sm font-medium">Medium (600px)</div>
          <MilestonePath
            titleId="responsive-medium"
            milestones={gameMilestones}
            height={100}
            maxWidth={600}
          />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-2 text-sm font-medium">Small (400px)</div>
          <MilestonePath
            titleId="responsive-small"
            milestones={gameMilestones.slice(0, 5)} // Fewer milestones for mobile
            height={80}
            maxWidth={400}
          />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Responsive behavior across different container sizes',
      },
    },
  },
};