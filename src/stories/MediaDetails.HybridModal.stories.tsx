import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { RatingButtons } from '@/components/wigg/RatingButtons';
import { WhyTagSelector, type SpoilerLevel } from '@/components/wigg/WhyTagSelector';

type Variant = 'dialog' | 'sheet';
type Mode = 'add' | 'edit';

type Wigg = {
  id: string;
  note?: string;
  rating?: number; // 0..3
  tags?: string[];
};

/**
 * Lightweight presentational form to simulate quick add/edit within a modal.
 * Uses local state only. No routing or API calls.
 */
function WiggQuickForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Wigg>;
  onCancel: () => void;
  onSave: (wigg: Wigg) => void;
}) {
  const [note, setNote] = React.useState(initial?.note ?? '');
  const [rating, setRating] = React.useState<number | undefined>(
    typeof initial?.rating === 'number' ? initial?.rating : undefined
  );
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [customTags, setCustomTags] = React.useState<string[]>([]);
  const [spoiler, setSpoiler] = React.useState<SpoilerLevel>('none');

  return (
    <div className="space-y-4">
      {/* Tiny context preview */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Community pacing preview</div>
        <PacingBarcode
          titleId="demo-title"
          height={40}
          segmentCount={20}
          segments={[]}
          dataScope="community"
          colorMode="heat"
          interactive={false}
          className="rounded border"
        />
      </div>

      {/* Quick rating */}
      <div>
        <div className="text-sm font-medium mb-2">Rating</div>
        <RatingButtons value={rating as any} onChange={(v) => setRating(v as number)} />
      </div>

      {/* Why tags */}
      <WhyTagSelector
        selectedTags={tags}
        onTagsChange={setTags}
        spoilerLevel={spoiler}
        onSpoilerChange={setSpoiler}
        customTags={customTags}
        onCustomTagsChange={setCustomTags}
      />

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-sm">Notes (optional)</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What made this moment work?" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({ id: initial?.id ?? `wigg-${Date.now()}`, note, rating: rating ?? 2, tags })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}

/**
 * Media Details-like shell to showcase background context + CTA and existing Wiggs.
 * Not the real page; tailored for Storybook to demonstrate the hybrid modal.
 */
function MediaDetailsHybridDemo({ variant, mode: defaultMode }: { variant: Variant; mode: Mode }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>(defaultMode);
  const [wiggs, setWiggs] = React.useState<Wigg[]>([
    { id: 'w1', note: 'Arc kicks in hard', rating: 3, tags: ['world'] },
    { id: 'w2', note: 'Pacing drags a bit', rating: 1, tags: ['pacing'] },
  ]);

  const startAdd = () => {
    setMode('add');
    setOpen(true);
  };

  const startEdit = (id: string) => {
    setMode('edit');
    setOpen(true);
  };

  const activeEditing = mode === 'edit' ? wiggs[0] : undefined; // simple demo: edit first item

  return (
    <div className="min-h-[90vh] bg-background">
      {/* Backdrop */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Poster */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden w-44 aspect-[2/3]">
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                Poster
              </div>
            </Card>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Infinity Quest</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>2024</span>
                <span>•</span>
                <span>Action, Adventure</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Slow burn</Badge>
              <Badge variant="secondary">High stakes</Badge>
            </div>

            <div className="grid gap-4">
              <Button size="lg" className="w-full lg:w-auto" onClick={startAdd}>
                Add Wigg
              </Button>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Your Wiggs</div>
                <div className="space-y-2">
                  {wiggs.map((w) => (
                    <Card key={w.id} className="p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">Rating: {w.rating ?? 2}</div>
                        <div className="text-muted-foreground">{w.note || '—'}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEdit(w.id)}>
                        Edit
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hybrid Modal */}
      {variant === 'dialog' ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{mode === 'add' ? 'Add Wigg' : 'Edit Wigg'}</DialogTitle>
            </DialogHeader>
            <WiggQuickForm
              initial={activeEditing}
              onCancel={() => setOpen(false)}
              onSave={(w) => {
                setWiggs((prev) => {
                  const idx = prev.findIndex((p) => p.id === w.id);
                  if (idx >= 0) {
                    const next = prev.slice();
                    next[idx] = w;
                    return next;
                  }
                  return [w, ...prev];
                });
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{mode === 'add' ? 'Add Wigg' : 'Edit Wigg'}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <WiggQuickForm
                initial={activeEditing}
                onCancel={() => setOpen(false)}
                onSave={(w) => {
                  setWiggs((prev) => {
                    const idx = prev.findIndex((p) => p.id === w.id);
                    if (idx >= 0) {
                      const next = prev.slice();
                      next[idx] = w;
                      return next;
                    }
                    return [w, ...prev];
                  });
                  setOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

const meta: Meta<typeof MediaDetailsHybridDemo> = {
  title: 'Flows/MediaDetails Hybrid Modal',
  component: MediaDetailsHybridDemo,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['dialog', 'sheet'],
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['add', 'edit'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MediaDetailsHybridDemo>;

export const Dialog_AddFlow: Story = {
  args: { variant: 'dialog', mode: 'add' },
};

export const Sheet_EditFlow: Story = {
  args: { variant: 'sheet', mode: 'edit' },
};

