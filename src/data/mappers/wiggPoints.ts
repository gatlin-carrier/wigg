import { z } from "zod";
import {
  CreateWiggPointRequest,
  MediaTypeSchema,
  PositionKindSchema,
  SpoilerLevelSchema,
  SupabaseWiggPointRow,
  WiggPointDto,
  WiggPointDtoSchema,
} from "../schemas/wiggPoints";

export const WiggPointSchema = z.object({
  id: z.string(),
  mediaTitle: z.string(),
  mediaType: MediaTypeSchema,
  posKind: PositionKindSchema,
  posValue: z.number(),
  reasonShort: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  spoilerLevel: SpoilerLevelSchema,
  createdAt: z.date(),
  username: z.string().nullable().optional(),
  userId: z.string(),
});
export type WiggPoint = z.infer<typeof WiggPointSchema>;

export function mapDtoToWiggPoint(dto: WiggPointDto): WiggPoint {
  return WiggPointSchema.parse({
    id: dto.id,
    mediaTitle: dto.mediaTitle,
    mediaType: dto.mediaType,
    posKind: dto.position.kind,
    posValue: dto.position.value,
    reasonShort: dto.reasonShort ?? null,
    tags: dto.tags ?? [],
    spoilerLevel: dto.spoilerLevel,
    createdAt: new Date(dto.createdAt),
    username: dto.username ?? null,
    userId: dto.userId,
  });
}

export function mapSupabaseRowToDto(row: SupabaseWiggPointRow): WiggPointDto {
  return WiggPointDtoSchema.parse({
    id: row.id,
    mediaTitle: row.media?.title ?? "Unknown",
    mediaType: row.media?.type ?? "game",
    position: { kind: row.pos_kind, value: row.pos_value },
    reasonShort: row.reason_short,
    tags: row.tags ?? [],
    spoilerLevel: row.spoiler,
    createdAt: row.created_at,
    username: row.profiles?.username ?? null,
    userId: row.user_id,
  });
}

export function buildOptimisticWiggPoint(
  input: CreateWiggPointRequest,
  overrides: Partial<Pick<WiggPoint, "id" | "createdAt" | "userId" | "username">> = {},
): WiggPoint {
  return mapDtoToWiggPoint({
    id: overrides.id ?? `temp-${Date.now()}`,
    mediaTitle: input.mediaTitle,
    mediaType: input.mediaType,
    position: { kind: input.posKind, value: input.posValue },
    reasonShort: input.reasonShort ?? null,
    tags: input.tags ?? [],
    spoilerLevel: input.spoilerLevel,
    createdAt: (overrides.createdAt ?? new Date()).toISOString(),
    username: overrides.username ?? null,
    userId: overrides.userId ?? "", // replaced once server responds
  });
}
