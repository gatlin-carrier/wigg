import { z } from 'zod';

// Form validation schema for creating WIGG points
export const wiggPointFormSchema = z.object({
  mediaTitle: z.string().min(1, "Media title is required"),
  mediaType: z.enum(["Game", "Movie", "TV Show", "Book", "Podcast"]),
  posValue: z.string().min(1, "Position is required"),
  posKind: z.enum(["sec", "min", "hour", "page", "chapter", "episode"]),
  reasonShort: z.string().optional(),
  tags: z.string().optional(),
  spoilerLevel: z.enum(["0", "1", "2"]).default("0")
});

export type WiggPointForm = z.infer<typeof wiggPointFormSchema>;