import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SceneSelector, type MovieScene } from "./SceneSelector";
import { useMovieScenes, useAddMovieScene } from "@/hooks/useMovieScenes";
import { type SwipeValue } from "./SwipeRating";

interface TimeBasedRatingProps {
  mediaType: "movie" | "game";
  mediaTitle: string;
  mediaId: string | number;
  runtime?: number; // Runtime in minutes
  onRatingSubmit: (hours: number, minutes: number, rating: SwipeValue, comment?: string) => void;
  onSceneRatingSubmit: (scene: MovieScene, rating: SwipeValue) => void;
  className?: string;
}

export function TimeBasedRating({ 
  mediaType, 
  mediaTitle,
  mediaId,
  runtime,
  onRatingSubmit,
  onSceneRatingSubmit,
  className = "" 
}: TimeBasedRatingProps) {
  const [submitted, setSubmitted] = useState(false);
  
  const { data: scenes = [], isLoading } = useMovieScenes(mediaId.toString(), mediaTitle);
  const addSceneMutation = useAddMovieScene();

  const handleSceneSelect = (scene: MovieScene, rating: SwipeValue) => {
    onSceneRatingSubmit(scene, rating);
    setSubmitted(true);
  };

  const handleManualTimeSubmit = (hours: number, minutes: number, rating: SwipeValue, comment?: string) => {
    onRatingSubmit(hours, minutes, rating, comment);
    setSubmitted(true);
  };

  const handleAddScene = async (timestampSeconds: number, sceneName: string, description?: string) => {
    try {
      await addSceneMutation.mutateAsync({
        mediaId: mediaId.toString(),
        timestampSeconds,
        sceneName,
        description,
      });
    } catch (error) {
      console.error('Failed to add scene:', error);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-semibold mb-2">Rating Submitted! ✨</div>
        <p className="text-sm text-muted-foreground mb-4">
          Thanks for sharing when {mediaTitle} gets good
        </p>
        <Button 
          variant="outline" 
          onClick={() => setSubmitted(false)}
          className="w-full sm:w-auto"
        >
          Rate Another Time Point
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Loading scenes...</div>
      </div>
    );
  }

  return (
    <SceneSelector
      mediaTitle={mediaTitle}
      mediaType={mediaType}
      runtime={runtime}
      scenes={scenes}
      onSceneSelect={handleSceneSelect}
      onManualTimeSubmit={handleManualTimeSubmit}
      onAddScene={handleAddScene}
      className={className}
    />
  );
}