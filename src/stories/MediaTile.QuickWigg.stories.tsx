import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { MediaTile } from '@/components/media/MediaTile';
import { type QuickWiggVariant } from '@/components/wigg/QuickWiggModal';

type Variant = QuickWiggVariant;

type MediaKind = 'movie' | 'tv' | 'anime' | 'manga' | 'game' | 'book';

type Media = {
  id: string;
  title: string;
  type: MediaKind;
  coverImage?: string;
  year?: number;
};

type Episode = { id: string; number: number; title: string };
type Season = { number: number; title: string; episodes: Episode[] };
type Units = { seasons?: Season[] };

// Using the real QuickWiggModal component from '@/components/wigg/QuickWiggModal'

function GridDemo({ variant }: { variant: Variant }) {
  // Mock catalog
  const items: Array<{ media: Media; imageUrl?: string; episodic?: boolean; units?: Units }> = [
    {
      media: { id: 'tv-001', title: 'The Long Show', type: 'tv', year: 2024 },
      imageUrl: undefined,
      episodic: true,
      units: {
        seasons: Array.from({ length: 2 }, (_, s) => ({
          number: s + 1,
          title: `Season ${s + 1}`,
          episodes: Array.from({ length: 6 }, (_, e) => ({
            id: `tv-001-s${s + 1}e${e + 1}`,
            number: e + 1,
            title: `Episode ${e + 1}`,
          })),
        })),
      },
    },
    {
      media: { id: 'mv-001', title: 'Great Movie', type: 'movie', year: 2023 },
      imageUrl: undefined,
      episodic: false,
    },
    {
      media: { id: 'an-001', title: 'Galactic Saga', type: 'anime', year: 2022 },
      imageUrl: undefined,
      episodic: true,
      units: {
        seasons: Array.from({ length: 2 }, (_, s) => ({
          number: s + 1,
          title: `Season ${s + 1}`,
          episodes: Array.from({ length: 6 }, (_, e) => ({
            id: `an-001-s${s + 1}e${e + 1}`,
            number: e + 1,
            title: `Episode ${e + 1}`,
          })),
        })),
      },
    },
  ];

  return (
    <div className="min-h-[90vh] bg-background p-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <MediaTile
              key={item.media.id}
              title={item.media.title}
              year={item.media.year}
              imageUrl={undefined}
              quickWiggEnabled
              quickWiggVariant={variant}
              quickWiggUnits={item.units}
              onClick={() => { /* noop in story */ }}
              className="min-h-[280px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof GridDemo> = {
  title: 'Flows/MediaTile - Quick Wigg',
  component: GridDemo,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['dialog', 'sheet'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof GridDemo>;

export const DialogVariant: Story = { args: { variant: 'dialog' } };
export const SheetVariant: Story = { args: { variant: 'sheet' } };
