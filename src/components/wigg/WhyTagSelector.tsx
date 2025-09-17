import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WHY_TAGS: { id: string; label: string; spoilerLevel: "none" | "light" | "heavy" }[] = [
  { id: "pacing", label: "Pacing ↑", spoilerLevel: "none" },
  { id: "world", label: "World opens", spoilerLevel: "none" },
  { id: "twist", label: "Plot twist", spoilerLevel: "light" },
  { id: "stakes", label: "Stakes ↑", spoilerLevel: "light" },
  { id: "humor", label: "Humor ↑", spoilerLevel: "none" },
  { id: "romance", label: "Romance clicks", spoilerLevel: "light" },
  { id: "art", label: "Art spike", spoilerLevel: "none" },
  { id: "fight", label: "Fight choreography", spoilerLevel: "light" },
  { id: "music", label: "Music hits", spoilerLevel: "none" },
  { id: "gut", label: "Emotional gut-punch", spoilerLevel: "heavy" },
  { id: "cliff", label: "Cliffhanger", spoilerLevel: "heavy" },
];

export type SpoilerLevel = "none" | "light" | "heavy";

interface WhyTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  spoilerLevel: SpoilerLevel;
  onSpoilerChange: (level: SpoilerLevel) => void;
  customTags?: string[];
  onCustomTagsChange?: (tags: string[]) => void;
  className?: string;
  loading?: boolean;
}

export function WhyTagSelector({
  selectedTags,
  onTagsChange,
  spoilerLevel,
  onSpoilerChange,
  customTags = [],
  onCustomTagsChange,
  className = "",
  loading = false,
}: WhyTagSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");

  const toggleTag = (tagId: string) => {
    onTagsChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

  const addCustomTag = () => {
    if (customTagInput.trim() && onCustomTagsChange) {
      const newTag = customTagInput.trim();
      if (!customTags.includes(newTag)) {
        onCustomTagsChange([...customTags, newTag]);
        onTagsChange([...selectedTags, newTag]);
      }
      setCustomTagInput("");
      setShowCustomInput(false);
    }
  };

  const removeCustomTag = (tagToRemove: string) => {
    if (onCustomTagsChange) {
      onCustomTagsChange(customTags.filter(tag => tag !== tagToRemove));
      onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-3">
          <div>
            <div className="text-xs mb-2">Why (optional)</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-xs">Spoiler level</Label>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div>
          <div className="text-xs mb-2">Why (optional)</div>
          <div className="flex flex-wrap gap-2">
            {WHY_TAGS.map((tag) => (
              <Button
                key={tag.id}
                size="sm"
                variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                className="rounded-full"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.label}
              </Button>
            ))}
            
            {/* Custom tags */}
            {customTags.map((tag) => (
              <Button
                key={`custom-${tag}`}
                size="sm"
                variant={selectedTags.includes(tag) ? "default" : "secondary"}
                className="rounded-full group"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <X 
                  className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomTag(tag);
                  }}
                />
              </Button>
            ))}
            
            {/* Add custom tag button/input */}
            {!showCustomInput ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowCustomInput(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Custom tag"
                  className="h-8 text-xs w-24"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                    if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomTagInput("");
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={addCustomTag}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTagInput("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label className="text-xs">Spoiler level</Label>
          {(["none", "light", "heavy"] as const).map((level) => (
            <label key={level} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={spoilerLevel === level}
                onCheckedChange={() => onSpoilerChange(level)}
              />
              <span className="capitalize">{level}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
