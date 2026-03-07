import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports, usePendingReportsCount, useUpdateReportStatus, useReviewReport, getStatusBadgeVariant } from '@/hooks/useReports';
import { useHideComment } from '@/hooks/useComments';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Eye, Flag, ExternalLink, MessageSquare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CommentReport } from '@/types/comments';

const ReportsAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'hide' | 'resolved' | 'rejected' | null>(null);

  // Загружаем данные через хуки
  const { data: reportsData, isLoading, refetch } = useReports(activeTab, 1, 50);
  const { data: pendingData } = usePendingReportsCount();
  
  // Мутации
  const updateStatusMutation = useUpdateReportStatus();
  const reviewReportMutation = useReviewReport();
  const hideCommentMutation = useHideComment(0); // newsId будет игнорироваться

  const reports = reportsData?.reports || [];
  const pendingCount = pendingData?.count || 0;

  const handleUpdateStatus = async (id: number, status: CommentReport['status']) => {
    await updateStatusMutation.mutateAsync({ id, status });
    refetch();
  };

  const handleHideComment = async (report: CommentReport) => {
    setConfirmAction('hide');
    setSelectedReport(report);
    setShowConfirmDialog(true);
  };

  const handleConfirmHide = async () => {
    if (!selectedReport) return;
    
    try {
      // Скрываем комментарий
      await hideCommentMutation.mutateAsync({
        id: selectedReport.comment_id,
        data: { reason: 'Скрыто по жалобе #'.concat(String(selectedReport.id)) },
      });
      
      // Закрываем жалобу
      await reviewReportMutation.mutateAsync({
        id: selectedReport.id,
        status: 'resolved',
        reason: 'Комментарий скрыт',
        hideComment: true,
      });
      
      setShowConfirmDialog(false);
      setSelectedReport(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при скрытии комментария');
    }
  };

  const handleReviewReport = async (status: 'resolved' | 'rejected') => {
    setConfirmAction(status);
    setShowConfirmDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedReport || !confirmAction) return;
    if (confirmAction === 'hide') return;
    
    try {
      await reviewReportMutation.mutateAsync({
        id: selectedReport.id,
        status: confirmAction,
        reason: confirmAction === 'resolved' ? 'Жалоба обоснована' : 'Жалоба отклонена',
      });
      
      setShowConfirmDialog(false);
      setSelectedReport(null);
      refetch();
    } catch (error: any) {
      toast.error('Ошибка при рассмотрении жалобы');
    }
  };

  const handleViewReport = (report: CommentReport) => {
    setSelectedReport(report);
    setShowViewDialog(true);
  };

  const handleGoToComment = (report: CommentReport) => {
    // Переход к новости с якорем на комментарий
    // Предполагаем, что у нас есть way to get news_id from comment
    // В реальном приложении нужно добавить news_id в CommentReport тип
    toast.info('Переход к комментарию... (требуется доработка API)');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'reviewed': return 'Проверено';
      case 'resolved': return 'Решено';
      case 'rejected': return 'Отклонено';
      default: return status;
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Жалобы
          </h1>
          <p className="text-muted-foreground mt-1">
            Модерация жалоб на комментарии
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} новых
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/comments')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Все комментарии
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Пользователи
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Ожидающие ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="reviewed">Проверенные</TabsTrigger>
          <TabsTrigger value="resolved">Решённые</TabsTrigger>
          <TabsTrigger value="rejected">Отклонённые</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead className="max-w-[250px]">Причина</TableHead>
                  <TableHead>Жалоба от</TableHead>
                  <TableHead className="w-[120px]">Дата</TableHead>
                  <TableHead className="w-[100px]">Статус</TableHead>
                  <TableHead className="w-[250px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {activeTab === 'pending'
                        ? 'Нет ожидающих жалоб 🎉'
                        : `Нет жалоб со статусом "${getStatusLabel(activeTab)}"`}
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">{report.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="truncate max-w-[250px] text-sm text-muted-foreground">
                            {report.comment_content?.substring(0, 80) || '...'}
                          </div>
                          <Button type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => handleGoToComment(report)}
                            title="Перейти к комментарию"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate text-sm" title={report.reason}>
                          {report.reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{report.reporter_username}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {getStatusLabel(report.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewReport(report)}
                            title="Просмотр"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {activeTab === 'pending' && (
                            <>
                              <Button type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleHideComment(report)}
                                disabled={
                                  hideCommentMutation.isPending ||
                                  reviewReportMutation.isPending
                                }
                              >
                                Скрыть
                              </Button>
                              <Button type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleReviewReport('rejected')}
                                disabled={reviewReportMutation.isPending}
                                title="Отклонить жалобу"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button type="button"
                                variant="default"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleReviewReport('resolved')}
                                disabled={reviewReportMutation.isPending}
                                title="Решить жалобу"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Просмотр жалобы #{selectedReport?.id}
            </DialogTitle>
            <DialogDescription>
              Детальная информация о жалобе
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Комментарий */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Комментарий:
                  </h4>
                  <div 
                    className="p-3 bg-muted rounded-lg text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedReport.comment_content || '...' }}
                  />
                </div>
                
                {/* Причина жалобы */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Причина жалобы:
                  </h4>
                  <p className="text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    {selectedReport.reason}
                  </p>
                </div>
                
                {/* Информация */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-card rounded-lg border">
                    <span className="text-muted-foreground">Жалоба от:</span>
                    <div className="font-medium mt-1">{selectedReport.reporter_username}</div>
                  </div>
                  <div className="p-3 bg-card rounded-lg border">
                    <span className="text-muted-foreground">Дата:</span>
                    <div className="font-medium mt-1">
                      {new Date(selectedReport.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div className="p-3 bg-card rounded-lg border">
                    <span className="text-muted-foreground">Статус:</span>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(selectedReport.status)}>
                        {getStatusLabel(selectedReport.status)}
                      </Badge>
                    </div>
                  </div>
                  {selectedReport.reviewed_at && (
                    <div className="p-3 bg-card rounded-lg border">
                      <span className="text-muted-foreground">Проверено:</span>
                      <div className="font-medium mt-1">
                        {new Date(selectedReport.reviewed_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            {selectedReport?.status === 'pending' && (
              <>
                <Button type="button"
                  variant="outline"
                  onClick={() => {
                    handleReviewReport('rejected');
                    setShowViewDialog(false);
                  }}
                  disabled={reviewReportMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
                <Button type="button"
                  variant="default"
                  onClick={() => {
                    handleReviewReport('resolved');
                    setShowViewDialog(false);
                  }}
                  disabled={reviewReportMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Решено
                </Button>
              </>
            )}
            <Button type="button"
              variant="secondary"
              onClick={() => setShowViewDialog(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'hide' && 'Скрыть комментарий?'}
              {confirmAction === 'resolved' && 'Решить жалобу?'}
              {confirmAction === 'rejected' && 'Отклонить жалобу?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'hide' && (
                'Комментарий будет скрыт из публичного доступа, а жалоба закрыта.'
              )}
              {confirmAction === 'resolved' && (
                'Жалоба будет помечена как решённая.'
              )}
              {confirmAction === 'rejected' && (
                'Жалоба будет отклонена.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={reviewReportMutation.isPending || hideCommentMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="button"
              variant={confirmAction === 'rejected' ? 'secondary' : 'default'}
              onClick={
                confirmAction === 'hide'
                  ? handleConfirmHide
                  : handleConfirmReview
              }
              disabled={reviewReportMutation.isPending || hideCommentMutation.isPending}
            >
              {reviewReportMutation.isPending || hideCommentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Подтвердить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsAdmin;


