import { useMemo } from "react";
import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MediaTypeSchema } from "../schemas/wiggPoints";
import {
  CreateWiggPointInput,
  DEFAULT_WIGG_POINT_LIMIT,
  ListWiggPointsParams,
  createWiggPoint,
  listWiggPoints,
} from "../services/wiggPointsService";
import { WiggPoint } from "../mappers/wiggPoints";

const QUERY_KEY = "wiggPoints";

type QueryKey = readonly [typeof QUERY_KEY, NormalisedListParams];

interface NormalisedListParams {
  readonly limit: number;
  readonly searchTerm?: string;
  readonly mediaType?: string;
  readonly sortBy?: string;
  readonly userId?: string;
}

function normaliseListParams(params: ListWiggPointsParams = {}): NormalisedListParams {
  return {
    limit: params.limit ?? DEFAULT_WIGG_POINT_LIMIT,
    searchTerm: params.searchTerm || undefined,
    mediaType: params.mediaType && params.mediaType !== "all" ? params.mediaType : undefined,
    sortBy: params.sortBy || undefined,
    userId: params.userId || undefined,
  } satisfies NormalisedListParams;
}

export function createWiggPointsKey(params: ListWiggPointsParams = {}): QueryKey {
  return [QUERY_KEY, normaliseListParams(params)] as const;
}

export function useWiggPoints(
  params: ListWiggPointsParams = {},
  options?: UseQueryOptions<WiggPoint[], Error, WiggPoint[], QueryKey>,
): UseQueryResult<WiggPoint[], Error> {
  const key = useMemo(() => createWiggPointsKey(params), [params]);
  return useQuery({
    queryKey: key,
    queryFn: () => listWiggPoints(params),
    staleTime: 1000 * 60,
    ...options,
  });
}

interface UseCreateWiggPointOptions<TContext> extends Partial<UseMutationOptions<WiggPoint, Error, CreateWiggPointInput, TContext>> {
  readonly listParams?: ListWiggPointsParams;
}

interface CreateContext {
  readonly previous?: WiggPoint[];
  readonly queryKey: QueryKey;
  readonly optimisticId: string;
}

export function useCreateWiggPoint(
  options: UseCreateWiggPointOptions<CreateContext> = {},
): UseMutationResult<WiggPoint, Error, CreateWiggPointInput, CreateContext> {
  const queryClient = useQueryClient();
  const listKey = useMemo(() => createWiggPointsKey(options.listParams ?? {}), [options.listParams]);

  return useMutation<WiggPoint, Error, CreateWiggPointInput, CreateContext>({
    mutationFn: createWiggPoint,
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<WiggPoint[]>(listKey);
      const optimistic = buildOptimisticPoint(variables);
      queryClient.setQueryData<WiggPoint[]>(listKey, current => [optimistic, ...(current ?? [])]);
      return { previous, queryKey: listKey, optimisticId: optimistic.id } satisfies CreateContext;
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
      if (!context) return;
      queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSuccess: (data, variables, context) => {
      options.onSuccess?.(data, variables, context);
      if (!context) return;
      queryClient.setQueryData<WiggPoint[]>(context.queryKey, current => {
        const withoutOptimistic = (current ?? []).filter(item => item.id !== context.optimisticId);
        return [data, ...withoutOptimistic];
      });
    },
    onSettled: (data, error, variables, context) => {
      options.onSettled?.(data, error, variables, context);
      if (!context) return;
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  });
}

function buildOptimisticPoint(input: CreateWiggPointInput): WiggPoint {
  const mediaType = MediaTypeSchema.parse(input.mediaType);
  return {
    id: `temp-${Date.now()}`,
    mediaTitle: input.mediaTitle,
    mediaType,
    posKind: input.posKind,
    posValue: input.posValue,
    reasonShort: input.reasonShort ?? null,
    tags: input.tags ?? [],
    spoilerLevel: input.spoilerLevel,
    createdAt: new Date(),
    username: input.username ?? null,
    userId: input.userId,
  } satisfies WiggPoint;
}
