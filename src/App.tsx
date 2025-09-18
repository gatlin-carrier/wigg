import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import GlobalHeader from "@/components/layout/GlobalHeader";
import { HeaderProvider } from "@/contexts/HeaderContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TmdbDemo from "./pages/TmdbDemo";
import WiggDemo from "./pages/WiggDemo";
import Feed from "./pages/Feed";
import SearchPage from "./pages/Search";
import TestNavigation from "./pages/TestNavigation";
import MediaDetails from "./pages/MediaDetails";
import Profile from "./pages/Profile";
import AddWigg from "./pages/AddWigg";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <HeaderProvider>
        <div className="min-h-screen bg-background">
          <GlobalHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/wigg-demo" element={<WiggDemo />} />
            <Route path="/add-wigg" element={<AddWigg />} />
            <Route path="/add-wigg/:mode" element={<AddWigg />} />
            <Route path="/tmdb" element={<TmdbDemo />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/test-nav" element={<TestNavigation />} />
            <Route path="/media/:source/:id" element={<MediaDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Analytics />
          <SpeedInsights />
        </div>
      </HeaderProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
