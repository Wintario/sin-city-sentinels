import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Newspaper, Users, Shield, TrendingUp, MessageSquareWarning, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { isAuthenticated, getStoredUser } from '@/lib/api';
import NewsAdmin from '@/components/admin/NewsAdmin';
import MembersAdmin from '@/components/admin/MembersAdmin';
import UsersAdmin from '@/components/admin/UsersAdmin';
import ReportsAdmin from '@/components/admin/ReportsAdmin';
import StatsAdmin from '@/components/admin/StatsAdmin';
import CommentsAdmin from '@/components/admin/CommentsAdmin';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.role === 'author';
  const hasAccess = isAdmin || isAuthor;

  useEffect(() => {
    // Проверяем авторизацию и права доступа
    if (!isAuthenticated()) {
      navigate('/adminka', { replace: true });
      return;
    }

    // Обычные пользователи не имеют доступа к админке
    if (!hasAccess) {
      toast.error('У вас нет доступа к админ-панели');
      navigate('/', { replace: true });
      return;
    }

    setIsLoggedIn(true);
  }, [navigate, hasAccess]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Выход выполнен');
      navigate('/');
    } catch (error) {
      // Ошибка это нормально, токен все равно очищен
      toast.success('Выход выполнен');
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isLoggedIn) {
    return null; // Покажем пусто в время редиректа
  }

  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="font-display text-2xl tracking-wider hover:text-primary transition-colors"
          >
            СВИРЕПЫЕ <span className="text-primary">КРОЛИКИ</span>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Очистка...' : 'Выход'}
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-8 p-4 bg-background rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Вы вошли как: <span className="font-medium text-foreground">{user.username}</span> 
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
              }`}>
                {user.role}
              </span>
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className={`grid w-full mb-8 ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Новости
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Состав
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            {(isAdmin || isAuthor) && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Пользователи
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Комментарии
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4" />
                  Жалобы
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="news" className="bg-background rounded-lg p-6 border border-border">
            <NewsAdmin />
          </TabsContent>

          <TabsContent value="members" className="bg-background rounded-lg p-6 border border-border">
            <MembersAdmin />
          </TabsContent>

          <TabsContent value="stats" className="bg-background rounded-lg p-6 border border-border">
            <StatsAdmin />
          </TabsContent>

          {(isAdmin || isAuthor) && (
            <>
              <TabsContent value="users" className="bg-background rounded-lg p-6 border border-border">
                <UsersAdmin isAdminUser={isAdmin} />
              </TabsContent>
              <TabsContent value="comments" className="bg-background rounded-lg p-6 border border-border">
                <CommentsAdmin />
              </TabsContent>
              <TabsContent value="reports" className="bg-background rounded-lg p-6 border border-border">
                <ReportsAdmin />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
