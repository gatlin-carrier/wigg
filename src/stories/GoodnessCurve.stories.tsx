import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { GoodnessCurve, type GoodnessCurveData } from '@/components/wigg/GoodnessCurve';

const meta: Meta<typeof GoodnessCurve> = {
  title: 'Wigg/Graphs/GoodnessCurve',
  component: GoodnessCurve,
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
    docs: {
      description: {
        component:
          'Curved line graph mockup showing rolling “goodness” over time (e.g., episodes/chapters). Threshold line approximates where it gets good and sustains.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof GoodnessCurve>;

const makeData = (n = 20): GoodnessCurveData[] =>
  Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    // Slow start → rise → settled high
    const base = x < 0.25 ? 0.8 + x * 1.2 : x < 0.6 ? 1.1 + (x - 0.25) * 2.4 : 2.4 + Math.sin(x * 6) * 0.15;
    const score = Math.max(0, Math.min(3, base + (Math.random() - 0.5) * 0.2));
    return { unit: i + 1, label: `#${i + 1}`, score };
  });

export const Default: Story = {
  args: {
    data: makeData(20),
    threshold: 2.0,
  },
};

export const DenseSeason: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
  args: {
    data: makeData(36),
    threshold: 2.2,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

