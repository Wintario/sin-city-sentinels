import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MemberCard from '@/components/MemberCard';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';

// Mock data for 30 members
const mockMembers = [
  { id: 1, name: 'легион86', role: 'Глава клана', profile_url: 'https://apeha.ru', avatar_url: null },
  ...Array.from({ length: 29 }, (_, i) => ({
    id: i + 2,
    name: `Участник ${i + 2}`,
    role: 'Член клана',
    profile_url: null,
    avatar_url: null,
  })),
];

const Members = () => {
  const [rainIntensity, setRainIntensity] = useState(1);

  const handleBackHover = useCallback((isHovering: boolean) => {
    setRainIntensity(isHovering ? 2 : 1);
  }, []);

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

      {/* Content */}
      <div className="relative z-20 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/" 
                className="nav-btn inline-flex items-center gap-2"
                onMouseEnter={() => handleBackHover(true)}
                onMouseLeave={() => handleBackHover(false)}
              >
                <ArrowLeft size={18} />
                На главную
              </Link>
              <h1 className="font-display text-xl md:text-2xl tracking-wider">
                СВИРЕПЫЕ <span className="text-primary">КРОЛИКИ</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Section Title */}
          <div className="comic-panel inline-block bg-card px-8 py-4 mb-12 transform -rotate-1">
            <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
              СОСТАВ <span className="text-primary">КЛАНА</span>
            </h2>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mockMembers.map((member, index) => (
              <div
                key={member.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <MemberCard member={member} />
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative py-12 px-4 bg-background/90 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-body text-muted-foreground mb-4">
              © 2025 Клан "Свирепые Кролики". <span className="text-primary">Величие вечно.</span>
            </p>
            <p className="font-body text-sm text-muted-foreground/70 mb-6">
              Основан: 26.09.2006
            </p>
            <a 
              href="https://apeha.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body text-sm text-muted-foreground/50 hover:text-primary transition-colors duration-300"
            >
              Вернуться в АРЕНУ →
            </a>
            
            {/* Admin Link */}
            <div className="mt-6">
              <Link 
                to="/admin/login"
                className="font-body text-xs text-muted-foreground/40 hover:text-primary transition-colors duration-300"
              >
                admin
              </Link>
            </div>

            {/* Decorative Elements */}
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <span className="text-primary font-display text-sm tracking-widest">★</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Members;
