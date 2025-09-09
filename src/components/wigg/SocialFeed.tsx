import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PacingBarcode } from '@/components/wigg/PacingBarcode';
import { LollipopStrip } from '@/components/wigg/LollipopStrip';
import { type ProgressSegment } from '@/hooks/useTitleProgress';
import { Heart, MessageCircle, Share2, Star, Sparkles } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export type FeedItemType = 'wigg' | 'summary' | 'milestone';

export interface FeedUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface FeedTitle {
  id: string;
  name: string;
  coverUrl?: string;
}

export interface SocialFeedItem {
  id: string;
  type: FeedItemType;
  user: FeedUser;
  title: FeedTitle;
  createdAt: string; // ISO
  // WIGG mark specifics
  pct?: number;
  rating?: 0 | 1 | 2 | 3; // zzz..peak
  note?: string;
  contexts?: string[]; // labels only for prototype
  // Visuals
  segments?: ProgressSegment[];
  t2gEstimatePct?: number;
}

export interface SocialFeedProps {
  items: SocialFeedItem[];
  dense?: boolean;
  showControls?: boolean;
  className?: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function ReactionBar() {
  return (
    <div className="flex items-center gap-2 text-xs mt-2">
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1"><Heart className="h-3 w-3" />Like</Button>
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1"><MessageCircle className="h-3 w-3" />Comment</Button>
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1"><Share2 className="h-3 w-3" />Share</Button>
    </div>
  );
}

function Header({ user, title, createdAt }: { user: FeedUser; title: FeedTitle; createdAt: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>}
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm">
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-muted-foreground">{title.name}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">{timeAgo(createdAt)}</div>
      </div>
    </div>
  );
}

function WiggBadge({ rating }: { rating?: 0 | 1 | 2 | 3 }) {
  if (rating === undefined) return null;
  const label = ['zzz', 'good', 'better', 'peak'][rating];
  const icon = rating >= 2 ? <Sparkles className="h-3 w-3" /> : <Star className="h-3 w-3" />;
  return (
    <Badge variant={rating >= 2 ? 'default' : 'secondary'} className="gap-1 text-[10px]">
      {icon}
      {label}
    </Badge>
  );
}

function FeedCard({ item, dense }: { item: SocialFeedItem; dense?: boolean }) {
  const isWigg = item.type === 'wigg';
  const isSummary = item.type === 'summary';
  return (
    <Card className="overflow-hidden">
      {/* Accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
      <CardContent className="p-3 space-y-3">
        <Header user={item.user} title={item.title} createdAt={item.createdAt} />

        {/* Body with media cover */}
        <div className="grid grid-cols-[1fr,84px] gap-3">
          <div className="space-y-2">
            {isWigg && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-primary">WIGG</span> at <span className="font-mono">{item.pct?.toFixed(1)}%</span>
                  </div>
                  <WiggBadge rating={item.rating} />
                </div>
                {/* Visual */}
                {item.segments && (
                  <div
                    className="rounded border p-1 bg-gradient-to-r from-purple-500/10 to-transparent"
                    style={{ ['--primary' as any]: '266 85% 58%' }}
                  >
                    <PacingBarcode
                      titleId={item.title.id}
                      height={60}
                      segmentCount={20}
                      segments={item.segments}
                      t2gEstimatePct={item.t2gEstimatePct}
                      dataScope="local"
                      suppressGlobalListeners
                      suppressHaptics
                    />
                  </div>
                )}
                {item.note && (
                  <div className="text-sm bg-muted/40 border rounded p-2">{item.note}</div>
                )}
                {item.contexts && item.contexts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.contexts.map((c) => (
                      <Badge key={c} variant="secondary" className="rounded-full text-[10px]">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isSummary && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Gets good around <span className="text-primary">{item.t2gEstimatePct?.toFixed(0)}%</span></div>
                  <Badge variant="outline" className="text-[10px]">Summary</Badge>
                </div>
                {item.segments && (
                  dense ? (
                    <div
                      className="rounded border p-1 bg-gradient-to-r from-purple-500/10 to-transparent"
                      style={{ ['--primary' as any]: '266 85% 58%' }}
                    >
                      <PacingBarcode
                        titleId={item.title.id}
                        height={60}
                        segmentCount={20}
                        segments={item.segments}
                        t2gEstimatePct={item.t2gEstimatePct}
                        dataScope="community"
                        suppressGlobalListeners
                        suppressHaptics
                      />
                    </div>
                  ) : (
                    <div
                      className="rounded border p-2 bg-gradient-to-r from-purple-500/10 to-transparent"
                      style={{ ['--primary' as any]: '266 85% 58%' }}
                    >
                      <LollipopStrip
                        titleId={item.title.id}
                        segments={item.segments}
                        t2gEstimatePct={item.t2gEstimatePct}
                        interactive={false}
                        height={56}
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Cover */}
          <div className="row-span-2">
            <AspectRatio ratio={2/3} className="relative rounded-md overflow-hidden border bg-muted">
              {item.title.coverUrl ? (
                <img src={item.title.coverUrl} alt={`${item.title.name} cover`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No cover</div>
              )}
              {isSummary && typeof item.t2gEstimatePct === 'number' && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-purple-600 text-white text-[10px] font-medium flex items-center gap-1 shadow">
                  <Star className="h-3 w-3" fill="currentColor" /> {Math.round(item.t2gEstimatePct)}%
                </div>
              )}
            </AspectRatio>
          </div>
        </div>

        <ReactionBar />
      </CardContent>
    </Card>
  );
}

export function SocialFeed({ items, dense = false, className = '' }: SocialFeedProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="grid gap-3 md:max-w-2xl md:mx-auto">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} dense={dense} />
        ))}
      </div>
    </div>
  );
}
