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

const parseFightDate = (dateRaw: string): number => {
  const value = (dateRaw || '').trim();
  if (!value) return Number.NaN;

  const dot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dot) {
    const day = Number(dot[1]);
    const month = Number(dot[2]);
    let year = Number(dot[3]);
    if (year < 100) year += 2000;
    const ts = new Date(year, month - 1, day).getTime();
    return Number.isNaN(ts) ? Number.NaN : ts;
  }

  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? Number.NaN : ts;
};

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
            body: '',
            fights: []
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

  const nearestFight = (() => {
    const fights = clanWidgetSettings?.fights || [];
    if (!fights.length) return null;

    const now = Date.now();
    const mapped = fights
      .map((fight) => ({
        ...fight,
        timestamp: parseFightDate(fight.date),
      }))
      .filter((fight) => fight.date && fight.opponent);

    const validFuture = mapped
      .filter((fight) => !Number.isNaN(fight.timestamp) && fight.timestamp >= now)
      .sort((a, b) => a.timestamp - b.timestamp);
    if (validFuture.length > 0) {
      return validFuture[0];
    }

    const validAny = mapped
      .filter((fight) => !Number.isNaN(fight.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);
    if (validAny.length > 0) {
      return validAny[0];
    }

    return mapped[0] || null;
  })();

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
        <aside className="fixed top-20 left-4 z-40 w-[320px] newspaper-bg border border-primary/70 p-4 shadow-[0_0_24px_rgba(255,0,0,0.25)] backdrop-blur-sm">
          <div className="mb-3 rounded border border-primary/40 bg-black/5 p-2">
            <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Ближайший бой</p>
            <p className="text-xs text-black mt-1">
              {nearestFight
                ? `${nearestFight.date} Свирепые Кролики - ${nearestFight.opponent}${nearestFight.time ? ` в ${nearestFight.time}` : ''}`
                : 'Не указан'}
            </p>
          </div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary leading-tight">
              {clanWidgetSettings?.title || 'Информация для сокланов'}
            </h2>
            <button
              type="button"
              onClick={() => setIsClanWidgetClosed(true)}
              className="text-zinc-400 hover:text-zinc-100 leading-none"
              aria-label="Закрыть окно"
              title="Закрыть"
            >
              x
            </button>
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-black">
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
