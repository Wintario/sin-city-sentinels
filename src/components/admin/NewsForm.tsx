import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { newsAPI, News, NewsCreateInput } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

interface NewsFormProps {
  news?: News | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const NewsForm = ({ news, onCancel, onSuccess }: NewsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<NewsCreateInput>({
    title: news?.title || '',
    content: news?.content || '',
    excerpt: news?.excerpt || null,
    image_url: news?.image_url || null,
    published_at: news?.published_at || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value || null 
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    
    // Валидация согласно backend требованиям
    if (!formData.title.trim() || formData.title.length < 3) {
      toast.error('Заголовок должен быть минимум 3 символа');
      return;
    }
    
    if (!formData.content.trim() || formData.content.length < 10) {
      toast.error('Содержание должно быть минимум 10 символов');
      return;
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      toast.error('Краткое описание не должно превышать 500 символов');
      return;
    }

    setIsLoading(true);

    try {
      // Подготовка данных для отправки
      const dataToSend: NewsCreateInput = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        // Если publish=true, ставим текущую дату
        // Если publish=false - ставим null (черновик)
        published_at: publish ? new Date().toISOString() : null,
      };

      if (news) {
        await newsAPI.update(news.id, dataToSend);
        toast.success(publish ? 'Новость опубликована' : 'Новость сохранена как черновик');
      } else {
        await newsAPI.create(dataToSend);
        toast.success(publish ? 'Новость создана и опубликована' : 'Черновик создан');
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      console.error('Submit error:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>Назад к списку</span>
      </button>

      <h2 className="text-xl font-semibold mb-6">
        {news ? 'Редактирование новости' : 'Новая новость'}
      </h2>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
            Заголовок * (мин. 3 символа)
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Введите заголовок"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-muted-foreground mb-1">
            Краткое описание (макс. 500 символов)
          </label>
          <Input
            id="excerpt"
            name="excerpt"
            value={formData.excerpt || ''}
            onChange={handleChange}
            placeholder="Краткое описание для превью"
            maxLength={500}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-muted-foreground mb-1">
            Содержание * (мин. 10 символов)
          </label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Полный текст новости"
            rows={10}
            required
            minLength={10}
          />
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-muted-foreground mb-1">
            URL изображения
          </label>
          <Input
            id="image_url"
            name="image_url"
            value={formData.image_url || ''}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {news?.published_at && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-500">
              Опубликовано: {new Date(news.published_at).toLocaleString('ru-RU')}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="outline" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить как черновик'}
          </Button>
          <Button 
            type="button" 
            disabled={isLoading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {isLoading ? 'Публикация...' : 'Опубликовать'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;