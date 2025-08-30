import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ThumbsUp, ThumbsDown, Flag, User, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
  vote_score: number;
  user_vote?: number;
}

interface WiggPointCardProps {
  point: WiggPoint;
  onVoteUpdate?: (pointId: string, newScore: number, userVote: number) => void;
}

export const WiggPointCard = ({ point, onVoteUpdate }: WiggPointCardProps) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  const formatPosition = (value: number, kind: string) => {
    const unit = kind === "sec" ? "second" : 
                 kind === "min" ? "minute" : 
                 kind === "hour" ? "hour" :
                 kind === "page" ? "page" :
                 kind === "chapter" ? "chapter" :
                 kind === "episode" ? "episode" : kind;
    
    const plural = value !== 1 ? "s" : "";
    return `${value} ${unit}${plural}`;
  };

  const getSpoilerBadge = (level: string) => {
    switch (level) {
      case "1": return <Badge variant="outline" className="text-yellow-600">Minor Spoilers</Badge>;
      case "2": return <Badge variant="destructive">Major Spoilers</Badge>;
      default: return null;
    }
  };

  const handleVote = async (value: 1 | -1) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote",
        variant: "destructive"
      });
      return;
    }

    if (point.user_id === user.id) {
      toast({
        title: "Cannot vote",
        description: "You cannot vote on your own WIGG point",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('point_id', point.id)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('votes')
          .update({ value })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            point_id: point.id,
            user_id: user.id,
            value
          });

        if (error) throw error;
      }

      // Calculate new score (simplified - in real app you'd want to recalculate properly)
      const scoreDelta = existingVote ? (value - existingVote.value) : value;
      const newScore = point.vote_score + scoreDelta;

      onVoteUpdate?.(point.id, newScore, value);

      toast({
        title: "Vote recorded",
        description: `Thanks for your ${value === 1 ? 'upvote' : 'downvote'}!`
      });

    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleFlag = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to flag content",
        variant: "destructive"
      });
      return;
    }

    setIsFlagging(true);

    try {
      const { error } = await supabase
        .from('flags')
        .insert({
          point_id: point.id,
          user_id: user.id,
          reason: "Inappropriate content"
        });

      if (error) throw error;

      toast({
        title: "Content flagged",
        description: "Thank you for helping keep the community safe"
      });

    } catch (error: any) {
      console.error('Error flagging:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to flag content",
        variant: "destructive"
      });
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{point.media_title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{point.type}</Badge>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {point.username || "Anonymous"}
                </div>
                <span>•</span>
                <span>{new Date(point.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {getSpoilerBadge(point.spoiler)}
          </div>

          {/* WIGG Point */}
          <div className="flex items-center gap-2 p-4 bg-gradient-subtle rounded-lg">
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

          {/* Reason */}
          {point.reason_short && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Why it gets good:</p>
              <p className="text-sm text-muted-foreground">{point.reason_short}</p>
            </div>
          )}

          {/* Tags */}
          {point.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {point.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={point.user_vote === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(1)}
                  disabled={isVoting || point.user_id === user?.id}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">{Math.max(0, point.vote_score)}</span>
                </Button>
                <Button
                  variant={point.user_vote === -1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(-1)}
                  disabled={isVoting || point.user_id === user?.id}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
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
  );
};