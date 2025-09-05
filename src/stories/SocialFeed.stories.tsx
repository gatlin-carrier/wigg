import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo } from 'react';
import { SocialFeed, type SocialFeedItem } from '@/components/wigg/SocialFeed';
import { useTitleProgress } from '@/hooks/useTitleProgress';

const meta: Meta<typeof SocialFeed> = {
  title: 'Wigg/Social/Feed',
  component: SocialFeed,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;

type Story = StoryObj<typeof SocialFeed>;

function useMockFeed(): SocialFeedItem[] {
  const a = useTitleProgress('title-a').data?.segments || [];
  const b = useTitleProgress('title-b').data?.segments || [];
  const now = new Date();
  return [
    {
      id: '1',
      type: 'wigg',
      user: { id: 'u1', name: 'Alex', avatarUrl: undefined },
      title: { id: 'title-a', name: 'Infinity Quest', coverUrl: '/placeholder.svg' },
      createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
      pct: 28.4,
      rating: 2,
      note: 'Traversal unlock changes everything',
      contexts: ['World opens', 'Music hits'],
      segments: a,
      t2gEstimatePct: 42,
    },
    {
      id: '2',
      type: 'summary',
      user: { id: 'u2', name: 'Mina' },
      title: { id: 'title-b', name: 'Elden Ring', coverUrl: '/placeholder.svg' },
      createdAt: new Date(now.getTime() - 50 * 60000).toISOString(),
      segments: b,
      t2gEstimatePct: 58,
    },
    {
      id: '3',
      type: 'wigg',
      user: { id: 'u3', name: 'Ravi' },
      title: { id: 'title-a', name: 'Infinity Quest', coverUrl: '/placeholder.svg' },
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      pct: 63.9,
      rating: 3,
      note: 'Boss fight is peak',
      contexts: ['Boss', 'Art spike'],
      segments: a,
      t2gEstimatePct: 42,
    },
  ];
}

export const Mobile: Story = {
  render: function Story() {
    const items = useMockFeed();
    return (
      <div className="p-4">
        <SocialFeed items={items} />
      </div>
    );
  },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
  render: function Story() {
    const items = useMockFeed();
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <SocialFeed items={items} />
      </div>
    );
  },
};
