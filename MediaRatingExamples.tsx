// Example: Rating Modal Component for Media Items
// This shows how to integrate the rating system with your existing media cards

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RatingSystem from './RatingSystem';

interface MediaRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: string;
    title: string;
    type: 'movie' | 'tv' | 'game' | 'book';
    posterUrl?: string;
  };
}

export function MediaRatingModal({ isOpen, onClose, media }: MediaRatingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {media.posterUrl && (
              <img 
                src={media.posterUrl} 
                alt={media.title}
                className="w-20 h-30 object-cover rounded-lg"
              />
            )}
            <div>
              <DialogTitle className="text-2xl">{media.title}</DialogTitle>
              <p className="text-sm text-muted-foreground capitalize">{media.type}</p>
            </div>
          </div>
        </DialogHeader>
        
        <RatingSystem mediaId={media.id} />
      </DialogContent>
    </Dialog>
  );
}

// Example: Media Card with Rating Button
// Add this to your existing media card components

interface MediaCardProps {
  media: {
    id: string;
    title: string;
    posterUrl: string;
    type: 'movie' | 'tv' | 'game' | 'book';
  };
}

export function MediaCard({ media }: MediaCardProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);

  return (
    <>
      <div className="relative group">
        {/* Your existing card content */}
        <img src={media.posterUrl} alt={media.title} className="rounded-lg" />
        
        {/* Add rating button overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => setShowRatingModal(true)}
            className="px-6 py-3 bg-primary rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            ⭐ Rate This
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      <MediaRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        media={media}
      />
    </>
  );
}

// Example: Using in a Media Grid
export function MediaGrid() {
  const mediaItems = [
    // Your media items from API/state
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {mediaItems.map(media => (
        <MediaCard key={media.id} media={media} />
      ))}
    </div>
  );
}

// Example: API Integration
// services/ratingService.ts

interface SaveRatingParams {
  mediaId: string;
  rating: number;
  timestamp: number;
}

export const ratingService = {
  async saveRating({ mediaId, rating, timestamp }: SaveRatingParams) {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, rating, timestamp })
    });
    
    if (!response.ok) throw new Error('Failed to save rating');
    return response.json();
  },

  async getRatings(mediaId: string) {
    const response = await fetch(`/api/ratings/${mediaId}`);
    if (!response.ok) throw new Error('Failed to fetch ratings');
    return response.json();
  },

  async getUserRatingHistory() {
    const response = await fetch('/api/user/ratings');
    if (!response.ok) throw new Error('Failed to fetch rating history');
    return response.json();
  }
};

// Example: Context for Global Rating State
// contexts/RatingContext.tsx

import React, { createContext, useContext, useState } from 'react';

interface RatingContextType {
  currentMediaRatings: Map<string, number>;
  addRating: (mediaId: string, rating: number) => void;
  getRating: (mediaId: string) => number | undefined;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export function RatingProvider({ children }: { children: React.ReactNode }) {
  const [currentMediaRatings, setCurrentMediaRatings] = useState<Map<string, number>>(new Map());

  const addRating = (mediaId: string, rating: number) => {
    setCurrentMediaRatings(prev => new Map(prev).set(mediaId, rating));
  };

  const getRating = (mediaId: string) => {
    return currentMediaRatings.get(mediaId);
  };

  return (
    <RatingContext.Provider value={{ currentMediaRatings, addRating, getRating }}>
      {children}
    </RatingContext.Provider>
  );
}

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) throw new Error('useRating must be used within RatingProvider');
  return context;
};
