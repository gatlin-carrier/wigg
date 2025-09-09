import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MiniGoodnessCurve } from '@/components/wigg/MiniGoodnessCurve';

const meta: Meta<typeof MiniGoodnessCurve> = {
  title: 'Wigg/Graphs/MiniGoodnessCurve',
  component: MiniGoodnessCurve,
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;

type Story = StoryObj<typeof MiniGoodnessCurve>;

const values = Array.from({ length: 24 }, (_, i) => {
  const x = i / 23;
  if (x < 0.2) return 0.8 + x * 1.5; // early low
  if (x < 0.6) return 1.2 + (x - 0.2) * 3; // rising
  return 2.6 + Math.sin(x * 8) * 0.2; // settled high
});

export const MinimalBrand: Story = {
  args: {
    values,
    height: 28,
    minimal: true,
    badThreshold: 1.0,
  },
};

export const MinimalPurpleHeat: Story = {
  args: {
    values,
    height: 28,
    minimal: true,
    colorMode: 'heat',
    heatStyle: 'muted',
    badThreshold: 1.0,
  },
};

