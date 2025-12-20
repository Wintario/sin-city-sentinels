import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Newspaper, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { isAuthenticated, authAPI, getStoredUser } from '@/lib/api';
import NewsAdmin from '@/components/admin/NewsAdmin';
import MembersAdmin from '@/components/admin/MembersAdmin';
import UsersAdmin from '@/components/admin/UsersAdmin';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Проверяем автентификацию только если мы в админке
    if (!isAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    setIsLoggedIn(true);
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
            {user && (
              <p className="text-muted-foreground text-sm mt-1">
                Вы вошли как: <span className="font-medium">{user.username}</span> 
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {user.role}
                </span>
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Очистка...' : 'Выход'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className={`grid w-full mb-8 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Новости
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Состав
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Администраторы
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="news" className="bg-background rounded-lg p-6 border border-border">
            <NewsAdmin />
          </TabsContent>

          <TabsContent value="members" className="bg-background rounded-lg p-6 border border-border">
            <MembersAdmin />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="bg-background rounded-lg p-6 border border-border">
              <UsersAdmin />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;