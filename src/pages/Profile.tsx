import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, authAPI } from '@/lib/api';
import { commentsAPI } from '@/lib/api/comments';
import type { Comment } from '@/types/comments';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, User, MessageSquare, Calendar } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentsLimit = 10;
  const commentsTotalPages = Math.max(1, Math.ceil(commentsTotal / commentsLimit));
  
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
  }, [storedUser?.id, navigate]);

  useEffect(() => {
    if (!storedUser) return;
    loadMyComments(commentsPage);
  }, [storedUser?.id, commentsPage]);

  const loadProfile = async () => {
    if (!storedUser) return;
    
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadMyComments = async (page = 1) => {
    setCommentsLoading(true);
    try {
      const response = await commentsAPI.getMy(page, commentsLimit);
      setRecentComments(response.comments || []);
      setCommentsTotal(response.total || 0);
    } catch (error: any) {
      toast.error('Не удалось загрузить ваши комментарии');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
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

  const toCommentPlainText = (html: string) =>
    String(html || '')
      .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid grid-cols-2 gap-4 flex-1">
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
                  {user?.character_image && (
                    <div className="sm:ml-4">
                      <Label className="text-muted-foreground">Образ персонажа</Label>
                      <div className="mt-2">
                        <img
                          src={user.character_image}
                          alt={`Образ ${user?.username || storedUser.username}`}
                          className="max-w-[220px] h-auto rounded-md border border-border"
                        />
                      </div>
                    </div>
                  )}
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
                    <div className="text-2xl font-bold">{commentsTotal || 0}</div>
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

            <Card>
              <CardHeader>
                <CardTitle>Мои комментарии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Загрузка комментариев...
                  </div>
                ) : recentComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">У вас пока нет комментариев</p>
                ) : (
                  <div className="space-y-2">
                    {recentComments.map((comment) => (
                      <button
                        key={comment.id}
                        type="button"
                        onClick={() => navigate(`/news/${comment.news_id}#comment-${comment.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-sm font-medium">
                          {comment.news_title || `Новость #${comment.news_id}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleString('ru-RU')}
                        </div>
                        <div className="text-sm mt-2 line-clamp-2">
                          {toCommentPlainText(comment.content) || '(пустой комментарий)'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {commentsTotalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (commentsPage > 1) setCommentsPage(commentsPage - 1);
                          }}
                          className={commentsPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: commentsTotalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCommentsPage(p);
                            }}
                            isActive={p === commentsPage}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (commentsPage < commentsTotalPages) setCommentsPage(commentsPage + 1);
                          }}
                          className={commentsPage === commentsTotalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
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
