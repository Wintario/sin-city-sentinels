import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, clearToken, authAPI } from '@/lib/api';
import { commentsAPI } from '@/lib/api/comments';
import type { Comment } from '@/types/comments';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, User, MessageSquare, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Profile = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!storedUser) {
      toast.error('Необходимо войти в систему');
      navigate('/auth');
      return;
    }
    
    // Загрузка данных профиля
    loadProfile();
  }, [storedUser]);

  const loadProfile = async () => {
    if (!storedUser) return;
    
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      
      // Загрузка последних комментариев
      // В будущем можно добавить API метод для этого
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = () => {
    clearToken();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    setIsLoading(true);
    try {
      // В будущем добавить API метод для смены пароля
      toast.success('Пароль изменён (заглушка)');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка смены пароля');
    } finally {
      setIsLoading(false);
    }
  };

  if (!storedUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onHover={() => {}} />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              Профиль
            </h1>
            <p className="text-muted-foreground mt-1">
              Управление вашим аккаунтом
            </p>
          </div>

          <div className="grid gap-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle>Информация о пользователе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ник в Арене</Label>
                    <div className="font-medium">{user?.username || storedUser.username}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Роль</Label>
                    <div className="font-medium capitalize">
                      {user?.role || storedUser.role}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Верификация</Label>
                    <div>
                      {user?.is_verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Верифицирован
                        </span>
                      ) : (
                        <span className="text-yellow-600">Не верифицирован</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              </CardContent>
            </Card>

            {/* Смена пароля */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Безопасность
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? 'Отмена' : 'Изменить пароль'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showPasswordForm ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Текущий пароль</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Новый пароль</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Подтверждение</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        'Сохранить новый пароль'
                      )}
                    </Button>
                  </form>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Нажмите "Изменить пароль", чтобы обновить ваш пароль
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Статистика */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Активность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{recentComments.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Комментариев</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Дата регистрации</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
