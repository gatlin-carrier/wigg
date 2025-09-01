import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageHeader } from "@/contexts/HeaderContext";
import { Film, Tv, Gamepad2, Book, Mic, User, Save, ChevronUp, ChevronDown, BookOpen, Sparkles, Newspaper } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    preferred_media_types: [] as Array<{type: string, priority: number}>,
    hidden_media_types: [] as string[],
  });

  usePageHeader({
    title: "Profile",
    subtitle: "Manage your account preferences",
    showBackButton: true,
    showHomeButton: true,
  });

  const mediaTypes = [
    { id: "Movie", label: "Movies", icon: Film },
    { id: "TV Show", label: "TV Shows", icon: Tv },
    { id: "Anime", label: "Anime", icon: Sparkles },
    { id: "Manga", label: "Manga", icon: BookOpen },
    { id: "Webtoons", label: "Webtoons", icon: Newspaper },
    { id: "Game", label: "Games", icon: Gamepad2 },
    { id: "Book", label: "Books", icon: Book },
    { id: "Podcast", label: "Podcasts", icon: Mic },
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, preferred_media_types, hidden_media_types')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Handle the JSONB format from database
        const preferences = Array.isArray(data.preferred_media_types) 
          ? (data.preferred_media_types as Array<{type: string, priority: number}>)
          : [];
        setProfile({
          username: data.username || "",
          preferred_media_types: preferences,
          hidden_media_types: Array.isArray((data as any).hidden_media_types) ? (data as any).hidden_media_types as string[] : [],
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePreference = (mediaType: string) => {
    setProfile(prev => {
      const exists = prev.preferred_media_types.find(p => p.type === mediaType);
      if (exists) {
        return {
          ...prev,
          preferred_media_types: prev.preferred_media_types.filter(p => p.type !== mediaType)
        };
      } else {
        const newPriority = Math.max(0, ...prev.preferred_media_types.map(p => p.priority)) + 1;
        return {
          ...prev,
          preferred_media_types: [...prev.preferred_media_types, { type: mediaType, priority: newPriority }]
        };
      }
    });
  };

  const updatePriority = (mediaType: string, newPriority: number) => {
    setProfile(prev => ({
      ...prev,
      preferred_media_types: prev.preferred_media_types.map(p => 
        p.type === mediaType ? { ...p, priority: newPriority } : p
      )
    }));
  };

  const toggleHidden = (mediaType: string) => {
    setProfile(prev => {
      const isHidden = prev.hidden_media_types.includes(mediaType);
      return {
        ...prev,
        hidden_media_types: isHidden
          ? prev.hidden_media_types.filter(t => t !== mediaType)
          : [...prev.hidden_media_types, mediaType]
      };
    });
  };

  const moveUp = (mediaType: string) => {
    const currentItem = profile.preferred_media_types.find(p => p.type === mediaType);
    if (!currentItem || currentItem.priority === 1) return;
    
    const itemAbove = profile.preferred_media_types.find(p => p.priority === currentItem.priority - 1);
    if (itemAbove) {
      updatePriority(currentItem.type, currentItem.priority - 1);
      updatePriority(itemAbove.type, itemAbove.priority + 1);
    }
  };

  const moveDown = (mediaType: string) => {
    const currentItem = profile.preferred_media_types.find(p => p.type === mediaType);
    const maxPriority = Math.max(...profile.preferred_media_types.map(p => p.priority));
    if (!currentItem || currentItem.priority === maxPriority) return;
    
    const itemBelow = profile.preferred_media_types.find(p => p.priority === currentItem.priority + 1);
    if (itemBelow) {
      updatePriority(currentItem.type, currentItem.priority + 1);
      updatePriority(itemBelow.type, itemBelow.priority - 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          preferred_media_types: profile.preferred_media_types,
          hidden_media_types: profile.hidden_media_types
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update your account information and media preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <Label>Media Preferences</Label>
            <p className="text-sm text-muted-foreground">
              Select the types of media you're most interested in. This helps us personalize your experience.
            </p>
            <div className="space-y-3">
              {/* Selected preferences with priority controls */}
              {profile.preferred_media_types
                .sort((a, b) => a.priority - b.priority)
                .map((pref) => {
                  const mediaType = mediaTypes.find(type => type.id === pref.type);
                  if (!mediaType) return null;
                  const Icon = mediaType.icon;
                  
                  return (
                    <div
                      key={pref.type}
                      className="flex items-center justify-between p-3 border border-primary bg-primary/5 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={true}
                          onChange={() => togglePreference(pref.type)}
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{mediaType.label}</span>
                        <span className="text-xs text-muted-foreground">Priority {pref.priority}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveUp(pref.type)}
                          disabled={pref.priority === 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveDown(pref.type)}
                          disabled={pref.priority === Math.max(...profile.preferred_media_types.map(p => p.priority))}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              
              {/* Available preferences to add */}
              <div className="grid grid-cols-2 gap-3">
                {mediaTypes
                  .filter(type => !profile.preferred_media_types.find(p => p.type === type.id))
                  .map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2 p-3 border border-border hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                        onClick={() => togglePreference(type.id)}
                      >
                        <Checkbox
                          checked={false}
                          onChange={() => togglePreference(type.id)}
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Hidden Media Types</Label>
            <p className="text-sm text-muted-foreground">
              Choose which media types to hide across browse sections.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {mediaTypes.map((type) => {
                const Icon = type.icon;
                const checked = profile.hidden_media_types.includes(type.id);
                return (
                  <div
                    key={`hide-${type.id}`}
                    className="flex items-center space-x-2 p-3 border border-border hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                    onClick={() => toggleHidden(type.id)}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleHidden(type.id)}
                    />
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
