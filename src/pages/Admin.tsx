import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { isAuthenticated, authAPI, getStoredUser } from '@/lib/api';
import NewsAdmin from '@/components/admin/NewsAdmin';
import MembersAdmin from '@/components/admin/MembersAdmin';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    toast.success('Выход выполнен');
    navigate('/');
  };

  if (!isLoggedIn) {
    return null;
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
                Вы вошли как: <span className="font-medium">{user.username}</span> ({user.role})
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выход
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="news">Новости</TabsTrigger>
            <TabsTrigger value="members">Состав</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="bg-background rounded-lg p-6 border border-border">
            <NewsAdmin />
          </TabsContent>

          <TabsContent value="members" className="bg-background rounded-lg p-6 border border-border">
            <MembersAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
