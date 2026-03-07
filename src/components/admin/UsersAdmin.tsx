import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, reportsAPI, UserWithProfileExtended, BanInfo } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Edit, Trash2, KeyRound, Shield, UserX, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UsersAdminProps {
  isAdminUser: boolean;
}

const UsersAdmin = ({ isAdminUser }: UsersAdminProps) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithProfileExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [editingUser, setEditingUser] = useState<UserWithProfileExtended | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [userForAction, setUserForAction] = useState<UserWithProfileExtended | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [banDuration, setBanDuration] = useState('1h');
  const [banReason, setBanReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [banInfoMap, setBanInfoMap] = useState<Map<number, BanInfo>>(new Map());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersAPI.getList();
      setUsers(data);
      
      // Загружаем информацию о банах для всех пользователей
      const banMap = new Map<number, BanInfo>();
      for (const user of data) {
        try {
          const banResponse = await usersAPI.getBanInfo(user.id);
          if (banResponse.ban) {
            banMap.set(user.id, banResponse.ban);
          }
        } catch (e) {
          // У пользователя нет активного бана
        }
      }
      setBanInfoMap(banMap);
    } catch (error: any) {
      toast.error('Не удалось загрузить пользователей');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: UserWithProfileExtended) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsActionLoading(true);
    try {
      await usersAPI.update(editingUser.id, {
        username: editingUser.username,
        email: editingUser.email,
        arenaNickname: editingUser.arena_nickname,
        role: editingUser.role,
      });
      toast.success('Пользователь обновлён');
      setShowEditDialog(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userForAction) return;

    setIsActionLoading(true);
    try {
      await usersAPI.permanentDelete(userForAction.id);
      toast.success('Пользователь полностью удалён');
      setShowDeleteDialog(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!userForAction) return;

    setIsActionLoading(true);
    try {
      await usersAPI.ban(userForAction.id, {
        banDuration,
        reason: banReason || undefined
      });
      toast.success(banDuration === 'permanent' ? 'Пользователь забанен навсегда' : `Пользователь забанен`);
      setShowBanDialog(false);
      setBanDuration('1h');
      setBanReason('');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка бана');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnban = async (userId: number) => {
    setIsActionLoading(true);
    try {
      await usersAPI.unban(userId);
      toast.success('Пользователь разбанен');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка разбана');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userForAction || !newPassword) {
      toast.error('Введите новый пароль');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsActionLoading(true);
    try {
      await usersAPI.resetPassword(userForAction.id, newPassword);
      toast.success('Пароль сброшен');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сброса пароля');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.arena_nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'author': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAdminUser ? 'Пользователи' : 'Просмотр пользователей'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdminUser
              ? 'Управление зарегистрированными пользователями'
              : 'Просмотр списка пользователей (только для администраторов)'}
          </p>
        </div>
        {isAdminUser && (
          <Button type="button" onClick={() => navigate('/admin/reports')}>
            Перейти к жалобам
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск по email, нику..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="admin">Админ</SelectItem>
            <SelectItem value="author">Автор</SelectItem>
            <SelectItem value="user">Пользователь</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Ник в Арене</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Верификация</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead className="w-[80px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      {user.display_name && user.display_name !== user.username && (
                        <div className="text-sm text-muted-foreground">{user.display_name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.arena_nickname || (
                      <span className="text-muted-foreground">Не указан</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {banInfoMap.has(user.id) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="bg-red-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Забанен
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            {(() => {
                              const ban = banInfoMap.get(user.id);
                              if (!ban) return null;
                              if (ban.is_permanent) {
                                return (
                                  <div>
                                    <p>Навсегда</p>
                                    {ban.ban_reason && <p className="text-xs text-muted-foreground mt-1">Причина: {ban.ban_reason}</p>}
                                  </div>
                                );
                              }
                              const banEnd = ban.ban_end ? new Date(ban.ban_end).toLocaleString('ru-RU') : 'Неизвестно';
                              return (
                                <div>
                                  <p>До: {banEnd}</p>
                                  {ban.ban_reason && <p className="text-xs text-muted-foreground mt-1">Причина: {ban.ban_reason}</p>}
                                </div>
                              );
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role === 'admin' ? 'Админ' :
                         user.role === 'author' ? 'Автор' : 'Пользователь'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.email_verified ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Верифицирован
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                        Не верифицирован
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdminUser && (
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                        {isAdminUser && (
                          <DropdownMenuItem onClick={() => {
                            setUserForAction(user);
                            setShowResetPassword(true);
                          }}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Сбросить пароль
                          </DropdownMenuItem>
                        )}
                        {isAdminUser && banInfoMap.has(user.id) && (
                          <DropdownMenuItem
                            onClick={() => handleUnban(user.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Разбанить
                          </DropdownMenuItem>
                        )}
                        {isAdminUser && !banInfoMap.has(user.id) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserForAction(user);
                              setShowBanDialog(true);
                            }}
                            className="text-yellow-600"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Забанить
                          </DropdownMenuItem>
                        )}
                        {isAdminUser && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserForAction(user);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить навсегда
                          </DropdownMenuItem>
                        )}
                        {!isAdminUser && (
                          <DropdownMenuItem disabled>
                            <Shield className="h-4 w-4 mr-2" />
                            Только для админов
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>Ник в Арене (логин)</Label>
                <Input
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Отображаемое имя</Label>
                <Input
                  value={editingUser.arena_nickname || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, arena_nickname: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Роль</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="author">Автор</SelectItem>
                    <SelectItem value="admin">Админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={isActionLoading}>
              {isActionLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
          </DialogHeader>
          {userForAction && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Сброс пароля для пользователя <strong>{userForAction.username}</strong>
              </p>
              <div>
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowResetPassword(false);
              setNewPassword('');
            }}>
              Отмена
            </Button>
            <Button type="button" onClick={handleResetPassword} disabled={isActionLoading || !newPassword}>
              {isActionLoading ? 'Сброс...' : 'Сбросить пароль'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя НАВСЕГДА?</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">
              Это действие НЕОБРАТИМО! Пользователь{' '}
              <strong>{userForAction?.username}</strong> будет полностью удалён из базы данных.
              <br /><br />
              Все данные будут удалены безвозвратно (комментарии, профиль, настройки).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isActionLoading} className="bg-red-600 hover:bg-red-700">
              {isActionLoading ? 'Удаление...' : 'Удалить навсегда'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Забанить пользователя</DialogTitle>
            <DialogDescription>
              Выберите срок блокировки для пользователя <strong>{userForAction?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          {userForAction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Срок бана</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 час</SelectItem>
                    <SelectItem value="1d">1 день</SelectItem>
                    <SelectItem value="3d">3 дня</SelectItem>
                    <SelectItem value="7d">7 дней</SelectItem>
                    <SelectItem value="30d">30 дней</SelectItem>
                    <SelectItem value="permanent">Навсегда</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Причина (опционально)</Label>
                <Input
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Например: нарушение правил"
                  disabled={isActionLoading}
                />
              </div>
              {banDuration !== 'permanent' && (
                <p className="text-xs text-muted-foreground">
                  После истечения срока бан автоматически снимется
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowBanDialog(false);
              setBanDuration('1h');
              setBanReason('');
            }} disabled={isActionLoading}>
              Отмена
            </Button>
            <Button type="button" onClick={handleBan} disabled={isActionLoading} variant={banDuration === 'permanent' ? 'destructive' : 'default'}>
              {isActionLoading ? 'Бан...' : (banDuration === 'permanent' ? 'Забанить навсегда' : 'Забанить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdmin;


