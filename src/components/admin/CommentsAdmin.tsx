import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { commentsAPI } from '@/lib/api/comments';
import {
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  History,
  Flag,
  Filter,
  Download,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Comment } from '@/types/comments';

// Заглушка для API - в реальности нужно создать backend endpoints
const CommentsAdmin = () => {
  const [comments, setComments] = useState<(Comment & { reports_count: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hidden' | 'deleted'>('all');
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [viewingComment, setViewingComment] = useState<Comment | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Автозагрузка при монтировании
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await commentsAPI.admin.getAll({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? 'all' : statusFilter,
        page: 1,
        limit: 50,
      });
      setComments(response.comments);
      if (response.total > 0) {
        toast.success(`Найдено ${response.total} комментариев`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при поиске');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectComment = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedComments([...selectedComments, id]);
    } else {
      setSelectedComments(selectedComments.filter((cid) => cid !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComments(comments.map((c) => c.id));
    } else {
      setSelectedComments([]);
    }
  };

  const handleBulkAction = async (action: 'hide' | 'restore' | 'delete') => {
    if (selectedComments.length === 0) {
      toast.error('Выберите комментарии для действия');
      return;
    }

    setIsLoading(true);
    try {
      await commentsAPI.admin.bulkAction({
        ids: selectedComments,
        action,
        reason: action === 'hide' ? 'Скрыто администратором' : undefined,
      });
      toast.success(`Выполнено действие "${action}" над ${selectedComments.length} комментариями`);
      setSelectedComments([]);
      handleSearch(); // Перезагрузить данные
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при выполнении действия');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHideComment = async (comment: Comment) => {
    setIsLoading(true);
    try {
      await commentsAPI.hide(comment.id, { reason: 'Скрыто администратором' });
      toast.success('Комментарий скрыт');
      handleSearch();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при скрытии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreComment = async (comment: Comment) => {
    setIsLoading(true);
    try {
      await commentsAPI.restore(comment.id);
      toast.success('Комментарий восстановлен');
      handleSearch();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при восстановлении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    setIsLoading(true);
    try {
      await commentsAPI.delete(comment.id);
      toast.success('Комментарий удалён');
      handleSearch();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = async (comment: Comment) => {
    setViewingComment(comment);
    setShowHistoryDialog(true);
    // TODO: Загрузить историю редактирования
  };

  const handleExport = async () => {
    // TODO: Экспорт статистики комментариев
    toast.info('Экспорт статистики (требуется backend API)');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Комментарии
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление всеми комментариями на сайте
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Экспорт статистики
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] space-y-2">
          <Label>Поиск</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по тексту комментария..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-[200px] space-y-2">
          <Label>Статус</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="hidden">Скрытые</SelectItem>
              <SelectItem value="deleted">Удалённые</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Поиск...
            </>
          ) : (
            <>
              <Filter className="h-4 w-4 mr-2" />
              Найти
            </>
          )}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            Выбрано: {selectedComments.length}
          </span>
          <div className="flex gap-2">
            <Button type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('hide')}
              disabled={isLoading}
            >
              <EyeOff className="h-3 w-3 mr-2" />
              Скрыть
            </Button>
            <Button type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('restore')}
              disabled={isLoading}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Восстановить
            </Button>
            <Button type="button"
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Удалить
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedComments.length === comments.length && comments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Текст</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Новость</TableHead>
              <TableHead className="w-[120px]">Дата</TableHead>
              <TableHead className="w-[100px]">Статус</TableHead>
              <TableHead className="w-[100px]">Жалобы</TableHead>
              <TableHead className="w-[150px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Комментарии не найдены</p>
                  <p className="text-sm mt-2">
                    Используйте поиск или фильтры для нахождения комментариев
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedComments.includes(comment.id)}
                      onCheckedChange={(checked) =>
                        handleSelectComment(comment.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{comment.id}</TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {comment.content?.substring(0, 100) || '...'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{comment.author_username}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">#{comment.news_id}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(comment.created_at), 'dd.MM.yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    {comment.is_hidden && (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Скрыт
                      </Badge>
                    )}
                    {comment.is_deleted && (
                      <Badge variant="destructive" className="gap-1">
                        <Trash2 className="h-3 w-3" />
                        Удалён
                      </Badge>
                    )}
                    {!comment.is_hidden && !comment.is_deleted && (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Видим
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* TODO: Загрузить количество жалоб */}
                    <Badge variant="outline" className="gap-1">
                      <Flag className="h-3 w-3" />
                      0
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingComment(comment)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(comment)}>
                          <History className="h-4 w-4 mr-2" />
                          История
                        </DropdownMenuItem>
                        {!comment.is_hidden ? (
                          <DropdownMenuItem
                            onClick={() => handleHideComment(comment)}
                            className="text-amber-600"
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Скрыть
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRestoreComment(comment)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Восстановить
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Comment Dialog */}
      <Dialog open={!!viewingComment} onOpenChange={() => setViewingComment(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Просмотр комментария</DialogTitle>
            <DialogDescription>
              #{viewingComment?.id} от {viewingComment?.author_username}
            </DialogDescription>
          </DialogHeader>
          {viewingComment && (
            <div className="space-y-4">
              <div
                className="p-4 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: viewingComment.content }}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Автор:</span>
                  <div className="font-medium">{viewingComment.author_username}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Дата:</span>
                  <div className="font-medium">
                    {format(new Date(viewingComment.created_at), 'dd.MM.yyyy HH:mm', {
                      locale: ru,
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Новость:</span>
                  <div className="font-medium">#{viewingComment.news_id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Статус:</span>
                  <div className="mt-1">
                    {viewingComment.is_hidden && (
                      <Badge variant="secondary">Скрыт</Badge>
                    )}
                    {viewingComment.is_deleted && (
                      <Badge variant="destructive">Удалён</Badge>
                    )}
                    {!viewingComment.is_hidden && !viewingComment.is_deleted && (
                      <Badge variant="outline">Виден</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewingComment(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              История редактирования
            </DialogTitle>
            <DialogDescription>
              Комментарий #{viewingComment?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>История загружается... (требуется backend API)</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentsAdmin;


