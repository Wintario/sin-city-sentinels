import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import NewsSection from '@/components/NewsSection';
import Footer from '@/components/Footer';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';
import { settingsAPI, type ClanWidgetSettings } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [rainIntensity, setRainIntensity] = useState(1);
  const [isClanWidgetClosed, setIsClanWidgetClosed] = useState(false);
  const [clanWidgetSettings, setClanWidgetSettings] = useState<ClanWidgetSettings | null>(null);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleNavHover = useCallback((isHovering: boolean) => {
    setRainIntensity(isHovering ? 2 : 1);
  }, []);

  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (!hash) return;

    const scrollToSection = () => {
      const section = document.getElementById(hash);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    requestAnimationFrame(scrollToSection);
    const retryTimer = window.setTimeout(scrollToSection, 250);

    return () => window.clearTimeout(retryTimer);
  }, [location.hash]);

  useEffect(() => {
    let isMounted = true;

    settingsAPI.getClanWidget()
      .then((settings) => {
        if (isMounted) {
          setClanWidgetSettings(settings);
        }
      })
      .catch(() => {
        if (isMounted) {
          setClanWidgetSettings({
            enabled: true,
            title: 'Информация для сокланов',
            body: ''
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const shouldShowClanWidget = Boolean(
    isAuthenticated &&
    user?.is_target_clan_member &&
    clanWidgetSettings?.enabled &&
    !isClanWidgetClosed
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url(${heroRabbit})`,
          filter: 'contrast(1.2) brightness(0.5)',
        }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-background/70 z-0" />

      {/* Rain Effect */}
      <RainEffect intensity={rainIntensity} />
      
      {/* Film Grain Overlay */}
      <FilmGrain />

      {/* Navigation */}
      <Navigation onHover={handleNavHover} />

      {shouldShowClanWidget && (
        <aside className="fixed top-20 left-4 z-40 w-[300px] rounded-lg border border-primary/40 bg-background/90 p-4 shadow-xl backdrop-blur-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-primary leading-tight">
              {clanWidgetSettings?.title || 'Информация для сокланов'}
            </h2>
            <button
              type="button"
              onClick={() => setIsClanWidgetClosed(true)}
              className="text-muted-foreground hover:text-foreground leading-none"
              aria-label="Закрыть окно"
              title="Закрыть"
            >
              x
            </button>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {clanWidgetSettings?.body || ''}
          </p>
        </aside>
      )}

      {/* Main Content */}
      <main className="relative z-20">
        <HeroSection />
        <NewsSection />
        <AboutSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
