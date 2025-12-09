import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { membersAPI, Member } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

interface MemberFormProps {
  member?: Member | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const MemberForm = ({ member, onCancel, onSuccess }: MemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!member;
  
  // Только 3 поля: name, avatar_url, profile_url
  const [formData, setFormData] = useState({
    name: member?.name || '',
    avatar_url: member?.avatar_url || '',
    profile_url: member?.profile_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name.trim() || formData.name.length < 2) {
      toast.error('Имя должно быть минимум 2 символа');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        await membersAPI.update(member.id, {
          name: formData.name.trim(),
          avatar_url: formData.avatar_url?.trim() || null,
          profile_url: formData.profile_url?.trim() || null,
        });
        toast.success('Участник обновлён');
      } else {
        await membersAPI.create({
          name: formData.name.trim(),
          role: 'Боец', // Дефолтная роль для backend
          status: 'active',
          avatar_url: formData.avatar_url?.trim() || null,
          profile_url: formData.profile_url?.trim() || null,
        });
        toast.success('Участник добавлен');
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
        {isEditing ? 'Редактирование участника' : 'Новый участник'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
            Имя *
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Никнейм участника"
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-muted-foreground mb-1">
            URL аватара
          </label>
          <Input
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />
          {formData.avatar_url && (
            <div className="mt-2">
              <img 
                src={formData.avatar_url} 
                alt="Preview" 
                className="w-16 h-16 rounded-full object-cover border border-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="profile_url" className="block text-sm font-medium text-muted-foreground mb-1">
            URL профиля
          </label>
          <Input
            id="profile_url"
            name="profile_url"
            value={formData.profile_url}
            onChange={handleChange}
            placeholder="https://kovcheg2.apeha.ru/info.html?user=..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;