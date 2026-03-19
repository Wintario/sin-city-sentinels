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

const MOSCOW_UTC_OFFSET_HOURS = 3;

const parseFightDateParts = (dateRaw: string): { year: number; month: number; day: number } | null => {
  const value = (dateRaw || '').trim();
  if (!value) return null;

  const dot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dot) {
    const day = Number(dot[1]);
    const month = Number(dot[2]);
    let year = Number(dot[3]);
    if (year < 100) year += 2000;
    if (!day || !month || !year) return null;
    return { year, month, day };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
};

const parseFightTime = (timeRaw?: string): { hour: number; minute: number } | null => {
  const value = (timeRaw || '').trim();
  if (!value) return null;
  const match = value.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
};

const toMoscowTimestamp = (year: number, month: number, day: number, hour = 0, minute = 0): number => {
  return Date.UTC(year, month - 1, day, hour - MOSCOW_UTC_OFFSET_HOURS, minute, 0, 0);
};

const parseFightSchedule = (dateRaw: string, timeRaw?: string): { eventAtTs: number; switchAtTs: number } => {
  const date = parseFightDateParts(dateRaw);
  if (!date) {
    return { eventAtTs: Number.NaN, switchAtTs: Number.NaN };
  }

  const time = parseFightTime(timeRaw);
  const eventAtTs = toMoscowTimestamp(date.year, date.month, date.day, time?.hour ?? 0, time?.minute ?? 0);

  // Если время есть: меняем на следующий бой через 30 минут после старта (по Москве).
  // Если времени нет: меняем только со следующего дня 00:00 по Москве.
  const switchAtTs = time
    ? eventAtTs + 30 * 60 * 1000
    : toMoscowTimestamp(date.year, date.month, date.day + 1, 0, 0);

  return { eventAtTs, switchAtTs };
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
      .map((fight, index) => {
        const schedule = parseFightSchedule(fight.date, fight.time);
        return {
          ...fight,
          index,
          eventAtTs: schedule.eventAtTs,
          switchAtTs: schedule.switchAtTs,
        };
      })
      .filter((fight) => fight.date && fight.opponent);

    const activeOrUpcoming = mapped
      .filter((fight) => Number.isNaN(fight.switchAtTs) || now < fight.switchAtTs)
      .sort((a, b) => {
        const aTs = Number.isNaN(a.eventAtTs) ? Number.POSITIVE_INFINITY : a.eventAtTs;
        const bTs = Number.isNaN(b.eventAtTs) ? Number.POSITIVE_INFINITY : b.eventAtTs;
        if (aTs !== bTs) return aTs - bTs;
        return a.index - b.index;
      });

    if (activeOrUpcoming.length > 0) {
      return activeOrUpcoming[0];
    }

    const validAny = mapped
      .sort((a, b) => {
        const aTs = Number.isNaN(a.eventAtTs) ? Number.POSITIVE_INFINITY : a.eventAtTs;
        const bTs = Number.isNaN(b.eventAtTs) ? Number.POSITIVE_INFINITY : b.eventAtTs;
        if (aTs !== bTs) return aTs - bTs;
        return a.index - b.index;
      });

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
