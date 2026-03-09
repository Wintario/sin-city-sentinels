import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, MessageCircle, User } from 'lucide-react';
import { newsAPI, News } from '@/lib/api';

const ITEMS_PER_PAGE = 10;

const NewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

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

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await newsAPI.getAll();
        // Сортировка по id DESC (новые сверху, как на сервере)
        const sortedNews = [...data].sort((a, b) => b.id - a.id);
        setNews(sortedNews);
        setIsRateLimited(false);
      } catch (error) {
        console.error('Failed to load news:', error);
        const message = error instanceof Error ? error.message : '';
        setIsRateLimited(message.includes('429') || message.includes('Слишком много запросов'));
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, []);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem('newsScrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
      sessionStorage.removeItem('newsScrollPosition');
    }
  }, []);

  const handleNewsClick = (newsId: number) => {
    sessionStorage.setItem('newsScrollPosition', window.scrollY.toString());
    navigate(`/news/${newsId}`);
  };

  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = news.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section id="news" ref={sectionRef} className="relative py-12 md:py-24 px-2 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div
          className={`newspaper-bg p-4 sm:p-6 md:p-8 lg:p-12 shadow-noir transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center border-b-4 border-double border-noir-dark pb-3 sm:pb-4 mb-6 md:mb-8">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-noir-dark tracking-wider">
              ВЕСТНИК КРОЛИКОВ
            </h2>
            <p className="font-body text-xs sm:text-sm text-noir-gray mt-1 sm:mt-2 uppercase tracking-widest">
              Последние новости клана • Основан 26.09.2006
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-noir-gray">Загрузка новостей...</div>
          ) : isRateLimited ? (
            <div className="text-center py-8 text-noir-gray">
              Слишком много запросов. Попробуйте через несколько минут.
            </div>
          ) : currentNews.length === 0 ? (
            <div className="text-center py-8 text-noir-gray">Новостей пока нет</div>
          ) : (
            <div className="space-y-0">
              {currentNews.map((item, index) => (
                <article
                  key={item.id}
                  className="news-item border-b border-noir-gray/30 py-5 md:py-6 first:pt-0 last:border-b-0 last:pb-0 cursor-pointer transition-colors hover:bg-noir-gray/5"
                  style={{ transitionDelay: `${index * 80}ms` }}
                  onClick={() => handleNewsClick(item.id)}
                >
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {item.image_url && (
                      <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-40 md:h-36 object-cover rounded-sm border border-noir-gray/20"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="news-title font-heading text-xl sm:text-2xl font-bold text-noir-dark leading-tight mb-2 transition-colors duration-200 hover:text-primary">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="font-body text-base text-noir-gray leading-relaxed mb-3">
                          {item.excerpt}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-noir-gray/70">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span className="font-body text-sm">
                          {item.published_at
                            ? new Date(item.published_at).toLocaleDateString('ru-RU')
                            : new Date(item.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="text-noir-gray/40">•</span>
                        <User size={14} className="flex-shrink-0" />
                        <span className="font-body text-sm">{item.author || 'Не указан'}</span>
                        <span className="text-noir-gray/40">•</span>
                        <MessageCircle size={14} className="flex-shrink-0" />
                        <span className="font-body text-sm">
                          {(item.comments_new ?? 0) > 0
                            ? `${item.comments_total ?? 0}/${item.comments_new ?? 0}`
                            : `${item.comments_total ?? 0}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6 md:mt-8 pt-4 border-t border-noir-gray/30 overflow-x-auto">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 sm:p-2 text-noir-dark hover:text-noir-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>

              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 font-display text-sm sm:text-lg transition-colors ${
                      currentPage === page
                        ? 'bg-noir-dark text-white'
                        : 'text-noir-dark hover:bg-noir-gray/20'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 sm:p-2 text-noir-dark hover:text-noir-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          )}

          <div className="text-center border-t-2 border-noir-gray/30 pt-3 md:pt-4 mt-6 md:mt-8">
            <p className="font-body text-xs text-noir-gray italic">
              "Правда острее меча, а наши победы - острее правды"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
