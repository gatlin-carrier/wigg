import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Clock, Flag, User, Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import FollowButton from '@/components/social/FollowButton';
import { useWiggLikes } from '@/hooks/social/useWiggLikes';
import { useWiggLikesDataLayer } from '@/hooks/social/useWiggLikesDataLayer';
import { useWiggComments } from '@/hooks/social/useWiggComments';
import { useFeatureFlag } from '@/lib/featureFlags';

interface WiggPoint {
  id: string;
  media_title: string;
  type: string;
  pos_kind: string;
  pos_value: number;
  reason_short?: string;
  tags: string[];
  spoiler: string;
  created_at: string;
  username?: string;
  user_id: string;
}

interface WiggPointCardProps {
  point: WiggPoint;
}

export const WiggPointCard = ({ point }: WiggPointCardProps) => {
  const { user } = useAuth();
  const [isFlagging, setIsFlagging] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('wigg-point-card-data-layer');
  const legacyLikesData = useWiggLikes(point.id, point.user_id, point.media_title, { enabled: !useNewDataLayer });
  const newLikesData = useWiggLikesDataLayer(point.id, { enabled: useNewDataLayer });
  const { liked, count: likeCount, loading: likeLoading, toggleLike } = useNewDataLayer ? newLikesData : legacyLikesData;
  const {
    comments,
    loading: commentsLoading,
    addComment,
    deleteComment,
    refresh: refreshComments,
    canComment,
  } = useWiggComments(point.id);

  useEffect(() => {
    if (commentOpen) {
      refreshComments();
    }
  }, [commentOpen, refreshComments]);

  const formatPosition = useCallback((value: number, kind: string) => {
    const unit = kind === 'sec' ? 'second'
      : kind === 'min' ? 'minute'
      : kind === 'hour' ? 'hour'
      : kind === 'page' ? 'page'
      : kind === 'chapter' ? 'chapter'
      : kind === 'episode' ? 'episode'
      : kind;
    const plural = value !== 1 ? 's' : '';
    return `${value} ${unit}${plural}`;
  }, []);

  const getSpoilerBadge = (level: string) => {
    switch (level) {
      case '1':
        return <Badge variant="outline" className="text-yellow-600">Minor Spoilers</Badge>;
      case '2':
        return <Badge variant="destructive">Major Spoilers</Badge>;
      default:
        return null;
    }
  };

  const handleFlag = async () => {
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please log in to flag content', variant: 'destructive' });
      return;
    }
    setIsFlagging(true);
    try {
      const { error } = await supabase.from('flags').insert({
        point_id: point.id,
        user_id: user.id,
        reason: 'Inappropriate content',
      });
      if (error) throw error;
      toast({ title: 'Content flagged', description: 'Thank you for helping keep the community safe' });
    } catch (error: any) {
      console.error('Error flagging:', error);
      toast({ title: 'Error', description: error?.message ?? 'Failed to flag content', variant: 'destructive' });
    } finally {
      setIsFlagging(false);
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText('');
    refreshComments();
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/wigg/${point.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: point.media_title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied', description: 'Share it with your friends!' });
      }
      if (user?.id) {
        await supabase.from('wigg_point_shares').insert({ point_id: point.id, user_id: user.id });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      toast({ title: 'Share failed', description: error?.message ?? 'Unable to share right now.', variant: 'destructive' });
    }
  };

  const commentCount = comments.length;

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{point.media_title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{point.type}</Badge>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {point.username || 'Anonymous'}
                  </div>
                  <span>•</span>
                  <span>{new Date(point.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {point.user_id && <FollowButton targetUserId={point.user_id} targetUsername={point.username} />}
                {getSpoilerBadge(point.spoiler)}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-gradient-subtle p-4">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Gets good at:</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-primary">
                    {formatPosition(point.pos_value, point.pos_kind)}
                  </span>
                </div>
              </div>
            </div>

            {point.reason_short && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-sm font-medium">Why it gets good:</p>
                <p className="text-sm text-muted-foreground">{point.reason_short}</p>
              </div>
            )}

            {point.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {point.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={liked ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={toggleLike}
                  disabled={likeLoading}
                  className="flex items-center gap-1"
                >
                  <Heart className={cn('h-4 w-4', liked && 'fill-current text-primary')} />
                  <span className="text-xs">{likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setCommentOpen(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{commentCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFlag}
                disabled={isFlagging}
                className="text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>Join the discussion for {point.media_title}.</DialogDescription>
          </DialogHeader>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No comments yet. Be the first to share a thought.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded border bg-card/80 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{comment.username}</span>
                    {comment.userId === user?.id && (
                      <Button variant="ghost" size="xs" onClick={() => deleteComment(comment.id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))
            )}
          </div>
          {canComment ? (
            <form onSubmit={handleAddComment} className="space-y-3">
              <Textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Share your perspective"
                rows={3}
              />
              <DialogFooter>
                <Button type="submit" disabled={!commentText.trim()}>
                  Post comment
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

