import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { type Milestone } from '@/hooks/useMilestones';
import { MilestonePath } from '@/components/wigg/MilestonePath';

export interface ZoomMilestoneSheetProps {
  titleId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  milestones: Milestone[];
}

export function ZoomMilestoneSheet({ titleId, isOpen, onClose, title = 'Story', milestones }: ZoomMilestoneSheetProps) {
  const [zoom, setZoom] = useState(1);
  const clamp = (n: number) => Math.max(1, Math.min(3, n));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => clamp(z - 0.25))}>-</Button>
            <div className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</div>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => clamp(z + 0.25))}>+</Button>
          </div>
        </div>
        <div className="h-full overflow-auto">
          <div className="p-4" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <MilestonePath titleId={titleId} milestones={milestones} height={200} className="bg-background" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

