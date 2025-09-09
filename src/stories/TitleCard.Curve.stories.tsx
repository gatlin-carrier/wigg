import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TitleCardCurve } from '@/components/wigg/TitleCardCurve';

const meta: Meta<typeof TitleCardCurve> = {
  title: 'Wigg/TitleCard (Curve Prototype)',
  component: TitleCardCurve,
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
    docs: { description: { component: 'Prototype title card using a simple goodness curve instead of the barcode.' } },
  },
};

export default meta;

type Story = StoryObj<typeof TitleCardCurve>;

export const Default: Story = {
  args: {
    titleId: 'demo-title',
    title: 'Infinity Quest',
    coverArt: '/placeholder.svg',
    mediaType: 'game',
    year: 2024,
    runtime: 1800, // minutes
    genre: ['Action', 'Adventure'],
  },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
  args: {
    ...Default.args,
  },
};

export const HeatFill: Story = {
  args: {
    ...Default.args,
    miniColorMode: 'heat',
  },
};

export const Minimal: Story = {
  args: {
    ...Default.args,
    miniColorMode: 'brand',
    miniMinimal: true,
    miniBadThreshold: 1.0,
  },
};
