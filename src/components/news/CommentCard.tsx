import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Comment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import CommentEditor from './CommentEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Flag, Trash2, Eye, EyeOff, Edit, Reply } from 'lucide-react';
import { toast } from 'sonner';

const INFO_ICON_URL = '/info.gif';
interface CommentCardProps {
  comment: Comment;
  currentUser?: { id: number; role: string };
  onReply?: (comment: Comment) => void;
  onEdit?: (comment: Comment, newContent: string) => Promise<void>;
  onDelete?: (comment: Comment) => Promise<void>;
  onHide?: (comment: Comment, reason?: string) => Promise<void>;
  onRestore?: (comment: Comment) => Promise<void>;
  onReport?: (comment: Comment, reason: string) => Promise<void>;
  onStartEditing?: (comment: Comment) => void;
  onCancelEditing?: () => void;
}

const CommentCard = ({
  comment: rawComment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onHide,
  onRestore,
  onReport,
  onStartEditing,
  onCancelEditing,
}: CommentCardProps) => {
  // Явная деструктуризация только нужных полей для исключения лишних данных
  const {
    id,
    news_id,
    user_id,
    parent_id,
    content,
    is_deleted,
    is_hidden,
    hidden_by,
    hidden_at,
    hidden_reason,
    edited_at,
    created_at,
    author_username,
    author_display_name,
    author_arena_nickname,
    author_character_url,
    author_character_level,
    author_race_code: _authorRaceCode,
    author_race_class: _authorRaceClass,
    author_race_title: _authorRaceTitle,
    author_clan_name: _authorClanName,
    author_clan_url: _authorClanUrl,
    author_clan_icon,
  } = rawComment;

  // Преобразуем числа в булевы значения для корректного рендеринга
  const isDeleted = Boolean(is_deleted);
  const isHidden = Boolean(is_hidden);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isOwner = currentUser?.id === user_id;
  const isAdmin = currentUser?.role === 'admin';
  const isAuthor = currentUser?.role === 'author';
  const canModerate = isAdmin || isAuthor;
  const canEdit = isOwner && !isDeleted && !isHidden;
  const canDelete = isOwner || canModerate;

  // Форматируем дату в точное время: "ДД.ММ.ГГГГ ЧЧ:ММ"
  const formattedDate = format(new Date(created_at), 'dd.MM.yyyy HH:mm');
  const authorName = author_display_name || author_arena_nickname || author_username;

  // Создаём объект комментария только с нужными полями для передачи в callback'и
  const comment: Comment = {
    id,
    news_id,
    user_id,
    parent_id,
    content,
    is_deleted,
    is_hidden,
    hidden_by,
    hidden_at,
    hidden_reason,
    edited_at,
    created_at,
    author_username,
    author_display_name,
    author_arena_nickname,
    author_character_url,
    author_character_level,
    author_race_code: _authorRaceCode,
    author_race_class: _authorRaceClass,
    author_race_title: _authorRaceTitle,
    author_clan_name: _authorClanName,
    author_clan_url: _authorClanUrl,
    author_clan_icon,
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    try {
      await onDelete?.(comment);
      toast.success('Комментарий удалён');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleHide = async () => {
    setIsActionLoading(true);
    try {
      await onHide?.(comment, hideReason || undefined);
      toast.success('Комментарий скрыт');
      setShowHideDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка скрытия');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsActionLoading(true);
    try {
      await onRestore?.(comment);
      toast.success('Комментарий восстановлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка восстановления');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (reportReason.length < 10) {
      toast.error('Причина должна быть не менее 10 символов');
      return;
    }

    setIsActionLoading(true);
    try {
      await onReport?.(comment, reportReason);
      toast.success('Жалоба отправлена');
      setShowReportDialog(false);
      setReportReason('');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки жалобы');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Комментарий не может быть пустым');
      return;
    }

    setIsActionLoading(true);
    try {
      await onEdit?.(comment, editContent);
      // Не вызываем onCancelEditing здесь - это сделает родитель после успешного обновления
    } catch (error: any) {
      // Ошибка уже обработана в handleEditComment
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartEditing = () => {
    setEditContent(content);
    setIsEditing(true);
    onStartEditing?.(comment);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditContent(content);
    onCancelEditing?.();
  };

  // Скрытые комментарии показываются только модераторам
  if (isHidden && !canModerate) {
    return null;
  }

  // Удалённые комментарии показываются только модераторам
  if (isDeleted && !canModerate) {
    return null;
  }

  return (
    <div
      id={`comment-${id}`}
      className={`p-4 rounded-lg border ${
        isHidden
          ? 'bg-muted/50 border-yellow-500/30'
          : isDeleted
          ? 'bg-muted/30 border-gray-300'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 flex-wrap text-sm">
              {author_clan_icon && (
                <img
                  src={author_clan_icon}
                  alt="Логотип клана"
                  className="w-4 h-4 inline-block"
                />
              )}
              {author_character_url ? (
                <a
                  href={author_character_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline text-primary"
                  style={{ fontFamily: 'Arial, Verdana' }}
                >
                  {authorName}
                </a>
              ) : (
                <span className="font-semibold text-primary" style={{ fontFamily: 'Arial, Verdana' }}>
                  {authorName}
                </span>
              )}
              {author_character_level && <strong>{author_character_level}</strong>}
              {author_character_url && (
                <a href={author_character_url} target="_blank" rel="noopener noreferrer">
                  <img src={INFO_ICON_URL} alt="info" className="w-4 h-4 inline-block" />
                </a>
              )}
            </span>
            {edited_at && (
              <span className="text-xs text-muted-foreground">(ред.)</span>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">{formattedDate}</span>
            {isHidden && (
              <span className="text-xs bg-yellow-500/20 text-yellow-700 px-2 py-0.5 rounded">
                Скрыт
              </span>
            )}
            {isDeleted && (
              <span className="text-xs bg-red-500/20 text-red-700 px-2 py-0.5 rounded">
                Удалён
              </span>
            )}
          </div>

          {/* Divider between header and content */}
          <div className="h-px bg-border/50 my-2"></div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <CommentEditor
                onSubmit={async (newContent) => {
                  // Обновляем editContent перед отправкой
                  setEditContent(newContent);
                  await handleSaveEdit();
                }}
                onCancel={handleCancelEditing}
                initialValue={editContent}
                isEditing={true}
              />
            </div>
          ) : (
            <div
              className="text-sm prose prose-sm dark:prose-invert max-w-none comment-content whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isEditing && canEdit && (
              <DropdownMenuItem onClick={handleStartEditing}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
            )}
            {onReply && !isDeleted && !isHidden && (
              <DropdownMenuItem onClick={() => onReply(comment)}>
                <Reply className="h-4 w-4 mr-2" />
                Ответить
              </DropdownMenuItem>
            )}
            {!isEditing && canDelete && !isDeleted && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
                disabled={isActionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            )}
            {canModerate && isDeleted && (
              <DropdownMenuItem
                onClick={handleRestore}
                disabled={isActionLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Восстановить
              </DropdownMenuItem>
            )}
            {canModerate && !isHidden && !isDeleted && (
              <DropdownMenuItem
                onClick={() => setShowHideDialog(true)}
                disabled={isActionLoading}
                className="text-yellow-600"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Скрыть
              </DropdownMenuItem>
            )}
            {!isOwner && !isDeleted && !isHidden && (
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                disabled={isActionLoading}
              >
                <Flag className="h-4 w-4 mr-2" />
                Пожаловаться
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Пожаловаться на комментарий</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите причину жалобы. Модераторы рассмотрят её в ближайшее время.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="report-reason">Причина</Label>
            <Input
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Например: спам, оскорбления..."
              disabled={isActionLoading}
            />
            <p className="text-xs text-muted-foreground">
              Минимум 10 символов (введено: {reportReason.length})
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport} disabled={isActionLoading}>
              {isActionLoading ? 'Отправка...' : 'Отправить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hide Dialog */}
      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Скрыть комментарий</AlertDialogTitle>
            <AlertDialogDescription>
              Комментарий будет скрыт из публичного доступа. Укажите причину скрытия.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="hide-reason">Причина (опционально)</Label>
            <Input
              id="hide-reason"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder="Например: нарушение правил"
              disabled={isActionLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleHide} disabled={isActionLoading}>
              {isActionLoading ? 'Скрытие...' : 'Скрыть'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommentCard;
