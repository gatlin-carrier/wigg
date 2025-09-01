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
import { Film, Tv, Gamepad2, Book, Mic, User, Save } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    preferred_media_types: [] as string[]
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
        .select('username, preferred_media_types')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          username: data.username || "",
          preferred_media_types: data.preferred_media_types || []
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
    setProfile(prev => ({
      ...prev,
      preferred_media_types: prev.preferred_media_types.includes(mediaType)
        ? prev.preferred_media_types.filter(p => p !== mediaType)
        : [...prev.preferred_media_types, mediaType]
    }));
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
          preferred_media_types: profile.preferred_media_types
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
            <div className="grid grid-cols-2 gap-3">
              {mediaTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${
                      profile.preferred_media_types.includes(type.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => togglePreference(type.id)}
                  >
                    <Checkbox
                      checked={profile.preferred_media_types.includes(type.id)}
                      onChange={() => togglePreference(type.id)}
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