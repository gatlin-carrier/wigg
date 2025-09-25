import { useMemo, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

function formatTimestamp(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    enablePush,
    disablePush,
    preferences,
    pushSupported,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const notificationsForDisplay = useMemo(
    () =>
      notifications.map((notification) => ({
        notification,
        relativeTime: formatTimestamp(notification.createdAt),
      })),
    [notifications]
  );

  const handleNotificationClick = async (notification: typeof notifications[number]) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    const target = (notification.data as { url?: string } | null)?.url;
    if (target) {
      navigate(target);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className={cn('h-5 w-5 transition-colors', unreadCount > 0 && 'text-primary')} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-[4px] text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[22rem] p-0" sideOffset={12} align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Stay in the loop on new activity</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
          >
            <Check className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nothing to see yet. Your future WIGG activity will appear here.
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="divide-y divide-border">
              {notificationsForDisplay.map(({ notification, relativeTime }) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      !notification.readAt && 'bg-accent/40'
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <p className={cn('text-sm font-medium text-foreground line-clamp-2', !notification.readAt && 'font-semibold')}>
                        {notification.title}
                      </p>
                      <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                        {relativeTime}
                      </span>
                    </div>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        {pushSupported && preferences && (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
            <div>
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                {preferences.pushEnabled ? 'Enabled for this device' : 'Use browser alerts for instant updates'}
              </p>
            </div>
            <Button
              size="sm"
              variant={preferences.pushEnabled ? 'outline' : 'secondary'}
              onClick={preferences.pushEnabled ? disablePush : enablePush}
            >
              {preferences.pushEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
