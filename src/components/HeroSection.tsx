import playboylLogo from '@/assets/playboy-logo.png';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const handleScroll = () => {
    const newsSection = document.getElementById('news');
    newsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-20 text-center px-4 flex-1 flex items-center justify-center">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Playboy Logo */}
          <div 
            className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-primary flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)]"
            style={{ 
              boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
            }}
          >
            <img 
              src={playboylLogo} 
              alt="Логотип клана"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up">
              СВИРЕПЫЕ
            </h1>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up" style={{ animationDelay: '0.1s' }}>
              КРОЛИКИ
            </h1>
          </div>
        </div>
        <p 
          className="font-display text-2xl md:text-3xl lg:text-4xl tracking-widest text-primary text-shadow-red animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          МЫ ВЕЛИЧАЙШИЕ. МЫ БОГИ.
        </p>
        
      </div>

      {/* Scroll Indicator Arrow */}
      <div className="relative z-20 pb-8 md:pb-12">
        <button
          onClick={handleScroll}
          className="flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-2 animate-bounce"
          aria-label="Scroll down to news"
        >
          <ChevronDown 
            size={32} 
            className="text-primary animate-pulse" 
            strokeWidth={3}
          />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;