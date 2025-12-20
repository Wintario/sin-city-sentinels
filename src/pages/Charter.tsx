import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';

const Charter = () => {
  const [rainIntensity, setRainIntensity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
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
              УСТАВ <span className="text-primary">КЛАНА</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основные положения */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Основные положения</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>• Клан действует в рамках Арены, опираясь на её законы</li>
                <li>• Все члены клана имеют равное значение</li>
                <li>• В клане только необходимые люди — лишних нет</li>
              </ul>
            </div>

            {/* Цели */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Цели</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>• Клан нейтрален и не принимает ни одну из сторон</li>
                <li>• Благополучие клана и его членов — главный приоритет</li>
                <li>• Клан — это семья, и ради неё мы готовы поступиться честью</li>
              </ul>
            </div>

            {/* Отношения внутри клана */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Отношения внутри</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>• Все члены — братья с одними целями</li>
                <li>• Бойцы помогают друг другу по возможности</li>
                <li>• Бой — способ стать сильнее, боец может вмешаться в любой бой</li>
              </ul>
            </div>

            {/* Отношения клана и бойца */}
            <div className="comic-panel bg-card/50 border-2 border-primary/50 p-5 hover:border-primary/80 transition-colors">
              <h3 className="font-display text-xl text-primary mb-4 pb-2 border-b border-primary/30">Клан и боец</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>• Боец следует уставу клана</li>
                <li>• Клан заботится о каждом члене</li>
                <li>• Боец может получить любую помощь от клана</li>
                <li>• Боец делает для клана всё, что в его силах</li>
              </ul>
            </div>
          </div>
        </main>

        <footer className="relative py-12 px-4 bg-background/90 border-t border-border">
          <div className="container mx-auto text-center">
            <p className="font-body text-muted-foreground mb-4">
              Клан — это семья. <span className="text-primary">Честь и достоинство каждого члена — честь и достоинство клана.</span>
            </p>
            <p className="font-body text-sm text-muted-foreground/70">
              © Свирепые Кролики | Клан Арены
            </p>
            
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

export default Charter;