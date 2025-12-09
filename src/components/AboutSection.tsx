import { useEffect, useRef, useState } from 'react';
import { aboutCardsAPI, AboutCard } from '@/lib/api';

// Стили для карточек
const getCardStyle = (styleType: string) => {
  switch (styleType) {
    case 'comic-thick-frame':
      return 'border-4 border-foreground transform -rotate-1 shadow-[4px_4px_0_hsl(0_0%_0%)]';
    case 'comic-speech-bubble':
      return 'border-3 border-foreground rounded-lg relative before:content-[""] before:absolute before:bottom-[-15px] before:left-[30px] before:border-[15px] before:border-solid before:border-t-foreground before:border-transparent before:border-b-0';
    case 'comic-burst':
      return 'border-4 border-primary bg-primary/5 shadow-[0_0_20px_hsl(var(--blood-red)/0.3)]';
    case 'comic-rays':
      return 'border-3 border-foreground bg-gradient-radial from-card to-background';
    case 'comic-shadow':
      return 'border-3 border-foreground shadow-2xl shadow-black/50';
    case 'comic-tilt':
      return 'border-3 border-foreground transform rotate-2';
    default:
      return 'border-3 border-foreground';
  }
};

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cards, setCards] = useState<AboutCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Загрузка карточек с API
  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await aboutCardsAPI.getAll();
        setCards(data);
      } catch (error) {
        console.error('Failed to load about cards:', error);
        // Fallback to default content
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);

  // Если карточки загружены и есть данные - показываем их
  // Иначе показываем дефолтный контент
  const hasCustomCards = cards.length > 0;

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="container mx-auto max-w-5xl">
        {hasCustomCards ? (
          // Карточки из API
          <div className="grid md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`bg-card p-6 ${getCardStyle(card.style_type)} transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {card.image_url && (
                  <img 
                    src={card.image_url} 
                    alt={card.title}
                    className="w-full h-48 object-cover mb-4 grayscale hover:grayscale-0 transition-all duration-300"
                  />
                )}
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {card.title}
                </h3>
                <p className="font-body text-lg leading-relaxed text-foreground/90">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // Дефолтный контент (как было раньше)
          <>
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
          </>
        )}
      </div>
    </section>
  );
};

export default AboutSection;