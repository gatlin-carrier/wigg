import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  className?: string;
}

export function WhyTagSelector({
  selectedTags,
  onTagsChange,
  spoilerLevel,
  onSpoilerChange,
  className = "",
}: WhyTagSelectorProps) {
  const toggleTag = (tagId: string) => {
    onTagsChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

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