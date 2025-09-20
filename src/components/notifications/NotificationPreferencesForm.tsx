import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';

export function NotificationPreferencesForm() {
  const { preferences, updatePreferences, enablePush, disablePush, pushSupported, pushPermission } = useNotifications();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (!preferences) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Notification preferences</CardTitle>
          <CardDescription>Loading your current settings…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const togglePreference = async (key: keyof typeof preferences, value: boolean) => {
    setPendingKey(key);
    await updatePreferences({ [key]: value } as any);
    setPendingKey(null);
  };

  const togglePush = async () => {
    setPendingKey('pushEnabled');
    if (preferences.pushEnabled) {
      await disablePush();
    } else {
      await enablePush();
    }
    setPendingKey(null);
  };

  const permissionBlocked = pushPermission === 'denied';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification preferences</CardTitle>
        <CardDescription>Choose how WIGG keeps you in the loop.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Channels</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">In-app alerts</p>
                <p className="text-xs text-muted-foreground">Show new activity in the notification bell.</p>
              </div>
              <Switch
                checked={preferences.inAppEnabled}
                onCheckedChange={(checked) => togglePreference('inAppEnabled', checked)}
                disabled={pendingKey === 'inAppEnabled'}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Occasional summaries when you miss something important.</p>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => togglePreference('emailEnabled', checked)}
                disabled={pendingKey === 'emailEnabled'}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  Push notifications
                  {permissionBlocked && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Browser blocked</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pushSupported
                    ? 'Get instant alerts even when the app is closed.'
                    : 'Your browser does not support push notifications.'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant={preferences.pushEnabled ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={togglePush}
                  disabled={!pushSupported || pendingKey === 'pushEnabled'}
                >
                  {pendingKey === 'pushEnabled' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : preferences.pushEnabled ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </Button>
                {permissionBlocked && (
                  <p className="max-w-[16rem] text-right text-[11px] text-muted-foreground">
                    Push notifications are blocked at the browser level. Enable them in your site settings then try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Activity alerts</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">New followers</p>
                <p className="text-xs text-muted-foreground">Be notified when someone starts following you.</p>
              </div>
              <Switch
                checked={preferences.followerUpdates}
                onCheckedChange={(checked) => togglePreference('followerUpdates', checked)}
                disabled={pendingKey === 'followerUpdates'}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Likes on your WIGG points</p>
                <p className="text-xs text-muted-foreground">Celebrate when someone vibes with your recommendation.</p>
              </div>
              <Switch
                checked={preferences.wiggLikes}
                onCheckedChange={(checked) => togglePreference('wiggLikes', checked)}
                disabled={pendingKey === 'wiggLikes'}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">T2G updates</p>
                <p className="text-xs text-muted-foreground">Hear when fresh T2G insights land for titles you follow.</p>
              </div>
              <Switch
                checked={preferences.t2gUpdates}
                onCheckedChange={(checked) => togglePreference('t2gUpdates', checked)}
                disabled={pendingKey === 't2gUpdates'}
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferencesForm;
