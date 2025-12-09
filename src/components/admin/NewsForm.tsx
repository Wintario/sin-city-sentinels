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
    excerpt: news?.excerpt || '',
    image_url: news?.image_url || '',
    published_at: news?.published_at || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Заголовок и содержание обязательны');
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        published_at: publish ? new Date().toISOString() : formData.published_at || null,
      };

      if (news) {
        await newsAPI.update(news.id, dataToSend);
        toast.success('Новость обновлена');
      } else {
        await newsAPI.create(dataToSend);
        toast.success('Новость создана');
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
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
            Заголовок *
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Введите заголовок"
            required
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-muted-foreground mb-1">
            Краткое описание
          </label>
          <Input
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Краткое описание для превью"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-muted-foreground mb-1">
            Содержание *
          </label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Полный текст новости"
            rows={10}
            required
          />
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-muted-foreground mb-1">
            URL изображения
          </label>
          <Input
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить как черновик'}
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            disabled={isLoading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {isLoading ? 'Публикация...' : 'Опубликовать'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;
