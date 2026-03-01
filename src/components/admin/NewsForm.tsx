import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { newsAPI, News, NewsCreateInput, apiUpload } from '@/lib/api';
import { ArrowLeft, Eye, Monitor, Tablet } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import NewsHeaderImageUploader from './NewsHeaderImageUploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import '@/pages/NewsDetail.css';

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
    card_width: news?.card_width || 'wide',
  });
  const [showPreview, setShowPreview] = useState(false);
  // const [cardWidth, setCardWidth] = useState<'wide' | 'narrow'>(news?.card_width as 'wide' | 'narrow' || 'wide');

  // Синхронизация cardWidth с formData при изменении
  // useEffect(() => {
  //   setFormData(prev => ({ ...prev, card_width: cardWidth }));
  // }, [cardWidth]);

  // Обработка изменения текстовых полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || null
    }));
  };

  // Обработка изменения контента из RichTextEditor
  const handleContentChange = (html: string) => {
    setFormData(prev => ({
      ...prev,
      content: html
    }));
  };

  // Автозаполнение краткого описания
  const autoGenerateExcerpt = () => {
    if (!formData.content) {
      toast.error('Сначала введите контент новости');
      return;
    }
    
    // Удаляем HTML теги
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Берём первые 150 символов или 30% если текст короткий
    const length = textContent.length <= 500 
      ? Math.floor(textContent.length * 0.3) 
      : 150;
    
    const excerpt = textContent.substring(0, length).trim() + '...';
    setFormData(prev => ({ ...prev, excerpt }));
    toast.success('Краткое описание сгенерировано');
  };

  // Загрузка изображения для контента
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Используем тот же endpoint что и ImageUploader
      const result = await apiUpload<{ url: string; file?: { url: string } }>(
        '/upload/image',
        file,
        'images'
      );
      
      console.log('NewsForm upload result:', result);
      
      // Извлекаем URL из ответа
      let imageUrl: string | undefined;
      if ('files' in result && Array.isArray(result.files) && result.files.length > 0) {
        imageUrl = result.files[0].url;
      } else if ('file' in result && result.file && typeof result.file === 'object' && 'url' in result.file) {
        imageUrl = (result.file as { url: string }).url;
      } else if ('url' in result) {
        imageUrl = result.url;
      }
      
      console.log('NewsForm extracted imageUrl:', imageUrl);
      
      if (!imageUrl) {
        throw new Error('Сервер не вернул URL изображения');
      }
      
      return imageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки изображения';
      toast.error(message);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();

    // Валидация согласно backend требованиям
    if (!formData.title.trim() || formData.title.length < 3) {
      toast.error('Заголовок должен быть минимум 3 символа');
      return;
    }

    // Очищаем HTML от тегов для проверки длины контента
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textContent.trim() || textContent.length < 10) {
      toast.error('Содержание должно быть минимум 10 символов. Сейчас: ' + textContent.length);
      console.log('Content validation failed:', {
        htmlLength: formData.content.length,
        textLength: textContent.length,
        html: formData.content.substring(0, 200)
      });
      return;
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      toast.error('Краткое описание не должно превышать 500 символов');
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend: NewsCreateInput = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        published_at: publish ? new Date().toISOString() : null,
      };

      console.log('Submitting news:', dataToSend);

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
      console.error('Error details:', {
        message,
        stack: error instanceof Error ? error.stack : 'N/A',
        dataSent: formData
      });
      toast.error(message + (publish ? ' (Публикация не удалась)' : ''));
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

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Изображение шапки - ПЕРЕД заголовком */}
        <div>
          <NewsHeaderImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
          />
        </div>

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
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="excerpt" className="block text-sm font-medium text-muted-foreground">
              Краткое описание (макс. 500 символов)
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={autoGenerateExcerpt}
              className="h-6 text-xs"
            >
              Автозаполнение
            </Button>
          </div>
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
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Содержание * (мин. 10 символов)
          </label>

          {/* Переключатель форматов карточки - ЗАКОММЕНТИРОВАНО ВРЕМЕННО
          <div className="flex items-center justify-center gap-2 py-2 mb-2 border border-border rounded bg-muted/30">
            <span className="text-xs text-muted-foreground">Формат:</span>
            <Button
              type="button"
              variant={cardWidth === 'wide' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCardWidth('wide')}
              className="h-7 px-2"
              title="Широкая карточка (100%)"
            >
              <Monitor className="h-3 w-3 mr-1" />
              <span className="text-xs">Широкая</span>
            </Button>
            <Button
              type="button"
              variant={cardWidth === 'narrow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCardWidth('narrow')}
              className="h-7 px-2"
              title="Узкая карточка (600px)"
            >
              <Tablet className="h-3 w-3 mr-1" />
              <span className="text-xs">Узкая</span>
            </Button>
          </div>
          --> */}

          <RichTextEditor
            content={formData.content}
            onChange={handleContentChange}
            onImageUpload={handleImageUpload}
            maxLength={50000}
            placeholder="Введите текст новости..."
          />
        </div>

        {news?.published_at && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-500">
              Опубликовано: {new Date(news.published_at).toLocaleString('ru-RU')}
            </p>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={isLoading || !formData.content}
          >
            <Eye className="w-4 h-4 mr-2" />
            Предпросмотр
          </Button>
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

      {/* Предпросмотр */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предпросмотр новости</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt={formData.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold">{formData.title}</h2>
            {formData.excerpt && (
              <p className="text-muted-foreground italic border-l-4 border-primary pl-4">
                {formData.excerpt}
              </p>
            )}
            <div
              className="prose prose-lg max-w-none"
            >
              <div
                className="news-content"
                style={{ background: '#ffffff', padding: '1rem' }}
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsForm;
