import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { newsAPI, News } from '@/lib/api';
import { Trash2, Edit, Plus, Eye, EyeOff, RotateCcw, Send, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import NewsForm from './NewsForm';

type TabType = 'active' | 'archived';

const NewsAdmin = () => {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const data = await newsAPI.getAdminList();
      setNews(data);
    } catch (error) {
      toast.error('Ошибка загрузки новостей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Фильтрация по вкладкам
  const activeNews = news.filter(n => !n.is_archived && !n.is_deleted);
  const archivedNews = news.filter(n => n.is_archived && !n.is_deleted);
  const currentNews = activeTab === 'active' ? activeNews : archivedNews;

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость навсегда?')) return;
    
    try {
      await newsAPI.delete(id);
      toast.success('Новость удалена');
      loadNews();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await newsAPI.archive(id);
      toast.success('Новость архивирована');
      loadNews();
    } catch (error) {
      toast.error('Ошибка архивации');
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await newsAPI.unarchive(id);
      toast.success('Новость восстановлена из архива');
      loadNews();
    } catch (error) {
      toast.error('Ошибка восстановления');
    }
  };

  const handlePublish = async (item: News) => {
    setPublishingId(item.id);
    try {
      await newsAPI.update(item.id, {
        title: item.title,
        content: item.content,
        excerpt: item.excerpt,
        image_url: item.image_url,
        published_at: new Date().toISOString(),
      });
      toast.success('Новость опубликована');
      loadNews();
    } catch (error) {
      toast.error('Ошибка публикации');
    } finally {
      setPublishingId(null);
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
    return (
      <NewsForm
        news={editingNews}
        onCancel={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Управление новостями</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить новость
        </Button>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Активные ({activeNews.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'archived'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Архив ({archivedNews.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : currentNews.length === 0 ? (
        <p className="text-muted-foreground">
          {activeTab === 'active' ? 'Активных новостей нет' : 'Архив пуст'}
        </p>
      ) : (
        <div className="space-y-3">
          {currentNews.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                item.is_archived
                  ? 'bg-muted/30 border-border'
                  : item.published_at
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">
                    {item.title}
                  </h3>
                  {item.published_at ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-600">
                      <Eye className="w-3 h-3" />
                      Опубликовано
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      <EyeOff className="w-3 h-3" />
                      Черновик
                    </span>
                  )}
                  {item.is_archived && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-600">
                      <Archive className="w-3 h-3" />
                      Архив
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {item.excerpt || item.content?.substring(0, 100)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.published_at 
                    ? `Опубликовано: ${new Date(item.published_at).toLocaleDateString('ru-RU')}`
                    : `Создано: ${new Date(item.created_at).toLocaleDateString('ru-RU')}`
                  }
                  {item.author && ` • ${item.author}`}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {activeTab === 'archived' ? (
                  // Кнопки для архивных новостей
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnarchive(item.id)}
                      title="Восстановить из архива"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      title="Удалить навсегда"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  // Кнопки для активных новостей
                  <>
                    {!item.published_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(item)}
                        disabled={publishingId === item.id}
                        className="text-green-600 border-green-600/30 hover:bg-green-500/10"
                        title="Опубликовать"
                      >
                        {publishingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(item.id)}
                      title="В архив"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
