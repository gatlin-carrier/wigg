import { http, HttpResponse } from 'msw';

export const socialHandlers = [
  // Get like count for a wigg point
  http.post('https://test.supabase.co/rest/v1/rpc/get_wigg_point_like_count', () => {
    return HttpResponse.json(5, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }),

  // Catch-all handler for debugging
  http.all('https://test.supabase.co/*', () => {
    return HttpResponse.json({ error: 'No handler found' }, { status: 404 });
  }),
];