import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type DispatchPayload = {
  userId: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  channels?: Array<'in_app' | 'push' | 'email'>;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: DispatchPayload;
  try {
    payload = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload', details: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { userId, title, body, data, channels = ['in_app'] } = payload;
  if (!userId || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields userId or title' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: Record<string, unknown> = {};

  if (channels.includes('in_app')) {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type: 'in_app',
      title,
      body,
      data: data ?? null,
    });
    if (error) {
      console.error('[notifications-dispatch] Failed to insert in-app notification', error);
      results.in_app = { error: error.message };
    } else {
      results.in_app = { success: true };
    }
  }

  if (channels.includes('email')) {
    if (!RESEND_API_KEY) {
      results.email = { error: 'Missing RESEND_API_KEY' };
    } else {
      const { data: userRes, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !userRes?.user?.email) {
        results.email = { error: userError?.message ?? 'User email not found' };
      } else {
        const emailBody = body ?? 'You have a new notification on WIGG.';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'WIGG Notifications <notify@wigg.app>',
            to: userRes.user.email,
            subject: title,
            html: `<p>${emailBody}</p>` + (data && typeof data.url === 'string' ? `<p><a href="${data.url}">Open WIGG</a></p>` : ''),
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error('[notifications-dispatch] Email send failed', text);
          results.email = { error: 'Failed to send email' };
        } else {
          results.email = { success: true };
        }
      }
    }
  }

  if (channels.includes('push')) {
    results.push = { queued: true };
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
