import React from 'react';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  imageUrl?: string | null;
  year?: number | string;
  ratingLabel?: string; // e.g., "8.2/10" or "82/100"
  tags?: string[]; // small badges, up to 2-3
  onAdd?: () => void;
  onClick?: () => void;
  className?: string;
};

export function MediaTile({ title, imageUrl, year, ratingLabel, tags, onAdd, onClick, className }: Props) {
  return (
    <Card 
      className={cn(
        'p-4 bg-card hover:bg-muted/40 border-0 shadow-soft hover:shadow-medium transition-colors duration-200 group h-full',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {imageUrl && (
        <div className="aspect-[2/3] mb-3 overflow-hidden rounded-lg bg-muted">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <h3 className="font-medium text-foreground leading-tight line-clamp-2 min-h-[2lh]">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {ratingLabel && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span>{ratingLabel}</span>
            </span>
          )}
          {year && <span>{year}</span>}
        </div>
        {!!(tags && tags.length) && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default MediaTile;
