import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { newsAPI, News } from '@/lib/api';
import { Trash2, Edit, Plus, Eye, EyeOff, RotateCcw, Send, Loader2 } from 'lucide-react';
import NewsForm from './NewsForm';

const NewsAdmin = () => {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return;
    
    try {
      await newsAPI.delete(id);
      toast.success('Новость удалена');
      loadNews();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await newsAPI.restore(id);
      toast.success('Новость восстановлена');
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

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground">Новостей пока нет</p>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                item.is_deleted 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : item.published_at
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium truncate ${item.is_deleted ? 'line-through text-muted-foreground' : ''}`}>
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
                {item.is_deleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item.id)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    {!item.published_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(item)}
                        disabled={publishingId === item.id}
                        className="text-green-600 border-green-600/30 hover:bg-green-500/10"
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
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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