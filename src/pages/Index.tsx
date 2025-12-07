import { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import MembersSection from '@/components/MembersSection';
import NewsSection from '@/components/NewsSection';
import AchievementsSection from '@/components/AchievementsSection';
import Footer from '@/components/Footer';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';

const Index = () => {
  const [rainIntensity, setRainIntensity] = useState(1);

  const handleNavHover = useCallback((isHovering: boolean) => {
    setRainIntensity(isHovering ? 2 : 1);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Rain Effect */}
      <RainEffect intensity={rainIntensity} />
      
      {/* Film Grain Overlay */}
      <FilmGrain />

      {/* Navigation */}
      <Navigation onHover={handleNavHover} />

      {/* Main Content */}
      <main className="relative z-20">
        <HeroSection />
        <AboutSection />
        <MembersSection />
        <NewsSection />
        <AchievementsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
