import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import { newsAPI, News } from '@/lib/api';
import heroRabbit from '@/assets/hero-rabbit.png';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load news from API
  useEffect(() => {
    const loadNews = async () => {
      try {
        if (!id) {
          setError('ID новости не найден');
          setIsLoading(false);
          return;
        }
        
        const data = await newsAPI.getById(Number(id));
        setNews(data);
      } catch (err) {
        console.error('Failed to load news:', err);
        setError('Не удалось загрузить новость');
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [id]);

  // Scroll to top when opening news detail
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Загрузка новости...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display text-foreground mb-4">Новость не найдена</h1>
          <p className="text-muted-foreground mb-6">{error || 'К сожалению, эта новость больше недоступна'}</p>
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
                  {new Date(news.published_at || news.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </header>

            {/* News Image if available */}
            {news.image_url && (
              <div className="mb-6">
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {/* News Content */}
            <div className="prose prose-lg max-w-none">
              {/* Excerpt if available */}
              {news.excerpt && (
                <p className="font-body text-lg text-noir-dark leading-relaxed italic mb-4 border-l-4 border-noir-gray pl-4">
                  {news.excerpt}
                </p>
              )}
              
              {/* Main content */}
              <p className="font-body text-lg text-noir-dark leading-relaxed whitespace-pre-line">
                {news.content}
              </p>
            </div>

            {/* Author and Date Footer */}
            <footer className="mt-8 pt-6 border-t-2 border-noir-gray/30">
              <div className="flex flex-wrap items-center gap-4 text-sm text-noir-gray">
                {news.author && (
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span className="font-body">Автор: <span className="text-noir-dark font-medium">{news.author}</span></span>
                  </div>
                )}
                {news.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="font-body">
                      Опубликовано: <span className="text-noir-dark font-medium">
                        {new Date(news.published_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </footer>
          </article>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NewsDetail;