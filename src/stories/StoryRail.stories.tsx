import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { StoryRail } from '@/components/wigg/StoryRail';
import { useMilestones } from '@/hooks/useMilestones';
import { Button } from '@/components/ui/button';
import { ZoomMilestoneSheet } from '@/components/wigg/ZoomMilestoneSheet';

const meta: Meta<typeof StoryRail> = {
  title: 'Wigg/Milestones/Story Rail',
  component: StoryRail,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;

type Story = StoryObj<typeof StoryRail>;

export const MobileRail: Story = {
  render: function MobileRailStory() {
    const { data } = useMilestones('demo-title');
    const [open, setOpen] = useState(false);
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Scroll horizontally, tap stops</div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Open Zoom</Button>
        </div>
        <StoryRail
          titleId="demo-title"
          milestones={data?.items || []}
          currentPct={28}
          t2gEstimatePct={42}
        />
        <ZoomMilestoneSheet
          titleId="demo-title"
          isOpen={open}
          onClose={() => setOpen(false)}
          milestones={data?.items || []}
          title="Zoomed Story Path"
        />
      </div>
    );
  },
};

