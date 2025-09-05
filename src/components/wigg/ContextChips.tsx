import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

export interface ContextChip {
  id: string;
  label: string;
  emoji?: string; // prefer emoji for compact fun vibe
  color?: string; // tailwind color token, e.g., 'bg-amber-100 text-amber-900'
  spoiler?: 'none' | 'light' | 'heavy';
}

export interface ContextChipsProps {
  options: ContextChip[];
  selected: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  maxVisible?: number; // collapse rest into "+N"
  className?: string;
}

export function ContextChips({ options, selected, onChange, allowCustom = true, maxVisible = 10, className = '' }: ContextChipsProps) {
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');

  const sorted = useMemo(() => options.slice().sort((a, b) => a.label.localeCompare(b.label)), [options]);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };

  const addCustom = () => {
    const val = custom.trim();
    if (!val) return;
    const id = `custom:${val.toLowerCase()}`;
    if (!selected.includes(id)) onChange([...selected, id]);
    setCustom('');
    setAdding(false);
  };

  const visible = sorted.slice(0, maxVisible);
  const extra = sorted.length - visible.length;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Context tags">
        {visible.map((opt) => {
          const active = selected.includes(opt.id) || selected.includes(`custom:${opt.label.toLowerCase()}`);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`px-3 h-9 rounded-full border text-xs inline-flex items-center gap-1 ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground'} hover:opacity-90`}
              aria-pressed={active}
              aria-label={`${opt.label}${opt.spoiler ? ` (${opt.spoiler} spoilers)` : ''}`}
            >
              {opt.emoji && <span aria-hidden>{opt.emoji}</span>}
              <span className="truncate max-w-[120px]">{opt.label}</span>
            </button>
          );
        })}
        {extra > 0 && (
          <span className="text-xs text-muted-foreground self-center">+{extra} more</span>
        )}

        {allowCustom && !adding && (
          <Button variant="outline" size="sm" className="rounded-full h-8" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
        {allowCustom && adding && (
          <div className="flex items-center gap-1">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom"
              className="h-8 text-xs w-28"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
                if (e.key === 'Escape') { setAdding(false); setCustom(''); }
              }}
              autoFocus
            />
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={addCustom}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setAdding(false); setCustom(''); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

