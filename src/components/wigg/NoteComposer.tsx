import React, { useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface NoteComposerProps {
  value?: string;
  onChange?: (v: string) => void;
  maxLength?: number;
  templates?: string[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_TEMPLATES = [
  'Great boss fight',
  'Plot twist',
  'World opens up',
  'New mechanic clicks',
  'Music slaps',
  'Hilarious bit',
];

export function NoteComposer({ value = '', onChange, maxLength = 140, templates = DEFAULT_TEMPLATES, placeholder = "Why was this good? (optional)", className = '' }: NoteComposerProps) {
  const [text, setText] = useState(value);
  const [emoji, setEmoji] = useState('');

  const remaining = maxLength - text.length;
  const tooLong = remaining < 0;

  const add = (snippet: string) => {
    const next = text ? `${text} — ${snippet}` : snippet;
    setText(next);
    onChange?.(next);
  };

  const addEmoji = (e: string) => {
    const next = text + (text ? ' ' : '') + e;
    setText(next);
    onChange?.(next);
  };

  const EMOJIS = ['🔥', '👏', '🤯', '😂', '🎵', '😭', '🧠', '🎮', '🎨'];

  return (
    <div className={`space-y-2 ${className}`}>
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); onChange?.(e.target.value); }}
        maxLength={maxLength}
        placeholder={placeholder}
        className="text-sm"
      />
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {templates.map((t) => (
            <Button key={t} size="sm" variant="secondary" className="h-7 rounded-full text-xs" onClick={() => add(t)}>
              {t}
            </Button>
          ))}
        </div>
        <div className={`text-xs ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>{remaining}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="h-8 w-8 rounded-full border bg-background hover:bg-accent" onClick={() => addEmoji(e)} aria-label={`Insert ${e}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Tap to insert</div>
      </div>
    </div>
  );
}

