import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import heroRabbit from '@/assets/hero-rabbit.png';

// Mock news data (same as NewsSection)
const mockNews = [
  {
    id: 1,
    title: 'Великая Осада: Свирепые Кролики захватили легендарный замок противника',
    body: 'После трёхдневной осады наши воины прорвали оборону и водрузили знамя клана над главной башней. Это была эпическая битва, которая войдёт в историю АРЕНЫ. Каждый воин клана проявил невероятную отвагу и мастерство. Враги бежали, не выдержав натиска Свирепых Кроликов. Замок теперь принадлежит нам навечно.',
    created_at: '2025-01-05',
  },
  {
    id: 2,
    title: 'Турнирный триумф: наша команда заняла первое место в Королевском Турнире',
    body: 'Сокрушительная победа над всеми претендентами. Кубок снова у нас. В финале мы одолели сильнейших соперников, доказав, что Свирепые Кролики — это сила, с которой нужно считаться. Наши воины показали высочайший класс тактики и командной работы.',
    created_at: '2025-01-03',
  },
  {
    id: 3,
    title: 'Зарубежная экспедиция: наши воины достигли 100 побед подряд в Адской Башне',
    body: 'Невероятный рекорд, который вряд ли когда-нибудь будет побит. Наши лучшие воины прошли через все уровни Адской Башни без единого поражения. Это достижение навсегда останется в летописях клана как символ нашего величия.',
    created_at: '2024-12-28',
  },
  {
    id: 4,
    title: 'Рекордная серия: 7 дней боёв без поражений',
    body: 'Ни одного проигранного сражения за целую неделю непрерывных битв. Наши воины сражались день и ночь, не зная усталости. Этот рекорд — свидетельство нашей непобедимости.',
    created_at: '2024-12-20',
  },
  {
    id: 5,
    title: 'Легендарная дуэль: один бой длился ровно 3 часа',
    body: 'Эпическое противостояние вошло в историю АРЕНЫ как самое продолжительное. Два величайших воина сражались на пределе своих возможностей. В итоге победа осталась за нашим представителем.',
    created_at: '2024-12-15',
  },
  {
    id: 6,
    title: 'Новый союз: заключён пакт о ненападении с кланом Чёрных Волков',
    body: 'Стратегическое партнёрство укрепляет наши позиции на карте. Теперь у нас есть надёжный тыл, и мы можем сосредоточиться на завоевании новых территорий.',
    created_at: '2024-12-10',
  },
];

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const news = mockNews.find(n => n.id === Number(id));

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display text-foreground mb-4">Новость не найдена</h1>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url(${heroRabbit})`,
          filter: 'contrast(1.2) brightness(0.5)',
        }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-background/70 z-0" />

      {/* Rain Effect */}
      <RainEffect intensity={1} />
      
      {/* Film Grain Overlay */}
      <FilmGrain />

      {/* Navigation */}
      <Navigation onHover={() => {}} />

      {/* Main Content - Clickable Overlay */}
      <main 
        className="relative z-20 pt-32 pb-24 px-4 min-h-screen cursor-pointer"
        onClick={handleOverlayClick}
      >
        <div className="container mx-auto max-w-3xl" onClick={(e) => e.stopPropagation()}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span className="font-body">Вернуться в вестник</span>
          </button>

          {/* News Content */}
          <article className="newspaper-bg p-8 md:p-12 shadow-noir cursor-default">
            <header className="border-b-2 border-noir-dark pb-6 mb-6">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-noir-dark leading-tight mb-4">
                {news.title}
              </h1>
              <div className="flex items-center gap-2 text-noir-gray">
                <Calendar size={16} />
                <time className="font-body">
                  {new Date(news.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              <p className="font-body text-lg text-noir-dark leading-relaxed whitespace-pre-line">
                {news.body}
              </p>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NewsDetail;
