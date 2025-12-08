import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
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
          <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выход
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="news">Новости</TabsTrigger>
            <TabsTrigger value="members">Состав</TabsTrigger>
            <TabsTrigger value="backgrounds">Фоны</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление новостями</h2>
              <Button>+ Добавить новость</Button>
            </div>
            <p className="text-muted-foreground">
              Здесь будет список новостей с возможностью добавления, редактирования и удаления.
            </p>
          </TabsContent>

          <TabsContent value="members" className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление составом</h2>
              <Button>+ Добавить участника</Button>
            </div>
            <p className="text-muted-foreground">
              Здесь будет список 30 участников клана с возможностью редактирования.
            </p>
          </TabsContent>

          <TabsContent value="backgrounds" className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление фонами</h2>
              <Button>+ Добавить фон</Button>
            </div>
            <p className="text-muted-foreground">
              Здесь будет список фоновых изображений с возможностью выбора активного.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
