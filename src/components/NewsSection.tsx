import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { newsAPI, News } from '@/lib/api';

const ITEMS_PER_PAGE = 6;

const NewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Загружение новостей с API
  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await newsAPI.getAll();
        // API возвращает только опубликованные новости, отсортированные по published_at DESC
        setNews(data);
      } catch (error) {
        console.error('Failed to load news:', error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, []);

  // Restore scroll position when returning from news detail
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

  // Пагинация
  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = news.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section 
      id="news" 
      ref={sectionRef}
      className="relative py-12 md:py-24 px-2 sm:px-4"
    >
      <div className="container mx-auto max-w-4xl">
        {/* Newspaper Container */}
        <div 
          className={`newspaper-bg p-4 sm:p-6 md:p-8 lg:p-12 shadow-noir transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Newspaper Header */}
          <div className="text-center border-b-4 border-double border-noir-dark pb-3 sm:pb-4 mb-6 md:mb-8">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-noir-dark tracking-wider">
              ВЕСТНИК КРОЛИКОВ
            </h2>
            <p className="font-body text-xs sm:text-sm text-noir-gray mt-1 sm:mt-2 uppercase tracking-widest">
              Последние новости клана • Основан 26.09.2006
            </p>
          </div>

          {/* News Articles */}
          {isLoading ? (
            <div className="text-center py-8 text-noir-gray">
              Загружать новостей...
            </div>
          ) : currentNews.length === 0 ? (
            <div className="text-center py-8 text-noir-gray">
              Новостей пока нет
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {currentNews.map((item, index) => (
                <div 
                  key={item.id}
                  className="news-item bg-transparent cursor-pointer transition-transform hover:translate-y-[-2px]"
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onClick={() => handleNewsClick(item.id)}
                >
                  <h3 className="news-title font-heading text-base sm:text-lg md:text-xl font-bold text-noir-dark leading-tight mb-2 transition-colors duration-200 hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-noir-gray leading-relaxed mb-2">
                    {item.excerpt || item.content?.substring(0, 150)}
                  </p>
                  <div className="flex items-center gap-2 text-noir-gray/70">
                    <Calendar size={12} className="flex-shrink-0" />
                    <span className="font-body text-xs">
                      {item.published_at 
                        ? new Date(item.published_at).toLocaleDateString('ru-RU')
                        : new Date(item.created_at).toLocaleDateString('ru-RU')
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
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

          {/* Newspaper Footer */}
          <div className="text-center border-t-2 border-noir-gray/30 pt-3 md:pt-4 mt-6 md:mt-8">
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