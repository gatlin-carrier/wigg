import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';

export type RatingSystem = 'buttons' | 'dial' | 'slider' | 'grid' | 'affect' | 'swipe' | 'hybrid' | 'paint';

interface RatingSystemSelectorProps {
  value: RatingSystem;
  onChange: (value: RatingSystem) => void;
  disabled?: boolean;
  className?: string;
}

const options: Array<{ value: RatingSystem; label: string; description: string }> = [
  { value: 'buttons', label: 'Buttons', description: 'Four discrete buttons (zzz, good, better, peak)' },
  { value: 'dial', label: 'Dial', description: 'Radial tap/drag dial for quick selection' },
  { value: 'slider', label: 'Slider', description: 'One-handed vertical slider' },
  { value: 'grid', label: 'Grid', description: '2×2 face grid selection' },
  { value: 'affect', label: 'Affect Pad', description: '2D pad: quality × energy' },
  { value: 'swipe', label: 'Swipe Card', description: 'Swipe left/right/up/down or ASDF' },
  { value: 'hybrid', label: 'Hybrid', description: 'Dial + Buttons combo' },
  { value: 'paint', label: 'Paint (Beta)', description: 'Paint segment scores on barcode' },
];

export function RatingSystemSelector({ value, onChange, disabled, className }: RatingSystemSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between h-auto p-3 min-h-[3.5rem] text-left"
            aria-label={`Rating system selector. Currently selected: ${current.label}`}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">{current.label}</div>
              <div className="text-xs text-muted-foreground truncate">{current.description}</div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-w-[calc(100vw-2rem)] p-2" align="start" role="menu" sideOffset={4}>
          {options.map((o) => (
            <DropdownMenuItem
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="flex items-start gap-2 p-2"
              role="menuitemradio"
              aria-checked={value === o.value}
              aria-label={`${o.label}: ${o.description}`}
            >
              {value === o.value ? <Check className="h-4 w-4 text-primary mt-[2px]" /> : <span className="h-4 w-4" />}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{o.label}</div>
                <div className="text-xs text-muted-foreground truncate">{o.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default RatingSystemSelector;

