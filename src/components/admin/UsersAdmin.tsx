import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usersAPI, User } from '@/lib/api';
import { Trash2, Edit, Plus, ArrowLeft, Shield, PenTool, Loader2 } from 'lucide-react';

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'author' as 'admin' | 'author',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersAPI.getList();
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err);
      // Показываем более понятную ошибку
      if (err.message?.includes('404')) {
        toast.error('Endpoint /api/users не найден. Проверьте backend.');
      } else {
        toast.error(err.message || 'Ошибка загрузки администраторов');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (!editingUser) {
      if (!formData.username || formData.username.length < 2) {
        setError('Имя пользователя должно быть минимум 2 символа');
        return;
      }
      if (!formData.password || formData.password.length < 4) {
        setError('Пароль должен быть минимум 4 символа');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        // Обновление
        const updateData: { password?: string; role?: 'admin' | 'author' } = { 
          role: formData.role 
        };
        if (formData.password && formData.password.length >= 4) {
          updateData.password = formData.password;
        }
        await usersAPI.update(editingUser.id, updateData);
        toast.success('Администратор обновлён');
      } else {
        // Создание
        await usersAPI.create({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
        });
        toast.success('Администратор создан');
      }

      setFormData({ username: '', password: '', role: 'author' });
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      // Понятные ошибки
      let message = err.message || 'Ошибка при сохранении';
      if (message.includes('already exists') || message.includes('UNIQUE')) {
        message = 'Пользователь с таким именем уже существует';
      } else if (message.includes('404')) {
        message = 'Endpoint не найден. Проверьте backend.';
      }
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setError('');
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    // Проверка что не удаляем последнего админа
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (user.role === 'admin' && adminCount <= 1) {
      toast.error('Нельзя удалить последнего администратора');
      return;
    }

    if (!confirm(`Удалить администратора "${user.username}"?`)) return;

    try {
      await usersAPI.delete(user.id);
      toast.success('Администратор удалён');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при удалении');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'author' });
    setError('');
  };

  // Проверка можно ли удалить пользователя
  const canDelete = (user: User) => {
    if (user.role !== 'admin') return true;
    const adminCount = users.filter(u => u.role === 'admin').length;
    return adminCount > 1;
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
          {editingUser ? 'Редактирование администратора' : 'Новый администратор'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Имя пользователя
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!editingUser}
              placeholder="Логин"
              required={!editingUser}
              minLength={2}
              maxLength={50}
            />
            {editingUser && (
              <p className="text-xs text-muted-foreground mt-1">
                Имя пользователя нельзя изменить
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Пароль {editingUser && '(оставьте пустым, чтобы не менять)'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Новый пароль (опционально)' : 'Пароль'}
              required={!editingUser}
              minLength={editingUser ? 0 : 4}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Роль
            </label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin' | 'author') => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="author">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Author (редактирование контента)
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin (полный доступ)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUser ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Управление администраторами</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить администратора
        </Button>
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p>💡 <strong>Admin</strong> - полный доступ ко всем разделам</p>
        <p>💡 <strong>Author</strong> - может редактировать новости и участников</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">Администраторов нет</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                user.role === 'admin' 
                  ? 'bg-red-500/5 border-red-500/20' 
                  : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.role === 'admin' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  {user.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-red-500" />
                  ) : (
                    <PenTool className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.username}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      user.role === 'admin' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Author'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(user)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  disabled={!canDelete(user)}
                  title={!canDelete(user) ? 'Нельзя удалить последнего админа' : undefined}
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

export default UsersAdmin;