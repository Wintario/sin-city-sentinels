import playboylLogo from '@/assets/playboy-logo.png';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const handleScroll = () => {
    const newsSection = document.getElementById('news');
    newsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen md:min-h-screen flex items-end justify-center overflow-hidden py-8 md:py-0">
      {/* Text Block WITH Logo - Bottom Third */}
      <div className="relative z-20 text-center px-2 sm:px-4 mb-16 md:mb-20" style={{
        // MOBILE POSITIONING: поднять текст и логотип на 20px вверх
        transform: window.innerWidth < 768 ? 'translateY(-20px)' : 'translateY(0)'
      }}>
        {/* Logo - centered above text */}
        <div 
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-primary flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] flex-shrink-0 mx-auto mb-4 sm:mb-6 md:mb-8"
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

        <h1 className="font-display text-3xl sm:text-4xl md:text-7xl lg:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up leading-tight">
          СВИРЕПЫЕ
        </h1>
        <h1 className="font-display text-3xl sm:text-4xl md:text-7xl lg:text-8xl tracking-wider text-foreground text-shadow-noir animate-fade-up leading-tight" style={{ animationDelay: '0.1s' }}>
          КРОЛИКИ
        </h1>
        <p 
          className="font-display text-lg sm:text-xl md:text-3xl lg:text-4xl tracking-widest text-primary text-shadow-red animate-fade-up mt-3 sm:mt-4 md:mt-6"
          style={{ animationDelay: '0.2s' }}
        >
          МЫ ВЕЛИЧАЙШИЕ. МЫ БОГИ.
        </p>
      </div>

      {/* Scroll Down Arrow */}
      <button
        onClick={handleScroll}
        className="absolute left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-2"
        aria-label="Scroll down to news"
        style={{
          // МОБИЛА: стрелка на 10px выше (translateY(-10px))
          // ДЕСКТОП: стрелка на 10px ниже (translateY(10px))
          bottom: window.innerWidth < 768 
            ? 'calc(1rem - 10px)'    // МОБИЛА: было 1rem (4px), теперь -10px
            : 'calc(3rem + 10px)',    // ДЕСКТОП: было 3rem (12px), теперь +10px
          animation: 'smoothBounce 2.5s ease-in-out infinite, smoothFade 2s ease-in-out infinite'
        }}
      >
        <ChevronDown 
          size={32}
          className="md:w-12 md:h-12 text-primary" 
          strokeWidth={4}
          style={{
            animation: 'smoothFade 2s ease-in-out infinite'
          }}
        />
      </button>

      <style>{`
        @keyframes smoothFade {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes smoothBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;