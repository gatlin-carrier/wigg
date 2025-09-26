import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, X, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { MediaTypeSchema, useCreateWiggPoint } from "@/data";

const wiggPointSchema = z.object({
  mediaTitle: z.string().min(1, "Media title is required"),
  mediaType: z.enum(["Game", "Movie", "TV Show", "Book", "Podcast"]),
  posValue: z.string().min(1, "Position is required"),
  posKind: z.enum(["sec", "min", "hour", "page", "chapter", "episode"]),
  reasonShort: z.string().optional(),
  tags: z.string().optional(),
  spoilerLevel: z.enum(["0", "1", "2"]).default("0")
});

type WiggPointForm = z.infer<typeof wiggPointSchema>;

interface WiggPointFormProps {
  onSuccess?: () => void;
  initialData?: {
    title: string;
    type: "Game" | "Movie" | "TV Show" | "Book" | "Podcast";
  };
}

export const WiggPointForm = ({ onSuccess, initialData }: WiggPointFormProps) => {
  const { user } = useAuth();
  const [customTags, setCustomTags] = useState<string[]>([]);
  const createWiggPoint = useCreateWiggPoint();

  const form = useForm<WiggPointForm>({
    resolver: zodResolver(wiggPointSchema),
    defaultValues: {
      mediaTitle: initialData?.title || "",
      mediaType: initialData?.type || "Game",
      posValue: "",
      posKind: "min",
      reasonShort: "",
      tags: "",
      spoilerLevel: "0"
    }
  });

  const addTag = (tag: string) => {
    if (tag && !customTags.includes(tag)) {
      setCustomTags([...customTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = form.getValues('tags')?.trim();
      if (tag) {
        addTag(tag);
        form.setValue('tags', '');
      }
    }
  };

  const onSubmit = async (data: WiggPointForm) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a WIGG point",
        variant: "destructive"
      });
      return;
    }

    try {
      const posValue = parseFloat(data.posValue);
      if (isNaN(posValue)) {
        throw new Error("Position value must be a valid number");
      }

      const mediaType = MediaTypeSchema.parse(data.mediaType.toLowerCase());
      const tags = [...customTags, ...(data.tags ? [data.tags] : [])]
        .map(tag => tag.trim())
        .filter(Boolean);

      await createWiggPoint.mutateAsync({
        mediaTitle: data.mediaTitle,
        mediaType,
        posKind: data.posKind,
        posValue,
        reasonShort: data.reasonShort?.trim() || null,
        tags,
        spoilerLevel: data.spoilerLevel,
        userId: user.id,
        username: user.user_metadata?.username ?? user.email ?? null,
      });

      toast({
        title: "WIGG point added!",
        description: `Successfully recorded when ${data.mediaTitle} gets good`
      });

      form.reset();
      setCustomTags([]);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error adding WIGG point:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add WIGG point",
        variant: "destructive"
      });
    }
  };

  const getPositionLabel = (kind: string) => {
    switch (kind) {
      case "sec": return "seconds";
      case "min": return "minutes";
      case "hour": return "hours";
      case "page": return "pages";
      case "chapter": return "chapters";
      case "episode": return "episodes";
      default: return kind;
    }
  };

  const getSpoilerDescription = (level: string) => {
    switch (level) {
      case "0": return "No spoilers";
      case "1": return "Minor spoilers";
      case "2": return "Major spoilers";
      default: return "No spoilers";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Add WIGG Point
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mark the moment when this media gets good
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Media Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mediaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter media title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mediaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select media type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Game">Game</SelectItem>
                        <SelectItem value="Movie">Movie</SelectItem>
                        <SelectItem value="TV Show">TV Show</SelectItem>
                        <SelectItem value="Book">Book</SelectItem>
                        <SelectItem value="Podcast">Podcast</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="posValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      When it gets good
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="posKind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sec">Seconds</SelectItem>
                        <SelectItem value="min">Minutes</SelectItem>
                        <SelectItem value="hour">Hours</SelectItem>
                        <SelectItem value="page">Pages</SelectItem>
                        <SelectItem value="chapter">Chapters</SelectItem>
                        <SelectItem value="episode">Episodes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Spoiler Level */}
            <FormField
              control={form.control}
              name="spoilerLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spoiler Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Spoiler level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">No spoilers</SelectItem>
                      <SelectItem value="1">Minor spoilers</SelectItem>
                      <SelectItem value="2">Major spoilers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSpoilerDescription(field.value)}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reasonShort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why does it get good?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share a short reason (optional)"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  {...form.register('tags')}
                  onKeyDown={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tag = form.getValues('tags')?.trim();
                    if (tag) {
                      addTag(tag);
                      form.setValue('tags', '');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={createWiggPoint.isPending}>
              {createWiggPoint.isPending ? "Saving..." : "Submit WIGG Point"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
