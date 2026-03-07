import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { CommentReport } from '@/types/comments';
import { getStatusBadgeVariant } from '@/hooks/useReports';

interface CommentHistoryInAdminProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: number;
  reports: CommentReport[];
  commentContent?: string;
  commentAuthor?: string;
  newsId?: number;
}

/**
 * Компонент для просмотра всех жалоб на комментарий в админке
 */
export const CommentHistoryInAdmin = ({
  open,
  onOpenChange,
  commentId,
  reports,
  commentContent,
  commentAuthor,
  newsId,
}: CommentHistoryInAdminProps) => {
  const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'reviewed':
        return 'Проверено';
      case 'resolved':
        return 'Решено';
      case 'rejected':
        return 'Отклонено';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'reviewed':
        return <CheckCircle className="h-3 w-3" />;
      case 'resolved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleGoToComment = () => {
    if (newsId) {
      window.open(`/news/${newsId}#comment-${commentId}`, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              История жалоб на комментарий #{commentId}
            </DialogTitle>
            <DialogDescription>
              Все жалобы на этот комментарий
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Информация о комментарии */}
            {(commentContent || commentAuthor) && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                {commentAuthor && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Автор:</span>
                    <span className="font-medium">{commentAuthor}</span>
                  </div>
                )}
                {commentContent && (
                  <div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Текст:</span>
                    </div>
                    <div
                      className="text-sm prose prose-sm dark:prose-invert max-w-none p-3 bg-background rounded"
                      dangerouslySetInnerHTML={{ __html: commentContent }}
                    />
                  </div>
                )}
                {newsId && (
                  <Button type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGoToComment}
                    className="w-full"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Перейти к комментарию в новости
                  </Button>
                )}
              </div>
            )}

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-card rounded-lg border text-center">
                <div className="text-2xl font-bold text-destructive">
                  {reports.filter((r) => r.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Ожидают</div>
              </div>
              <div className="p-3 bg-card rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reports.filter((r) => r.status === 'resolved').length}
                </div>
                <div className="text-xs text-muted-foreground">Решено</div>
              </div>
              <div className="p-3 bg-card rounded-lg border text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reports.filter((r) => r.status === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground">Отклонено</div>
              </div>
            </div>

            {/* Список жалоб */}
            <div>
              <h3 className="font-semibold mb-3">Все жалобы</h3>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Жалоб нет</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {reports.map((report, index) => (
                      <div
                        key={report.id}
                        className="p-4 bg-card rounded-lg border space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(report.status)}
                              className="gap-1"
                            >
                              {getStatusIcon(report.status)}
                              {getStatusLabel(report.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              #{report.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', {
                              locale: ru,
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Причина жалобы:
                            </div>
                            <div className="p-2 bg-destructive/10 rounded text-sm">
                              {report.reason}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Жалоба от:
                            </span>
                            <span className="font-medium">
                              {report.reporter_username}
                            </span>
                          </div>

                          {report.reviewed_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Рассмотрено:
                              </span>
                              <span className="font-medium">
                                {format(
                                  new Date(report.reviewed_at),
                                  'dd.MM.yyyy HH:mm',
                                  { locale: ru }
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


