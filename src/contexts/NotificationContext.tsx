import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  followerUpdates: boolean;
  wiggLikes: boolean;
  t2gUpdates: boolean;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  pushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (input: Partial<NotificationPreferences>) => Promise<void>;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

function mapPreferences(row: any | null): NotificationPreferences {
  if (!row) {
    return {
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
      followerUpdates: true,
      wiggLikes: true,
      t2gUpdates: true,
    };
  }
  return {
    pushEnabled: Boolean(row.push_enabled),
    emailEnabled: Boolean(row.email_enabled),
    inAppEnabled: Boolean(row.in_app_enabled),
    followerUpdates: Boolean(row.follower_updates),
    wiggLikes: Boolean(row.wigg_likes),
    t2gUpdates: Boolean(row.t2g_updates),
  };
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const pushSupported = useMemo(() => typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator, []);
  const pushPermission = pushSupported ? Notification.permission : 'unsupported';

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Notifications] Failed to load preferences', error);
      return;
    }

    if (!data) {
      const defaults = mapPreferences(null);
      await supabase.from('user_notification_preferences').insert({ user_id: user.id });
      setPreferences(defaults);
      return;
    }

    setPreferences(mapPreferences(data));
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setLoading(false);
    if (error) {
      console.error('[Notifications] Failed to load notifications', error);
      return;
    }
    setNotifications((data || []).map(mapRow));
  }, [user]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchPreferences()]);
  }, [fetchNotifications, fetchPreferences]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setPreferences(null);
      if (channelRef.current) {
        channelRef.current.unsubscribe().catch(() => undefined);
        channelRef.current = null;
      }
      return;
    }

    refresh();

    const channel = supabase.channel(`notifications-${user.id}`);
    channel.on('postgres_changes', {
      schema: 'public',
      table: 'notifications',
      event: 'INSERT',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      const row = payload.new as any;
      setNotifications((current) => [mapRow(row), ...current]);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe().catch(() => undefined);
      channelRef.current = null;
    };
  }, [user, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[Notifications] Failed to mark as read', error);
      return;
    }
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: timestamp })
      .eq('user_id', user.id)
      .is('read_at', null);
    if (error) {
      console.error('[Notifications] Failed to mark all as read', error);
      return;
    }
    setNotifications((current) => current.map((n) => ({ ...n, readAt: n.readAt ?? timestamp })));
  }, [user]);

  const updatePreferences = useCallback(async (input: Partial<NotificationPreferences>) => {
    if (!user) return;
    const next = { ...mapPreferences(null), ...preferences, ...input };
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        push_enabled: next.pushEnabled,
        email_enabled: next.emailEnabled,
        in_app_enabled: next.inAppEnabled,
        follower_updates: next.followerUpdates,
        wigg_likes: next.wiggLikes,
        t2g_updates: next.t2gUpdates,
      });
    if (error) {
      console.error('[Notifications] Failed to update preferences', error);
      toast({ title: 'Could not save preferences', description: error.message, variant: 'destructive' });
      return;
    }
    setPreferences(next);
  }, [user, preferences, toast]);

  const enablePush = useCallback(async () => {
    if (!user) return;
    if (!pushSupported) {
      toast({ title: 'Push not supported', description: 'Your browser does not support push notifications.' });
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      toast({ title: 'Push unavailable', description: 'Missing VAPID key configuration.' });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast({ title: 'Permission required', description: 'Enable notifications in your browser to receive alerts.' });
      return;
    }
    const registration = await navigator.serviceWorker.register('/sw.js');
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const json = sub.toJSON() as any;
    const { error } = await supabase.from('notification_push_tokens').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      auth: json.keys?.auth ?? '',
      p256dh: json.keys?.p256dh ?? '',
      expiration_time: sub.expirationTime ? new Date(sub.expirationTime).toISOString() : null,
    });
    if (error) {
      console.error('[Notifications] Failed to save push subscription', error);
      toast({ title: 'Could not enable push notifications', description: error.message, variant: 'destructive' });
      return;
    }
    await updatePreferences({ pushEnabled: true });
    toast({ title: 'Push notifications enabled', description: 'We’ll let you know when there is activity you care about.' });
  }, [user, pushSupported, toast, updatePreferences]);

  const disablePush = useCallback(async () => {
    if (!user) return;
    if (pushSupported) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe().catch(() => undefined);
        await supabase
          .from('notification_push_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint);
      }
    }
    await updatePreferences({ pushEnabled: false });
    toast({ title: 'Push notifications disabled' });
  }, [user, pushSupported, updatePreferences, toast]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    preferences,
    pushSupported,
    pushPermission,
    refresh,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    enablePush,
    disablePush,
  }), [notifications, unreadCount, loading, preferences, pushSupported, pushPermission, refresh, markAsRead, markAllAsRead, updatePreferences, enablePush, disablePush]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
