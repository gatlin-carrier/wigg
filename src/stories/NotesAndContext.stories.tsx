import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ContextChips, type ContextChip } from '@/components/wigg/ContextChips';
import { NoteComposer } from '@/components/wigg/NoteComposer';
import { Card, CardContent } from '@/components/ui/card';

const meta: Meta = {
  title: 'Wigg/Notes & Context',
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
    docs: { description: { component: 'Clean, fun, and intuitive prototypes for notes and context chips (tags), optimized for mobile.' } },
  },
};

export default meta;

type Story = StoryObj;

const OPTIONS: ContextChip[] = [
  { id: 'pacing', label: 'Pacing', emoji: '⏩', spoiler: 'none' },
  { id: 'world', label: 'World opens', emoji: '🗺️', spoiler: 'none' },
  { id: 'twist', label: 'Plot twist', emoji: '🤯', spoiler: 'light' },
  { id: 'stakes', label: 'Stakes', emoji: '📈', spoiler: 'light' },
  { id: 'humor', label: 'Humor', emoji: '😂', spoiler: 'none' },
  { id: 'romance', label: 'Romance', emoji: '💞', spoiler: 'light' },
  { id: 'art', label: 'Art spike', emoji: '🎨', spoiler: 'none' },
  { id: 'fight', label: 'Fight choreo', emoji: '⚔️', spoiler: 'light' },
  { id: 'music', label: 'Music hits', emoji: '🎵', spoiler: 'none' },
  { id: 'gut', label: 'Gut‑punch', emoji: '😭', spoiler: 'heavy' },
  { id: 'cliff', label: 'Cliffhanger', emoji: '🧗', spoiler: 'heavy' },
];

export const CleanMobilePanel: Story = {
  render: function Story() {
    const [tags, setTags] = useState<string[]>(['world']);
    const [note, setNote] = useState('');
    return (
      <Card className="w-[380px]">
        <CardContent className="p-4 space-y-4">
          <div className="text-sm font-medium">Add context (optional)</div>
          <ContextChips options={OPTIONS} selected={tags} onChange={setTags} />
          <NoteComposer value={note} onChange={setNote} />
        </CardContent>
      </Card>
    );
  },
};

export const FunTemplates: Story = {
  render: function Story() {
    const [tags, setTags] = useState<string[]>([]);
    const [note, setNote] = useState('');
    return (
      <div className="space-y-4 w-[380px]">
        <ContextChips options={OPTIONS} selected={tags} onChange={setTags} />
        <NoteComposer
          value={note}
          onChange={setNote}
          templates={[
            'Prologue finally hooks',
            'First boss cracked me up',
            'Traversal unlock changes everything',
            'Side quest unexpectedly peak',
            'Cutscene a total gut‑punch',
            'Music drop gave chills',
          ]}
        />
      </div>
    );
  },
};

