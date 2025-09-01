import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Film, Tv, Gamepad2, Book, Mic, ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ 
    email: "", 
    password: "", 
    username: "", 
    preferences: [] as Array<{type: string, priority: number}>
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Store preferences in username meta data for now
    const defaultPrefs = [
      {type: "Movie", priority: 1},
      {type: "TV Show", priority: 2},
      {type: "Game", priority: 3},
      {type: "Book", priority: 4},
      {type: "Podcast", priority: 5}
    ];
    const metadata = { 
      username: signUpData.username,
      preferred_media_types: signUpData.preferences.length > 0 ? signUpData.preferences : defaultPrefs
    };
    
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.username, metadata);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }
    
    setIsLoading(false);
  };

  const mediaTypes = [
    { id: "Movie", label: "Movies", icon: Film },
    { id: "TV Show", label: "TV Shows", icon: Tv },
    { id: "Game", label: "Games", icon: Gamepad2 },
    { id: "Book", label: "Books", icon: Book },
    { id: "Podcast", label: "Podcasts", icon: Mic },
  ];

  const togglePreference = (mediaType: string) => {
    setSignUpData(prev => {
      const exists = prev.preferences.find(p => p.type === mediaType);
      if (exists) {
        return {
          ...prev,
          preferences: prev.preferences.filter(p => p.type !== mediaType)
        };
      } else {
        const newPriority = Math.max(0, ...prev.preferences.map(p => p.priority)) + 1;
        return {
          ...prev,
          preferences: [...prev.preferences, { type: mediaType, priority: newPriority }]
        };
      }
    });
  };

  const updatePriority = (mediaType: string, newPriority: number) => {
    setSignUpData(prev => ({
      ...prev,
      preferences: prev.preferences.map(p => 
        p.type === mediaType ? { ...p, priority: newPriority } : p
      )
    }));
  };

  const moveUp = (mediaType: string) => {
    const currentItem = signUpData.preferences.find(p => p.type === mediaType);
    if (!currentItem || currentItem.priority === 1) return;
    
    const itemAbove = signUpData.preferences.find(p => p.priority === currentItem.priority - 1);
    if (itemAbove) {
      updatePriority(currentItem.type, currentItem.priority - 1);
      updatePriority(itemAbove.type, itemAbove.priority + 1);
    }
  };

  const moveDown = (mediaType: string) => {
    const currentItem = signUpData.preferences.find(p => p.type === mediaType);
    const maxPriority = Math.max(...signUpData.preferences.map(p => p.priority));
    if (!currentItem || currentItem.priority === maxPriority) return;
    
    const itemBelow = signUpData.preferences.find(p => p.priority === currentItem.priority + 1);
    if (itemBelow) {
      updatePriority(currentItem.type, currentItem.priority + 1);
      updatePriority(itemBelow.type, itemBelow.priority - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                WIGG
              </h1>
              <p className="text-muted-foreground">
                Join the community to track when media gets good
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to create WiggPoints and see personalized recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Join WIGG to start tracking when media gets good and discover new favorites.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username (optional)</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a username"
                        value={signUpData.username}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>What type of media interests you most? (optional)</Label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferences to get better recommendations
                      </p>
                      <div className="space-y-3">
                        {/* Selected preferences with priority controls */}
                        {signUpData.preferences
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
                                    disabled={pref.priority === Math.max(...signUpData.preferences.map(p => p.priority))}
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
                            .filter(type => !signUpData.preferences.find(p => p.type === type.id))
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
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;