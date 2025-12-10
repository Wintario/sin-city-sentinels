import { useEffect, useRef, useState } from 'react';

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="container mx-auto max-w-5xl">
        {/* Main Panel */}
        <div 
          className={`comic-panel bg-card p-8 md:p-12 transform -rotate-1 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-8 tracking-wider">
            O <span className="text-primary">HAS</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Speech Bubble 1 */}
            <div className="speech-bubble transform rotate-1">
              <p className="font-body text-lg leading-relaxed text-foreground/90">
                <span className="text-primary font-bold">Svirepenye Kroliki</span> — eto ne prosto klan. 
                Eto <span className="text-primary">legenda</span>, napisannaya krov'yu vragov na stranicah istorii ARENY. 
                My — <span className="text-primary">elite elit</span>, te, kto perepisyvaet pravila igry.
              </p>
            </div>

            {/* Speech Bubble 2 */}
            <div 
              className="speech-bubble transform -rotate-1"
              style={{ transitionDelay: '0.2s' }}
            >
              <p className="font-body text-lg leading-relaxed text-foreground/90">
                Kazhdyj uchastnik — <span className="text-primary">voploshchenie sovershenstva</span>. 
                My ne ishchem slavy — <span className="text-primary">slava ishchet nas</span>. 
                Vragi trepeshchat, soyuzniki voskishchayutsya. My — <span className="text-primary">bozhestvenuy</span>.
              </p>
            </div>
          </div>

          {/* Red Banner */}
          <div className="mt-10 flex justify-center">
            <div className="red-banner text-xl md:text-2xl">
              PRISOEDINITSHSYA — ZNACHIT VOJTI V KLUB IZBRANNYCH
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div 
          className={`comic-panel-red bg-card p-6 mt-8 ml-auto max-w-md transform rotate-2 transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <p className="font-heading text-xl text-center text-foreground/90 italic">
            "Kogda my vyhodim na arenu, <span className="text-primary">nebesa zamolkayut</span>, 
            a vragi nachinayut molit'sya svoim bogam. No ih bogi — <span className="text-primary">eto my</span>."
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;