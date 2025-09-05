import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ActPager } from '@/components/wigg/ActPager';
import { useMilestones } from '@/hooks/useMilestones';
import { useTitleProgress } from '@/hooks/useTitleProgress';

const meta: Meta<typeof ActPager> = {
  title: 'Wigg/Milestones/Act Pager',
  component: ActPager,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;

type Story = StoryObj<typeof ActPager>;

export const Default: Story = {
  render: function Story() {
    const { data: m } = useMilestones('demo-title');
    const { data: p } = useTitleProgress('demo-title');
    return (
      <div className="p-4">
        <ActPager
          titleId="demo-title"
          milestones={m?.items || []}
          segments={p?.segments || []}
        />
      </div>
    );
  },
};

