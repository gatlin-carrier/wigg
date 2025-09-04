import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Film, Users, Plus, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { type SwipeValue } from "./SwipeRating";

export interface MovieScene {
  id: string;
  timestampSeconds: number;
  sceneName: string;
  description?: string;
  votes: number;
  verified: boolean;
  submittedBy: string;
}

interface SceneSelectorProps {
  mediaTitle: string;
  mediaType: "movie" | "game";
  runtime?: number; // Runtime in minutes
  scenes: MovieScene[];
  onSceneSelect: (scene: MovieScene, rating: SwipeValue) => void;
  onManualTimeSubmit: (hours: number, minutes: number, rating: SwipeValue, comment?: string) => void;
  onAddScene: (timestampSeconds: number, sceneName: string, description?: string) => void;
  onEditPlaytime?: () => void;
  className?: string;
}

export function SceneSelector({
  mediaTitle,
  mediaType,
  runtime,
  scenes,
  onSceneSelect,
  onManualTimeSubmit,
  onAddScene,
  onEditPlaytime,
  className = ""
}: SceneSelectorProps) {
  const [mode, setMode] = useState<"scenes" | "manual" | "add">("manual");
  const [selectedScene, setSelectedScene] = useState<MovieScene | null>(null);
  const [rating, setRating] = useState<SwipeValue | null>(null);
  
  // Manual time input state
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [comment, setComment] = useState("");
  
  // Add scene state
  const [newSceneTime, setNewSceneTime] = useState({ hours: 0, minutes: 0 });
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:00` : `${mins}:00`;
  };

  const generateAutoChapters = (): MovieScene[] => {
    if (!runtime) return [];
    
    const chapterLength = 15; // 15 minute chapters
    const numChapters = Math.ceil(runtime / chapterLength);
    
    return Array.from({ length: numChapters }, (_, i) => ({
      id: `auto-${i}`,
      timestampSeconds: i * chapterLength * 60,
      sceneName: `Chapter ${i + 1}`,
      description: `${formatTime(i * chapterLength * 60)} - ${formatTime(Math.min((i + 1) * chapterLength * 60, runtime * 60))}`,
      votes: 0,
      verified: false,
      submittedBy: "auto"
    }));
  };

  const getSceneSourceInfo = (scene: MovieScene) => {
    if (scene.submittedBy === 'auto') {
      return { icon: Clock, label: 'Auto', color: 'bg-gray-500/10 text-gray-700 border-gray-200' };
    } else {
      return { icon: Users, label: 'Community', color: 'bg-green-500/10 text-green-700 border-green-200' };
    }
  };

  const getRatingData = (value: SwipeValue) => {
    switch (value) {
      case 0: return { label: "Never Gets Good", color: "#94A3B8", emoji: "😴" };
      case 1: return { label: "Eventually Gets Good", color: "#F59E0B", emoji: "🌱" };
      case 2: return { label: "Gets Really Good", color: "#3B82F6", emoji: "⚡" };
      case 3: return { label: "Peak Experience", color: "#EF4444", emoji: "🔥" };
    }
  };

  const allScenes = [...scenes, ...generateAutoChapters()].sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  const handleSceneSubmit = () => {
    if (selectedScene && rating !== null) {
      onSceneSelect(selectedScene, rating);
    }
  };

  const handleManualSubmit = () => {
    if (rating !== null) {
      onManualTimeSubmit(hours, minutes, rating, comment);
    }
  };

  const handleAddScene = () => {
    if (newSceneName.trim()) {
      const timestampSeconds = newSceneTime.hours * 3600 + newSceneTime.minutes * 60;
      onAddScene(timestampSeconds, newSceneName.trim(), newSceneDescription.trim() || undefined);
      
      // Reset form
      setNewSceneTime({ hours: 0, minutes: 0 });
      setNewSceneName("");
      setNewSceneDescription("");
      setMode("scenes");
    }
  };

  return (
    <Card className={`rounded-2xl shadow-sm w-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Film className="h-4 w-4" />
          When does {mediaTitle} get good?
        </CardTitle>
        <CardDescription className="text-xs">
          Select a scene/chapter or enter a specific time
        </CardDescription>
        {mediaType === "movie" && runtime && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Runtime: {Math.floor(runtime / 60)}h {runtime % 60}m ({runtime} min)
            </Badge>
          </div>
        )}
        {mediaType === "game" && runtime && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Your completion: {runtime === Infinity ? "∞" : `${Math.floor(runtime)}h ${Math.round((runtime % 1) * 60)}m`}
            </Badge>
            {onEditPlaytime && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditPlaytime}
                className="h-6 w-6 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selector */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setMode("scenes")}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
              mode === "scenes" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Film className="h-3 w-3 inline mr-1" />
            Scenes
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
              mode === "manual" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3 inline mr-1" />
            Manual
          </button>
          <button
            onClick={() => setMode("add")}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
              mode === "add" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Plus className="h-3 w-3 inline mr-1" />
            Add Scene
          </button>
        </div>

        {/* Scene Selection Mode */}
        {mode === "scenes" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Scene/Chapter</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allScenes.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No scenes available. Switch to Manual mode or Add a scene.
                </div>
              ) : (
                allScenes.map((scene) => {
                  const sourceInfo = getSceneSourceInfo(scene);
                  const SourceIcon = sourceInfo.icon;
                  
                  return (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedScene?.id === scene.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm">{scene.sceneName}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatTime(scene.timestampSeconds)}
                            {runtime && (
                              <span className="ml-1 text-muted-foreground">
                                ({Math.round((scene.timestampSeconds / (runtime * (mediaType === "movie" ? 60 : 3600))) * 100)}%)
                              </span>
                            )}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${sourceInfo.color}`}>
                            <SourceIcon className="h-3 w-3 mr-1" />
                            {sourceInfo.label}
                          </Badge>
                          {scene.verified && scene.submittedBy !== 'auto' && (
                            <Badge variant="default" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {scene.votes}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {scene.description && (
                        <div className="text-xs text-muted-foreground">{scene.description}</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Manual Time Mode */}
        {mode === "manual" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Point</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="10"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="text-center"
                  placeholder="0"
                />
              </div>
              <div className="text-muted-foreground">:</div>
              <div className="flex-1">
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, parseInt(e.target.value) || 0))}
                  className="text-center"
                  placeholder="00"
                />
              </div>
            </div>
            {(hours > 0 || minutes > 0) && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {hours}h {minutes.toString().padStart(2, '0')}m
                </Badge>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="manual-comment" className="text-sm font-medium">
                Quick note (optional)
              </Label>
              <Input
                id="manual-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., 'After the slow intro' or 'When the action starts'"
                className="text-sm"
                maxLength={100}
              />
            </div>
          </div>
        )}

        {/* Add Scene Mode */}
        {mode === "add" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add New Scene</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="scene-hours" className="text-xs text-muted-foreground">Hours</Label>
                <Input
                  id="scene-hours"
                  type="number"
                  min="0"
                  max="10"
                  value={newSceneTime.hours}
                  onChange={(e) => setNewSceneTime(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                  className="text-center"
                  placeholder="0"
                />
              </div>
              <div className="text-muted-foreground">:</div>
              <div className="flex-1">
                <Label htmlFor="scene-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  id="scene-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={newSceneTime.minutes}
                  onChange={(e) => setNewSceneTime(prev => ({ ...prev, minutes: Math.min(59, parseInt(e.target.value) || 0) }))}
                  className="text-center"
                  placeholder="00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scene-name" className="text-sm font-medium">Scene Name</Label>
              <Input
                id="scene-name"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder="e.g., 'Opening Chase', 'The Reveal', 'Final Battle'"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scene-description" className="text-sm font-medium">Description (optional)</Label>
              <Input
                id="scene-description"
                value={newSceneDescription}
                onChange={(e) => setNewSceneDescription(e.target.value)}
                placeholder="Brief description of what happens"
                maxLength={200}
              />
            </div>
            <Button 
              onClick={handleAddScene}
              disabled={!newSceneName.trim()}
              className="w-full"
            >
              Add Scene to Database
            </Button>
          </div>
        )}

        {/* Rating Selection (shown for scenes and manual modes) */}
        {(mode === "scenes" || mode === "manual") && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">How good does it get?</Label>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1, 2, 3] as SwipeValue[]).map((value) => {
                const ratingData = getRatingData(value);
                return (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      rating === value 
                        ? "border-primary bg-primary/10 scale-105" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-lg mb-1">{ratingData.emoji}</div>
                    <div className="text-xs font-medium">{ratingData.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {mode === "scenes" && (
          <Button 
            onClick={handleSceneSubmit}
            disabled={!selectedScene || rating === null}
            className="w-full"
            size="lg"
          >
            Rate Selected Scene
          </Button>
        )}

        {mode === "manual" && (
          <Button 
            onClick={handleManualSubmit}
            disabled={rating === null || (hours === 0 && minutes === 0)}
            className="w-full"
            size="lg"
          >
            Submit Time-Based Rating
          </Button>
        )}
      </CardContent>
    </Card>
  );
}