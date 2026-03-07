import { useEffect, useState } from 'react';
import { Trash2, Edit, Plus, Eye, EyeOff, Loader2, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { newsAPI, News } from '@/lib/api';
import NewsForm from './NewsForm';

type TabType = 'published' | 'drafts';

const ITEMS_PER_PAGE = 10;

const sortByIdDesc = (items: News[]) => [...items].sort((a, b) => b.id - a.id);
const stripHtml = (value?: string) => (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const NewsAdmin = () => {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const [currentPage, setCurrentPage] = useState(1);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const data = await newsAPI.getAdminList();
      setNews(data);
    } catch {
      toast.error('Ошибка загрузки новостей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const draftNews = news.filter((n) => !n.published_at && !n.is_deleted);
  const publishedNews = news.filter((n) => !!n.published_at && !n.is_deleted);
  const currentNews = activeTab === 'drafts' ? sortByIdDesc(draftNews) : sortByIdDesc(publishedNews);

  const totalPages = Math.ceil(currentNews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNews = currentNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return;
    try {
      await newsAPI.delete(id);
      toast.success('Новость удалена');
      loadNews();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handlePublish = async (item: News) => {
    setPublishingId(item.id);
    try {
      await newsAPI.publish(item.id);
      toast.success('Новость опубликована');
      loadNews();
    } catch {
      toast.error('Ошибка публикации');
    } finally {
      setPublishingId(null);
    }
  };

  const handleMoveUp = async (id: number) => {
    setMovingId(id);
    try {
      const result = await newsAPI.moveUp(id);
      if (result.success) {
        toast.success('Новость перемещена вверх');
      } else {
        toast.info('Эта новость уже в самом верху');
      }
      loadNews();
    } catch {
      toast.error('Ошибка перемещения');
    } finally {
      setMovingId(null);
    }
  };

  const handleMoveDown = async (id: number) => {
    setMovingId(id);
    try {
      const result = await newsAPI.moveDown(id);
      if (result.success) {
        toast.success('Новость перемещена вниз');
      } else {
        toast.info('Эта новость уже в самом низу');
      }
      loadNews();
    } catch {
      toast.error('Ошибка перемещения');
    } finally {
      setMovingId(null);
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingNews(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadNews();
  };

  if (showForm) {
    return <NewsForm news={editingNews} onCancel={handleFormClose} onSuccess={handleFormSuccess} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Управление новостями</h2>
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить новость
        </Button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button type="button"
          onClick={() => setActiveTab('published')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'published'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Опубликованные ({publishedNews.length})
        </button>
        <button type="button"
          onClick={() => setActiveTab('drafts')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'drafts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Черновики ({draftNews.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : currentNews.length === 0 ? (
        <p className="text-muted-foreground">
          {activeTab === 'drafts' ? 'Черновиков нет' : 'Опубликованных новостей нет'}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedNews.map((item, index) => {
              const wasEdited =
                !!item.updated_at &&
                !!item.created_at &&
                new Date(item.updated_at).getTime() > new Date(item.created_at).getTime();

              const absoluteIndex = startIndex + index;
              const isFirst = absoluteIndex === 0;
              const isLast = absoluteIndex === currentNews.length - 1;
              const showArrows = activeTab === 'published';

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                    item.published_at ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/50'
                  }`}
                >
                  {showArrows && (
                    <div className="mr-3 flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(item.id)}
                        disabled={movingId !== null || isFirst}
                        title="Переместить вверх"
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(item.id)}
                        disabled={movingId !== null || isLast}
                        title="Переместить вниз"
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{item.title}</h3>
                      {item.published_at ? (
                        <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-600">
                          <Eye className="h-3 w-3" />
                          Опубликовано
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <EyeOff className="h-3 w-3" />
                          Черновик
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {stripHtml(item.excerpt || item.content).substring(0, 100)}
                    </p>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p>
                        {item.published_at
                          ? `Опубликовано: ${new Date(item.published_at).toLocaleDateString('ru-RU')}`
                          : `Создано: ${new Date(item.created_at).toLocaleDateString('ru-RU')}`}
                        {item.author && ` • ${item.author}`}
                      </p>
                      {wasEdited && item.updated_by_username && (
                        <p className="text-amber-600 dark:text-amber-400">
                          Ред.: {new Date(item.updated_at).toLocaleDateString('ru-RU')} • {item.updated_by_username}
                        </p>
                      )}
                      {item.views_count !== undefined && (
                        <p className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Просмотры: <span className="font-medium text-foreground">{item.views_count}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    {!item.published_at && (
                      <Button type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(item)}
                        disabled={publishingId === item.id || movingId !== null}
                        className="border-green-600/30 text-green-600 hover:bg-green-500/10"
                        title="Опубликовать"
                      >
                        {publishingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={movingId !== null}
                      title="Редактировать"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={movingId !== null}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-4">
              <Button type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                Страница {currentPage} из {totalPages}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button type="button"
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Вперёд →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsAdmin;


