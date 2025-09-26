import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(() => {
      throw new Error('Supabase fallback should not be called in this test');
    }),
    rpc: vi.fn(() => {
      throw new Error('Supabase fallback should not be called in this test');
    }),
  },
}));

vi.mock('@/integrations/supabase/client', () => supabaseMock);

const serviceMocks = vi.hoisted(() => ({
  listWiggPoints: vi.fn(),
  createWiggPoint: vi.fn(),
}));

vi.mock('../../services/wiggPointsService', () => ({
  DEFAULT_WIGG_POINT_LIMIT: 20,
  listWiggPoints: serviceMocks.listWiggPoints,
  createWiggPoint: serviceMocks.createWiggPoint,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useWiggPoints hooks', () => {
  it('optimistically updates the cache when creating a wigg point', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = createWrapper(queryClient);

    const { useCreateWiggPoint, useWiggPoints, createWiggPointsKey } = await import('../useWiggPoints');

    const existingPoints = [
      {
        id: 'existing-1',
        mediaTitle: 'Existing Media',
        mediaType: 'game',
        posKind: 'min',
        posValue: 12,
        reasonShort: 'Existing reason',
        tags: [],
        spoilerLevel: '0',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        username: 'alice',
        userId: 'user-1',
      },
    ] as const;

    serviceMocks.listWiggPoints.mockResolvedValue(existingPoints);

    serviceMocks.createWiggPoint.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      const createdPoint = {
        id: 'created-1',
        mediaTitle: 'Created Media',
        mediaType: 'game',
        posKind: 'min',
        posValue: 42,
        reasonShort: null,
        tags: [],
        spoilerLevel: '0',
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        username: 'bob',
        userId: 'user-2',
      };
      serviceMocks.listWiggPoints.mockResolvedValue([createdPoint, ...existingPoints]);
      return createdPoint;
    });

    const { result } = renderHook(
      () => ({
        list: useWiggPoints(),
        create: useCreateWiggPoint(),
      }),
      { wrapper },
    );

    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    try {
      await waitFor(() => {
        expect(result.current.list.isSuccess).toBe(true);
        expect(result.current.list.data).toHaveLength(1);
      });
      expect(serviceMocks.listWiggPoints).toHaveBeenCalledTimes(1);

      let mutationPromise: Promise<unknown> | undefined;
      act(() => {
        mutationPromise = result.current.create.mutateAsync({
          mediaTitle: 'Created Media',
          mediaType: 'game',
          posKind: 'min',
          posValue: 42,
          reasonShort: null,
          tags: [],
          spoilerLevel: '0',
          userId: 'user-2',
          username: 'bob',
        });
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalled();
      });

      const [firstCall] = setQueryDataSpy.mock.calls;
      expect(firstCall?.[0]).toEqual(createWiggPointsKey());

      const optimisticSnapshot =
        typeof firstCall?.[1] === 'function'
          ? firstCall[1](existingPoints.map(point => ({ ...point })))
          : undefined;

      expect(optimisticSnapshot?.[0]?.mediaTitle).toBe('Created Media');
      expect(optimisticSnapshot?.[0]?.id).toMatch(/^temp-/);
      expect(optimisticSnapshot?.slice(1)).toEqual(existingPoints);

      await waitFor(() => {
        expect(serviceMocks.createWiggPoint).toHaveBeenCalledTimes(1);
      });

      if (!mutationPromise) {
        throw new Error('Mutation promise was not initialised');
      }

      await mutationPromise;

      await waitFor(() => {
        const [first, second] = result.current.list.data ?? [];
        expect(first?.id).toBe('created-1');
        expect(second?.id).toBe('existing-1');
      });
    } finally {
      serviceMocks.listWiggPoints.mockReset();
      serviceMocks.createWiggPoint.mockReset();
      setQueryDataSpy.mockRestore();
      queryClient.clear();
    }
  });
});
