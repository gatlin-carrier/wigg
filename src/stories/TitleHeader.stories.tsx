import type { Meta, StoryObj } from '@storybook/react';
import { TitleHeader } from '@/components/wigg/TitleHeader';
const meta: Meta<typeof TitleHeader> = {
  title: 'Wigg/TitleHeader',
  component: TitleHeader,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TitleHeader>;

export const Default: Story = {
  args: {
    titleId: 'title-001',
    title: 'Infinity Quest',
    subtitle: 'A long-form action-adventure with a slow burn',
    mediaType: 'game',
    year: 2024,
    runtime: 1800, // minutes (~30h game)
    genre: ['Action', 'Adventure', 'RPG'],
    rating: 'T',
    developer: 'Starforge Studios',
    publisher: 'Silverwing',
  },
};

export const MilestonesView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header with MilestonePath as the primary visualization.',
      },
    },
  },
};

export const BarcodeView: Story = {
  render: (args) => (
    <div className="p-4">
      <TitleHeader {...args} />
    </div>
  ),
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: 'Switch to PacingBarcode inside the header using the built-in toggle.',
      },
    },
  },
};

export const LollipopView: Story = {
  render: (args) => (
    <div className="p-4">
      <TitleHeader {...args} />
    </div>
  ),
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header using the LollipopStrip as an alternative quantitative visual.',
      },
    },
  },
};
