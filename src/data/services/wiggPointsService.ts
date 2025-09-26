import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  CreateWiggPointPayload,
  CreateWiggPointPayloadSchema,
  CreateWiggPointResponseSchema,
  CreateWiggPointRequest,
  ListWiggPointsResponseSchema,
  MediaType,
  SupabaseWiggPointRowSchema,
} from "../schemas/wiggPoints";
import { ApiClientError, apiClient } from "../clients/apiClient";
import { WiggPoint, mapDtoToWiggPoint, mapSupabaseRowToDto } from "../mappers/wiggPoints";

export type WiggPointSort = "newest" | "oldest" | "position_asc" | "position_desc";

export interface ListWiggPointsParams {
  readonly limit?: number;
  readonly searchTerm?: string;
  readonly mediaType?: MediaType | "all";
  readonly sortBy?: WiggPointSort;
  readonly userId?: string;
}

export interface CreateWiggPointInput extends CreateWiggPointRequest {
  readonly userId: string;
  readonly username?: string | null;
}

export const DEFAULT_WIGG_POINT_LIMIT = 20;
const SUPABASE_SELECT = `
  id,
  pos_kind,
  pos_value,
  reason_short,
  tags,
  spoiler,
  created_at,
  user_id,
  media:media!inner(title,type),
  profiles:profiles(username)
`;

export async function listWiggPoints(params: ListWiggPointsParams = {}): Promise<WiggPoint[]> {
  try {
    const response = await apiClient.get("/wigg-points", ListWiggPointsResponseSchema, buildQueryParams(params));
    return response.wiggs.map(mapDtoToWiggPoint);
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (import.meta.env.DEV) {
        console.warn("Falling back to Supabase wigg_points query", error);
      }
      return listWiggPointsViaSupabase(params);
    }
    throw error;
  }
}

export async function createWiggPoint(input: CreateWiggPointInput): Promise<WiggPoint> {
  const payload = normaliseCreatePayload(input);

  try {
    const response = await apiClient.post("/wigg-points", CreateWiggPointResponseSchema, payload);
    return mapDtoToWiggPoint(response.wigg);
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (import.meta.env.DEV) {
        console.warn("Falling back to Supabase create", error);
      }
      const row = await createWiggPointViaSupabase(payload);
      return mapDtoToWiggPoint(mapSupabaseRowToDto(row));
    }
    throw error;
  }
}

async function listWiggPointsViaSupabase(params: ListWiggPointsParams): Promise<WiggPoint[]> {
  const limit = params.limit ?? DEFAULT_WIGG_POINT_LIMIT;
  let query = supabase
    .from("wigg_points")
    .select(SUPABASE_SELECT)
    .limit(limit);

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  const mediaType = params.mediaType?.toLowerCase() ?? "all";
  if (mediaType !== "all") {
    query = query.eq("media.type", mediaType as any);
  }

  if (params.searchTerm) {
    query = query.ilike("media.title", `%${params.searchTerm}%`);
  }

  switch (params.sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "position_asc":
      query = query.order("pos_value", { ascending: true });
      break;
    case "position_desc":
      query = query.order("pos_value", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) {
    throw new ApiClientError("Supabase query failed", { details: error });
  }

  const parsed = z.array(SupabaseWiggPointRowSchema).parse(data ?? []);
  return parsed.map(row => mapDtoToWiggPoint(mapSupabaseRowToDto(row)));
}

async function createWiggPointViaSupabase(payload: CreateWiggPointPayload) {
  const { data: mediaId, error: mediaError } = await supabase.rpc("upsert_media", {
    p_type: payload.mediaType as any,
    p_title: payload.mediaTitle,
    p_year: null,
  });
  if (mediaError) {
    throw new ApiClientError("Failed to upsert media", { details: mediaError });
  }
  const parsedMediaId = z.string().uuid().parse(mediaId);

  const { data: wiggId, error: wiggError } = await supabase.rpc("add_wigg", {
    p_media_id: parsedMediaId,
    p_episode_id: null,
    p_user_id: payload.userId,
    p_pos_kind: payload.posKind as any,
    p_pos_value: payload.posValue,
    p_tags: payload.tags,
    p_reason_short: payload.reasonShort ?? null,
    p_spoiler: payload.spoilerLevel as any,
  });
  if (wiggError) {
    throw new ApiClientError("Failed to add wigg point", { details: wiggError });
  }
  const parsedWiggId = z.string().uuid().parse(wiggId);

  const { data, error } = await supabase
    .from("wigg_points")
    .select(SUPABASE_SELECT)
    .eq("id", parsedWiggId)
    .single();
  if (error) {
    throw new ApiClientError("Failed to load inserted wigg point", { details: error });
  }

  return SupabaseWiggPointRowSchema.parse(data);
}

function buildQueryParams(params: ListWiggPointsParams) {
  return {
    limit: params.limit ?? DEFAULT_WIGG_POINT_LIMIT,
    search: params.searchTerm,
    mediaType: params.mediaType,
    sortBy: params.sortBy,
    userId: params.userId,
  } satisfies Record<string, string | number | boolean | undefined>;
}

function normaliseCreatePayload(input: CreateWiggPointInput): CreateWiggPointPayload {
  const parsed = CreateWiggPointPayloadSchema.parse({
    mediaTitle: input.mediaTitle,
    mediaType: input.mediaType.toLowerCase() as MediaType,
    posKind: input.posKind,
    posValue: input.posValue,
    reasonShort: input.reasonShort ?? null,
    tags: input.tags ?? [],
    spoilerLevel: input.spoilerLevel,
    userId: input.userId,
    username: input.username ?? null,
  });
  return parsed;
}
