import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export async function populateMetrics(): Promise<void> {
  // Execute SQL to populate user_first_good table
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO public.user_first_good (user_id, title_id, first_good_pct)
      SELECT DISTINCT ON (user_id, media_id)
        user_id,
        media_id as title_id,
        pos_value as first_good_pct
      FROM public.wigg_points
      WHERE
        pos_kind = 'percent'
        AND (
          'rating_1' = ANY(tags) OR
          'rating_2' = ANY(tags) OR
          'rating_3' = ANY(tags)
        )
      ORDER BY user_id, media_id, pos_value ASC
      ON CONFLICT (user_id, title_id) DO UPDATE SET
        first_good_pct = EXCLUDED.first_good_pct,
        updated_at = now()
      WHERE public.user_first_good.first_good_pct > EXCLUDED.first_good_pct;
    `
  });

  if (error) {
    throw new Error(`Failed to populate user_first_good: ${error.message}`);
  }
}