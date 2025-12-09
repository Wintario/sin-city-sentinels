import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { membersAPI, Member, MemberCreateInput } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

interface MemberFormProps {
  member?: Member | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ROLES = ['Leader', 'Rifler', 'AWP', 'Support'];
const STATUSES = ['active', 'inactive', 'reserve'];

const MemberForm = ({ member, onCancel, onSuccess }: MemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MemberCreateInput>({
    name: member?.name || '',
    role: member?.role || 'Rifler',
    profile_url: member?.profile_url || '',
    status: member?.status || 'active',
    avatar_url: member?.avatar_url || '',
    order_index: member?.order_index,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.role) {
      toast.error('Имя и роль обязательны');
      return;
    }

    setIsLoading(true);

    try {
      if (member) {
        await membersAPI.update(member.id, formData);
        toast.success('Участник обновлён');
      } else {
        await membersAPI.create(formData);
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
        {member ? 'Редактирование участника' : 'Новый участник'}
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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Роль *
          </label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => handleSelectChange('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите роль" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Статус
          </label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'active' ? 'Активен' : status === 'inactive' ? 'Неактивен' : 'В резерве'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            placeholder="https://example.com/profile"
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
