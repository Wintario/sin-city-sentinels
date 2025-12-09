import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { aboutCardsAPI, AboutCard } from '@/lib/api';
import { Trash2, Edit, Plus, ArrowLeft, ArrowUp, ArrowDown, Loader2, Check } from 'lucide-react';

const STYLE_TYPES = [
  { value: 'comic-thick-frame', label: 'Жирная рамка', description: 'Толстая граница с небольшим поворотом' },
  { value: 'comic-speech-bubble', label: 'Облачко', description: 'Как в комиксах с хвостиком' },
  { value: 'comic-burst', label: 'Взрыв', description: 'Эффект взрыва по краям' },
  { value: 'comic-rays', label: 'Лучи', description: 'Лучи из центра' },
  { value: 'comic-shadow', label: 'Тень', description: 'Глубокая тень и объём' },
  { value: 'comic-tilt', label: 'Наклон', description: 'Простой поворот на угол' },
];

const AboutAdmin = () => {
  const [cards, setCards] = useState<AboutCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<AboutCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    style_type: 'comic-thick-frame',
  });

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const data = await aboutCardsAPI.getAll();
      setCards(data);
    } catch (error) {
      console.error('Failed to load about cards:', error);
      toast.error('Ошибка загрузки карточек');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Введите заголовок');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Введите описание');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCard) {
        await aboutCardsAPI.update(editingCard.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: formData.image_url.trim() || null,
          style_type: formData.style_type,
        });
        toast.success('Карточка обновлена');
      } else {
        await aboutCardsAPI.create({
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: formData.image_url.trim() || null,
          style_type: formData.style_type,
          order_index: cards.length,
        });
        toast.success('Карточка создана');
      }

      setFormData({ title: '', description: '', image_url: '', style_type: 'comic-thick-frame' });
      setShowForm(false);
      setEditingCard(null);
      await loadCards();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (card: AboutCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description,
      image_url: card.image_url || '',
      style_type: card.style_type,
    });
    setShowForm(true);
  };

  const handleDelete = async (card: AboutCard) => {
    if (!confirm(`Удалить карточку "${card.title}"?`)) return;

    try {
      await aboutCardsAPI.delete(card.id);
      toast.success('Карточка удалена');
      await loadCards();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    }
  };

  const handleMove = async (card: AboutCard, direction: 'up' | 'down') => {
    const currentIndex = cards.findIndex(c => c.id === card.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= cards.length) return;

    try {
      await aboutCardsAPI.reorder(card.id, newIndex);
      await loadCards();
    } catch (error) {
      toast.error('Ошибка перемещения');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCard(null);
    setFormData({ title: '', description: '', image_url: '', style_type: 'comic-thick-frame' });
  };

  // Получить стиль превью карточки
  const getPreviewStyle = (styleType: string) => {
    const baseStyles = 'p-4 rounded transition-all duration-300';
    switch (styleType) {
      case 'comic-thick-frame':
        return `${baseStyles} border-4 border-foreground transform -rotate-1`;
      case 'comic-speech-bubble':
        return `${baseStyles} border-2 border-foreground rounded-2xl relative`;
      case 'comic-burst':
        return `${baseStyles} border-2 border-primary bg-primary/10`;
      case 'comic-rays':
        return `${baseStyles} border-2 border-foreground bg-gradient-radial`;
      case 'comic-shadow':
        return `${baseStyles} border-2 border-foreground shadow-2xl`;
      case 'comic-tilt':
        return `${baseStyles} border-2 border-foreground transform rotate-2`;
      default:
        return baseStyles;
    }
  };

  if (showForm) {
    return (
      <div>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Назад к списку</span>
        </button>

        <h2 className="text-xl font-semibold mb-6">
          {editingCard ? 'Редактирование карточки' : 'Новая карточка'}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Заголовок *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок карточки"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Описание *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Текст карточки"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                URL изображения
              </label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Стиль карточки
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_TYPES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, style_type: style.value })}
                    className={`p-3 rounded border text-left transition-all ${
                      formData.style_type === style.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.style_type === style.value && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                      <span className="font-medium text-sm">{style.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
            </div>
          </form>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Превью
            </label>
            <div className="bg-background p-6 rounded-lg border border-border min-h-[200px]">
              <div className={getPreviewStyle(formData.style_type)}>
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {formData.title || 'Заголовок'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.description || 'Описание карточки'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Управление разделом "О нас"</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить карточку
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <p className="text-muted-foreground">Карточек пока нет</p>
      ) : (
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 border-border"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {card.image_url && (
                  <img 
                    src={card.image_url} 
                    alt={card.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{card.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{card.description}</p>
                  <span className="text-xs text-primary">
                    {STYLE_TYPES.find(s => s.value === card.style_type)?.label || card.style_type}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(card, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(card, 'down')}
                  disabled={index === cards.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(card)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(card)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AboutAdmin;