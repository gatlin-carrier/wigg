import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { listWiggPoints, createWiggPoint } from '../services/wiggPointsService';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      throw new Error('Supabase fallback should not be called in this test');
    }),
    rpc: vi.fn(() => {
      throw new Error('Supabase fallback should not be called in this test');
    }),
  },
}));

describe('wiggPointsService', () => {
  it('parses list responses with zod schemas', async () => {
    server.use(
      http.get('http://localhost/api/wigg-points', () =>
        HttpResponse.json({
          wiggs: [
            {
              id: '1',
              mediaTitle: 'Test Media',
              mediaType: 'game',
              position: { kind: 'min', value: 12 },
              reasonShort: 'Exciting twist',
              tags: ['fast'],
              spoilerLevel: '0',
              createdAt: '2024-01-01T00:00:00.000Z',
              username: 'alice',
              userId: 'user-1',
            },
          ],
        }),
      ),
    );

    const result = await listWiggPoints({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].mediaTitle).toBe('Test Media');
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('creates wigg points via the API client', async () => {
    server.use(
      http.post('http://localhost/api/wigg-points', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.mediaTitle).toBe('Created Media');
        return HttpResponse.json({
          wigg: {
            id: '2',
            mediaTitle: 'Created Media',
            mediaType: 'game',
            position: { kind: 'min', value: 42 },
            reasonShort: null,
            tags: [],
            spoilerLevel: '0',
            createdAt: '2024-01-02T00:00:00.000Z',
            username: 'bob',
            userId: 'user-2',
          },
        });
      }),
    );

    const created = await createWiggPoint({
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

    expect(created.id).toBe('2');
    expect(created.mediaTitle).toBe('Created Media');
  });

});
