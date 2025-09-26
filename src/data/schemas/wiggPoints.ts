import { z } from "zod";

export const PositionKindSchema = z.enum(["sec", "min", "hour", "page", "chapter", "episode"]);
export type PositionKind = z.infer<typeof PositionKindSchema>;

export const SpoilerLevelSchema = z.enum(["0", "1", "2"]);
export type SpoilerLevel = z.infer<typeof SpoilerLevelSchema>;

export const MediaTypeSchema = z.enum(["game", "movie", "tv show", "book", "podcast"]);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const WiggPointDtoSchema = z.object({
  id: z.string(),
  mediaTitle: z.string(),
  mediaType: MediaTypeSchema,
  position: z.object({
    kind: PositionKindSchema,
    value: z.number(),
  }),
  reasonShort: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  spoilerLevel: SpoilerLevelSchema,
  createdAt: z.string(),
  username: z.string().nullable().optional(),
  userId: z.string(),
});
export type WiggPointDto = z.infer<typeof WiggPointDtoSchema>;

export const ListWiggPointsResponseSchema = z.object({
  wiggs: z.array(WiggPointDtoSchema),
  total: z.number().nonnegative().optional(),
});
export type ListWiggPointsResponse = z.infer<typeof ListWiggPointsResponseSchema>;

export const CreateWiggPointRequestSchema = z.object({
  mediaTitle: z.string().min(1),
  mediaType: MediaTypeSchema,
  posKind: PositionKindSchema,
  posValue: z.number().finite(),
  reasonShort: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  spoilerLevel: SpoilerLevelSchema,
});
export type CreateWiggPointRequest = z.infer<typeof CreateWiggPointRequestSchema>;

export const CreateWiggPointPayloadSchema = CreateWiggPointRequestSchema.extend({
  userId: z.string(),
  username: z.string().nullable().optional(),
});
export type CreateWiggPointPayload = z.infer<typeof CreateWiggPointPayloadSchema>;

export const CreateWiggPointResponseSchema = z.object({
  wigg: WiggPointDtoSchema,
});
export type CreateWiggPointResponse = z.infer<typeof CreateWiggPointResponseSchema>;

export const SupabaseWiggPointRowSchema = z.object({
  id: z.string(),
  pos_kind: PositionKindSchema,
  pos_value: z.number(),
  reason_short: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  spoiler: SpoilerLevelSchema,
  created_at: z.string(),
  user_id: z.string(),
  media: z
    .object({
      title: z.string().nullable(),
      type: MediaTypeSchema.nullable(),
    })
    .nullable(),
  profiles: z
    .object({
      username: z.string().nullable(),
    })
    .nullable(),
});
export type SupabaseWiggPointRow = z.infer<typeof SupabaseWiggPointRowSchema>;

export const SupabaseInsertResultSchema = z.object({
  id: z.string(),
});
