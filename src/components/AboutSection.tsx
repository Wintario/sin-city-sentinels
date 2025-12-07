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
            О <span className="text-primary">НАС</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Speech Bubble 1 */}
            <div className="speech-bubble transform rotate-1">
              <p className="font-body text-lg leading-relaxed text-foreground/90">
                <span className="text-primary font-bold">Свирепые Кролики</span> — это не просто клан. 
                Это <span className="text-primary">легенда</span>, написанная кровью врагов на страницах истории АРЕНЫ. 
                Мы — <span className="text-primary">элита элит</span>, те, кто переписывает правила игры.
              </p>
            </div>

            {/* Speech Bubble 2 */}
            <div 
              className="speech-bubble transform -rotate-1"
              style={{ transitionDelay: '0.2s' }}
            >
              <p className="font-body text-lg leading-relaxed text-foreground/90">
                Каждый участник — <span className="text-primary">воплощение совершенства</span>. 
                Мы не ищем славы — <span className="text-primary">слава ищет нас</span>. 
                Враги трепещут, союзники восхищаются. Мы — <span className="text-primary">божественны</span>.
              </p>
            </div>
          </div>

          {/* Red Banner */}
          <div className="mt-10 flex justify-center">
            <div className="red-banner text-xl md:text-2xl">
              ПРИСОЕДИНИТЬСЯ — ЗНАЧИТ ВОЙТИ В КЛУБ ИЗБРАННЫХ
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
            "Когда мы выходим на арену, <span className="text-primary">небеса замолкают</span>, 
            а враги начинают молиться своим богам. Но их боги — <span className="text-primary">это мы</span>."
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
