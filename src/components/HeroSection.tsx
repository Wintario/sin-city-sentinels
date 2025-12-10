import playboylLogo from '@/assets/playboy-logo.png';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const handleScroll = () => {
    const newsSection = document.getElementById('news');
    newsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-20 text-center px-4 flex-1 flex items-center justify-center">
        {/* Logo and Title */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          {/* Playboy Logo */}
          <div 
            className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-3 md:border-4 border-primary flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] flex-shrink-0"
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
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up leading-tight">
              СВИРЕПЫЕ
            </h1>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up leading-tight" style={{ animationDelay: '0.1s' }}>
              КРОЛИКИ
            </h1>
          </div>
        </div>
        <p 
          className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-widest text-primary text-shadow-red animate-fade-up mt-6 md:mt-8"
          style={{ animationDelay: '0.2s' }}
        >
          МЫ ВЕЛИЧАЙШИЕ. МЫ БОГИ.
        </p>
      </div>

      {/* Bottom Section - Next Section Preview + Scroll Indicator */}
      <div className="relative z-20 w-full pb-8 md:pb-12">
        {/* Next Section Preview Text */}
        <div className="text-center mb-6 md:mb-8 overflow-hidden h-12 md:h-16">
          <div className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wider text-foreground opacity-20 select-none leading-tight">
            ВЕСТНИК КРОЛИК
          </div>
        </div>

        {/* Scroll Indicator Arrow */}
        <div className="flex justify-center animate-bounce">
          <button
            onClick={handleScroll}
            className="flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-2"
            aria-label="Scroll down to news"
          >
            <ChevronDown 
              size={32} 
              className="text-primary animate-pulse" 
              strokeWidth={3}
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;