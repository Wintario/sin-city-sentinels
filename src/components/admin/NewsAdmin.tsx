import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { newsAPI, News } from '@/lib/api';
import { Trash2, Edit, Plus, Eye, EyeOff, Loader2, Send, Menu } from 'lucide-react';
import NewsForm from './NewsForm';

type TabType = 'drafts' | 'published';

const NewsAdmin = () => {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('drafts');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
  const draftNews = news.filter(n => !n.published_at && !n.is_deleted);
  const publishedNews = news.filter(n => n.published_at && !n.is_deleted);
  const currentNews = activeTab === 'drafts' ? draftNews : publishedNews;

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

  const handlePublish = async (item: News) => {
    setPublishingId(item.id);
    try {
      await newsAPI.publish(item.id);
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setIsReordering(true);

    try {
      // Создаём новый порядок
      const newOrder = [...currentNews];
      const draggedIndex = newOrder.findIndex(n => n.id === draggedId);
      const targetIndex = newOrder.findIndex(n => n.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Перемещаем элемент
        const [dragged] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, dragged);

        // Отправляем новый порядок на сервер
        const newsIds = newOrder.map(n => n.id);
        
        const result = await newsAPI.reorder(newsIds);

        toast.success('Порядок обновлён');
        loadNews();
      }
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setDraggedId(null);
      setIsReordering(false);
    }
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
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'drafts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Черновики ({draftNews.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'published'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Опубликованные ({publishedNews.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : currentNews.length === 0 ? (
        <p className="text-muted-foreground">
          {activeTab === 'drafts' ? 'Черновиков нет' : 'Опубликованных новостей нет'}
        </p>
      ) : (
        <div className="space-y-3">
          {currentNews.map((item) => {
            // Проверяем было ли редактирование
            const wasEdited = item.updated_at && item.created_at && 
              new Date(item.updated_at).getTime() > new Date(item.created_at).getTime();
            
            return (
              <div
                key={item.id}
                draggable={activeTab === 'published' && !isReordering}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  item.published_at
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-muted/50 border-border'
                } ${
                  draggedId === item.id
                    ? 'opacity-50 cursor-grabbing'
                    : activeTab === 'published'
                    ? 'cursor-grab hover:shadow-md'
                    : ''
                }`}
              >
                {/* Drag handle для опубликованных новостей */}
                {activeTab === 'published' && !isReordering && (
                  <div className="flex items-center gap-3 mr-3">
                    <Menu className="w-5 h-5 text-muted-foreground opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                )}
                
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
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {item.excerpt || item.content?.substring(0, 100)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>
                      {item.published_at 
                        ? `Опубликовано: ${new Date(item.published_at).toLocaleDateString('ru-RU')}`
                        : `Создано: ${new Date(item.created_at).toLocaleDateString('ru-RU')}`
                      }
                      {item.author && ` • ${item.author}`}
                    </p>
                    {wasEdited && item.updated_by_username && (
                      <p className="text-amber-600 dark:text-amber-400">
                        Ред.: {new Date(item.updated_at).toLocaleDateString('ru-RU')} • {item.updated_by_username}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
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
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;