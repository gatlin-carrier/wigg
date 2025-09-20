import { supabase } from '@/integrations/supabase/client';

export type NotificationChannel = 'in_app' | 'push' | 'email';

export async function dispatchNotification(params: {
  userId: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}) {
  const { data, error } = await supabase.functions.invoke('notifications-dispatch', {
    body: params,
  });
  if (error) {
    console.error('[NotificationService] dispatch failed', error);
    throw error;
  }
  return data;
}
