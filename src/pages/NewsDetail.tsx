import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Eye, MessageSquare } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RainEffect from '@/components/RainEffect';
import FilmGrain from '@/components/FilmGrain';
import { newsAPI, statsAPI, News } from '@/lib/api';
import { CommentsContainer } from '@/components/comments';
import heroRabbit from '@/assets/hero-rabbit.png';
import './NewsDetail.css';

const normalizeUploadUrl = (url: string) => {
  if (url.startsWith('/uploads/')) {
    return `/api${url}`;
  }
  return url;
};

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTracked, setViewTracked] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const normalizedContent = useMemo(() => {
    const content = news?.content || '';
    return content.replace(
      /&lt;img\s+([^>]*?alt="video:(?:external|upload):[^"]+"[^>]*?)\/?&gt;/gi,
      (_match, attrs) => `<img ${attrs.trim()} />`
    );
  }, [news?.content]);

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

  // Track view when news is loaded
  useEffect(() => {
    if (news && news.id && !viewTracked) {
      const trackView = async () => {
        try {
          await statsAPI.trackNewsView(news.id);
          setViewTracked(true);
        } catch (err) {
          console.error('Failed to track view:', err);
          // Не показываем ошибку пользователю, это вспомогательный функционал
        }
      };
      
      trackView();
    }
  }, [news, viewTracked]);

  // Scroll to top when opening news detail
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const placeholders = root.querySelectorAll('img[alt^="video:"]');
    placeholders.forEach((imgNode) => {
      const img = imgNode as HTMLImageElement;
      const marker = img.alt || '';
      if (!marker.startsWith('video:')) return;

      let type: 'external' | 'upload' | null = null;
      let value = '';

      if (marker.startsWith('video:external:')) {
        type = 'external';
        value = decodeURIComponent(marker.replace('video:external:', ''));
      } else if (marker.startsWith('video:upload:')) {
        type = 'upload';
        value = decodeURIComponent(marker.replace('video:upload:', ''));
      }

      if (!type || !value) return;

      const block = document.createElement('div');
      block.className = 'video-block';
      block.dataset.videoType = type;

      if (type === 'external') {
        block.dataset.embed = value;
      } else {
        block.dataset.video = normalizeUploadUrl(value);
      }

      const thumb = document.createElement('img');
      const rawThumbSrc = img.getAttribute('src') || '';
      thumb.src = rawThumbSrc ? normalizeUploadUrl(rawThumbSrc) : img.src;
      thumb.alt = 'Video preview';
      thumb.className = 'video-thumb';
      thumb.loading = 'lazy';

      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'video-play';
      play.setAttribute('aria-label', 'Play video');
      play.textContent = '▶';

      block.appendChild(thumb);
      block.appendChild(play);
      img.replaceWith(block);
    });

    // Для иконки клана: если title не сохранился после редактора, восстанавливаем из alt
    const clanIcons = root.querySelectorAll('img');
    clanIcons.forEach((imgNode) => {
      const img = imgNode as HTMLImageElement;
      const alt = (img.alt || '').trim();
      if (img.title) return;

      if (/^Логотип\s+/i.test(alt)) {
        img.title = alt.replace(/^Логотип\s+/i, '').trim();
      }
    });

    const handleVideoClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const block = target?.closest('.video-block') as HTMLElement | null;
      if (!block || block.dataset.loaded === 'true') return;

      const type = block.dataset.videoType;
      const wrapper = document.createElement('div');
      wrapper.className = 'video-wrapper';

      if (type === 'external') {
        const embed = block.dataset.embed;
        if (!embed) return;

        const iframe = document.createElement('iframe');
        iframe.src = embed;
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        wrapper.appendChild(iframe);
      } else {
        const videoSrc = block.dataset.video;
        if (!videoSrc) return;

        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';

        const source = document.createElement('source');
        source.src = videoSrc;
        source.type = 'video/mp4';
        video.appendChild(source);
        wrapper.appendChild(video);
      }

      block.innerHTML = '';
      block.appendChild(wrapper);
      block.dataset.loaded = 'true';
      block.classList.add('video-block-loaded');
    };

    root.addEventListener('click', handleVideoClick);
    return () => root.removeEventListener('click', handleVideoClick);
  }, [normalizedContent]);

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
        <div className="container mx-auto max-w-3xl lg:max-w-6xl" onClick={(e) => e.stopPropagation()}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span className="font-body">Вернуться в вестник</span>
          </button>

          {/* News Content */}
          <article className="newspaper-bg p-8 md:p-12 shadow-noir cursor-default" style={{ background: '#ffffff' }}>
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
                  className="w-full h-64 object-cover rounded-lg"
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

              {/* Main content - render as HTML */}
              <div
                className="font-body text-lg text-noir-dark leading-relaxed news-content"
                style={{ background: '#ffffff', padding: '1rem' }}
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: normalizedContent }}
              />
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
                {news.views_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span className="font-body">
                      Просмотров: <span className="text-noir-dark font-medium">{news.views_count}</span>
                    </span>
                  </div>
                )}
              </div>
            </footer>
          </article>

          {/* Comments Section */}
          <div className="mt-12 mb-8">
            <CommentsContainer newsId={Number(id)} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NewsDetail;
