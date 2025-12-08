import playboylLogo from '@/assets/playboy-logo.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-20 text-center px-4">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Playboy Logo */}
          <img 
            src={playboylLogo} 
            alt="Логотип клана"
            className="h-24 md:h-28 lg:h-32 w-auto border-4 border-primary transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)]"
            style={{ 
              boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)',
            }}
          />
          
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
    </section>
  );
};

export default HeroSection;
