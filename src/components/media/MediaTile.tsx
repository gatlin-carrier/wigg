import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Props = {
  title: string;
  imageUrl?: string | null;
  year?: number | string;
  ratingLabel?: string; // e.g., "8.2/10" or "82/100"
  tags?: string[]; // small badges, up to 2-3
  onAdd?: () => void;
  onClick?: () => void;
  className?: string;
  // Data needed for WIGG routing
  mediaData?: {
    source: string;
    id: string;
    title: string;
    type: string;
    posterUrl?: string;
    year?: number | string;
    runtime?: number;
  };
};

export function MediaTile({ title, imageUrl, year, ratingLabel, tags, onAdd, onClick, className, mediaData }: Props) {
  const navigate = useNavigate();

  const handleAddWigg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mediaData) {
      navigate('/add-wigg', { 
        state: { 
          media: mediaData
        }
      });
    } else if (onAdd) {
      onAdd();
    }
  };
  return (
    <Card 
      className={cn(
        'p-4 bg-card hover:bg-muted/40 border-0 shadow-soft hover:shadow-medium transition-colors duration-200 group h-full relative',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Add WIGG Button */}
      <Button
        onClick={handleAddWigg}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        size="sm"
        className="absolute top-1 right-1 h-8 w-8 rounded-full p-0 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
        aria-label="Add WIGG point"
      >
        <Plus className="h-4 w-4" />
      </Button>

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
