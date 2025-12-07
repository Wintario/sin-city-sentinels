import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

// Mock news data
const mockNews = [
  {
    id: 1,
    title: 'Великая Осада: Свирепые Кролики захватили легендарный замок противника',
    body: 'После трёхдневной осады наши воины прорвали оборону и водрузили знамя клана над главной башней.',
    created_at: '2025-01-05',
  },
  {
    id: 2,
    title: 'Турнирный триумф: наша команда заняла первое место в Королевском Турнире',
    body: 'Сокрушительная победа над всеми претендентами. Кубок снова у нас.',
    created_at: '2025-01-03',
  },
  {
    id: 3,
    title: 'Зарубежная экспедиция: наши воины достигли 100 побед подряд в Адской Башне',
    body: 'Невероятный рекорд, который вряд ли когда-нибудь будет побит.',
    created_at: '2024-12-28',
  },
  {
    id: 4,
    title: 'Рекордная серия: 7 дней боёв без поражений',
    body: 'Ни одного проигранного сражения за целую неделю непрерывных битв.',
    created_at: '2024-12-20',
  },
  {
    id: 5,
    title: 'Легендарная дуэль: один бой длился ровно 3 часа',
    body: 'Эпическое противостояние вошло в историю АРЕНЫ как самое продолжительное.',
    created_at: '2024-12-15',
  },
  {
    id: 6,
    title: 'Новый союз: заключён пакт о ненападении с кланом Чёрных Волков',
    body: 'Стратегическое партнёрство укрепляет наши позиции на карте.',
    created_at: '2024-12-10',
  },
];

const NewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="news" 
      ref={sectionRef}
      className="relative py-24 px-4"
    >
      <div className="container mx-auto max-w-4xl">
        {/* Newspaper Container */}
        <div 
          className={`newspaper-bg p-8 md:p-12 shadow-noir transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Newspaper Header */}
          <div className="text-center border-b-4 border-double border-noir-dark pb-4 mb-8">
            <h2 className="font-display text-5xl md:text-6xl text-noir-dark tracking-wider">
              ВЕСТНИК КРОЛИКОВ
            </h2>
            <p className="font-body text-sm text-noir-gray mt-2 uppercase tracking-widest">
              Последние новости клана • Основан 26.09.2006
            </p>
          </div>

          {/* News Articles */}
          <div className="columns-1 md:columns-2 gap-8">
            {mockNews.map((news, index) => (
              <div 
                key={news.id}
                className="news-item break-inside-avoid mb-6 bg-transparent"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <h3 className="news-title font-heading text-xl font-bold text-noir-dark leading-tight mb-2 cursor-pointer">
                  {news.title}
                </h3>
                <p className="font-body text-sm text-noir-gray leading-relaxed mb-2">
                  {news.body}
                </p>
                <div className="flex items-center gap-2 text-noir-gray/70">
                  <Calendar size={12} />
                  <span className="font-body text-xs">
                    {new Date(news.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Newspaper Footer */}
          <div className="text-center border-t-2 border-noir-gray/30 pt-4 mt-8">
            <p className="font-body text-xs text-noir-gray italic">
              "Правда острее меча, а наши победы — острее правды"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
