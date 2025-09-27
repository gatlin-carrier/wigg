import React, { useState } from "react";
import { useForm, type Resolver, type FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, X, Tag } from "lucide-react";
import { wiggPointService } from "@/lib/api/services/wiggPoints";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { wiggPointFormSchema, type WiggPointForm } from "@/data/schemas/wiggPoints";

const wiggPointFormResolver: Resolver<WiggPointForm> = async (values) => {
  const result = wiggPointFormSchema.safeParse(values);

  if (result.success) {
    return {
      values: result.data,
      errors: {}
    };
  }

  const fieldErrors = result.error.issues.reduce((acc, issue) => {
    const fieldName = issue.path[0] as keyof WiggPointForm;
    acc[fieldName] = {
      type: issue.code,
      message: issue.message
    } as FieldError;
    return acc;
  }, {} as Partial<Record<keyof WiggPointForm, FieldError>>);

  return {
    values: {},
    errors: fieldErrors
  };
};

interface WiggPointFormProps {
  onSuccess?: () => void;
  initialData?: {
    title: string;
    type: "Game" | "Movie" | "TV Show" | "Book" | "Podcast";
  };
}

export const WiggPointForm = ({ onSuccess, initialData }: WiggPointFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const form = useForm<WiggPointForm>({
    resolver: wiggPointFormResolver,
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

    setIsSubmitting(true);

    try {
      // Convert position value to number
      const posValue = Number(data.posValue);
      if (Number.isNaN(posValue)) {
        form.setError('posValue', {
          type: "validate",
          message: "Position must be a number"
        });
        return;
      }

      // Use the WIGG Point Service
      const result = await wiggPointService.createWiggPoint({
        mediaTitle: data.mediaTitle,
        mediaType: data.mediaType.toLowerCase() as 'game' | 'movie' | 'tv show' | 'book' | 'podcast',
        posKind: data.posKind as 'sec' | 'min' | 'hour' | 'page' | 'chapter' | 'episode',
        posValue,
        tags: [...customTags, ...(data.tags ? [data.tags] : [])]
          .map((tag) => tag.trim())
          .filter(Boolean),
        reasonShort: data.reasonShort || null,
        spoilerLevel: parseInt(data.spoilerLevel, 10) as 0 | 1 | 2,
        userId: user.id
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      toast({
        title: "WIGG point added!",
        description: `Successfully recorded when ${data.mediaTitle} gets good`
      });

      form.reset({
        mediaTitle: initialData?.title || "",
        mediaType: initialData?.type || "Game",
        posValue: "",
        posKind: "min",
        reasonShort: "",
        tags: "",
        spoilerLevel: "0"
      });
      setCustomTags([]);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error adding WIGG point:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add WIGG point",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
                    <FormMessage>
                      {form.formState.errors.mediaTitle?.message}
                    </FormMessage>
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
                    <FormMessage>
                      {form.formState.errors.mediaType?.message}
                    </FormMessage>
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
                    <FormMessage>
                      {form.formState.errors.posValue?.message}
                    </FormMessage>
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="min">Minutes</SelectItem>
                        <SelectItem value="hour">Hours</SelectItem>
                        <SelectItem value="sec">Seconds</SelectItem>
                        <SelectItem value="page">Pages</SelectItem>
                        <SelectItem value="chapter">Chapters</SelectItem>
                        <SelectItem value="episode">Episodes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.posKind?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reasonShort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why does it get good? (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief explanation of what makes this the turning point..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.reasonShort?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags (press Enter to add)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. plot-twist, character-development"
                        onKeyPress={handleKeyPress}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.tags?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">No spoilers</SelectItem>
                      <SelectItem value="1">Minor spoilers</SelectItem>
                      <SelectItem value="2">Major spoilers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSpoilerDescription(form.watch("spoilerLevel"))}
                  </p>
                  <FormMessage>
                    {form.formState.errors.spoilerLevel?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? "Adding WIGG Point..." : "Add WIGG Point"}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Please log in to submit WIGG points
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};