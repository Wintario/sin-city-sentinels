import playboylLogo from '@/assets/playboy-logo.png';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const handleScroll = () => {
    const newsSection = document.getElementById('news');
    newsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-20 text-center px-4">
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

      {/* Scroll Down Arrow */}
      <button
        onClick={handleScroll}
        className="absolute bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-2"
        aria-label="Scroll down to news"
        style={{
          animation: 'smoothBounce 2.5s ease-in-out infinite, smoothFade 2s ease-in-out infinite'
        }}
      >
        <ChevronDown 
          size={48} 
          className="text-primary" 
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