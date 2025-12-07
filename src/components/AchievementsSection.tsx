import { useEffect, useRef, useState } from 'react';
import { Star, Zap, Trophy, Flame, Moon, Cloud, Swords, Target } from 'lucide-react';

// Mock achievements data
const mockAchievements = [
  {
    id: 1,
    title: 'ПРОКЛЯТИЕ МАСТЕРА',
    description: 'Рекорд по применениям: "Проклясть противника" — 9999 раз за сезон',
    icon: Flame,
  },
  {
    id: 2,
    title: 'НОЧНОЙ ОХОТНИК',
    description: '50 побед подряд исключительно в ночное время',
    icon: Moon,
  },
  {
    id: 3,
    title: 'ГРОЗА ПРОТИВНИКОВ',
    description: 'Максимальное количество побеждённых врагов в один день — 500+',
    icon: Swords,
  },
  {
    id: 4,
    title: 'МОЛНИЕНОСНЫЙ УДАР',
    description: 'Самая быстрая дуэль в истории клана — 3 секунды',
    icon: Zap,
  },
  {
    id: 5,
    title: 'ЛЕГЕНДАРНЫЙ УРОН',
    description: 'Рекордный крит-удар — 888,888 HP',
    icon: Target,
  },
  {
    id: 6,
    title: 'ЛУННЫЙ ЦИКЛ',
    description: 'Все победы 15-го числа каждого месяца за год',
    icon: Star,
  },
  {
    id: 7,
    title: 'ДОЖДЛИВАЯ ДОЛЯ',
    description: 'Рекорд побед в дождливую погоду — 777',
    icon: Cloud,
  },
  {
    id: 8,
    title: 'НЕПОБЕДИМЫЕ',
    description: 'Максимум одновременно активных победных дуэлей — 99',
    icon: Trophy,
  },
];

const AchievementsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="achievements" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="container mx-auto">
        {/* Section Title */}
        <div 
          className={`comic-panel-red inline-block bg-card px-8 py-4 mb-12 transform rotate-1 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
            ЛЕГЕНДАРНЫЕ <span className="text-primary">ДОСТИЖЕНИЯ</span>
          </h2>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAchievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`achievement-card transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className="w-8 h-8 text-primary" />
                  <div className="h-px flex-1 bg-gradient-to-r from-primary to-transparent" />
                </div>

                {/* Title */}
                <h3 className="font-display text-xl text-primary tracking-wider mb-3">
                  {achievement.title}
                </h3>

                {/* Description */}
                <p className="font-body text-sm text-foreground/80 leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
