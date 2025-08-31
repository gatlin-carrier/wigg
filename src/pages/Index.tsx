import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, TrendingUp, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="absolute right-4 top-4 z-10">
            <ThemeToggle />
          </div>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              When does it get good?
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Track and share how long it takes for movies, shows, books, and more to become worth your time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-4 h-auto"
                onClick={() => navigate("/dashboard")}
              >
                Explore Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {user ? (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-4 h-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={signOut}
                >
                  <User className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-4 h-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={() => navigate("/auth")}
                >
                  <User className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Save Time</h3>
              <p className="text-muted-foreground">Know before you commit hours to new media</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Find Quality</h3>
              <p className="text-muted-foreground">Discover which shows are worth the investment</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-transparent">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Share Insights</h3>
              <p className="text-muted-foreground">Help others with your viewing experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Simple, community-driven insights about when media becomes engaging
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                  1
                </div>
                <h3 className="font-semibold">Browse</h3>
                <p className="text-sm text-muted-foreground">
                  Explore popular games, movies, TV shows, and books
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                  2
                </div>
                <h3 className="font-semibold">Track</h3>
                <p className="text-sm text-muted-foreground">
                  Log how long it takes for content to get good
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                  3
                </div>
                <h3 className="font-semibold">Share</h3>
                <p className="text-sm text-muted-foreground">
                  Help others by sharing your experience
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                  4
                </div>
                <h3 className="font-semibold">Discover</h3>
                <p className="text-sm text-muted-foreground">
                  Find your next favorite based on community insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to discover when it gets good?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the community and start tracking media that's worth your time
          </p>
          <Button 
            variant="default" 
            size="lg" 
            className="text-lg px-8 py-4 h-auto"
            onClick={() => navigate("/dashboard")}
          >
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            WIGG
          </h3>
          <p className="text-muted-foreground text-sm">
            When It Gets Good - Track media worth your time
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
