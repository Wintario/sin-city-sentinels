import heroRabbit from '@/assets/hero-rabbit.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroRabbit})`,
          filter: 'contrast(1.2) brightness(0.7)',
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

      {/* Content */}
      <div className="relative z-20 text-center px-4">
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-wider text-foreground text-shadow-noir mb-4 animate-fade-up">
          СВИРЕПЫЕ
        </h1>
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-wider text-foreground text-shadow-noir mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          КРОЛИКИ
        </h1>
        <p 
          className="font-display text-2xl md:text-3xl lg:text-4xl tracking-widest text-primary text-shadow-red animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          МЫ ВЕЛИЧАЙШИЕ. МЫ БОГИ.
        </p>
        
        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ animationDelay: '1s' }}
        >
          <div className="w-6 h-10 border-2 border-foreground/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
