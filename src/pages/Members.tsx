import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import MemberCard from '@/components/MemberCard';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';
import { membersAPI, Member } from '@/lib/api';

const Members = () => {
  const [rainIntensity, setRainIntensity] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardSize, setCardSize] = useState(120);

  useEffect(() => {
    const scale = localStorage.getItem('clan_member_scale') || '100';
    const scaleNum = parseInt(scale, 10);
    // Base size is ~120px, scale it
    const newSize = Math.round((120 * scaleNum) / 100);
    setCardSize(newSize);
    document.documentElement.style.setProperty('--member-card-size', `${newSize}px`);
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await membersAPI.getAll();
        setMembers(data);
      } catch (error) {
        console.error('Failed to load members:', error);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, []);

  const handleBackHover = useCallback((isHovering: boolean) => {
    setRainIntensity(isHovering ? 2 : 1);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url(${heroRabbit})`,
          filter: 'contrast(1.2) brightness(0.5)',
        }}
      />
      
      <div className="fixed inset-0 bg-background/70 z-0" />

      <RainEffect intensity={rainIntensity} />
      
      <FilmGrain />

      <div className="relative z-20 min-h-screen">
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

        <main className="container mx-auto px-4 py-12">
          <div className="comic-panel inline-block bg-card px-8 py-4 mb-12 transform -rotate-1">
            <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-wider">
              СОСТАВ <span className="text-primary">КЛАНА</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              Загрузка состава...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Участников пока нет
            </div>
          ) : (
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(var(--member-card-size, 120px), 1fr))`,
                gap: '1rem',
              }}
            >
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <MemberCard member={member} />
                </div>
              ))}
            </div>
          )}
        </main>

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
            
            <div className="mt-6">
              <Link 
                to="/admin/login"
                className="font-body text-xs text-muted-foreground/40 hover:text-primary transition-colors duration-300"
              >
                admin
              </Link>
            </div>

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