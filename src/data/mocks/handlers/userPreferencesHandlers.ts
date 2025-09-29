import { http, HttpResponse } from 'msw';

export const userPreferencesHandlers = [
  // Get user preferences (.single() returns single object)
  http.get('https://test.supabase.co/rest/v1/user_preferences', ({ request }) => {
    const url = new URL(request.url);

    // Supabase uses eq filter format: ?user_id=eq.value
    const userIdFilter = url.searchParams.get('user_id');
    const userId = userIdFilter?.replace('eq.', '') || 'user-123';

    return HttpResponse.json({
      id: `pref-${userId}`,
      user_id: userId,
      spoiler_sensitivity: 1,
      trusted_users: ['user-789'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }),
];