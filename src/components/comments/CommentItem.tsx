import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CommentActions } from './CommentActions';
import CommentEditor from './CommentEditor';
import type { Comment } from '@/types/comments';

interface CommentItemProps {
  comment: Comment;
  currentUser?: { id: number; role: string };
  depth?: number;
  isEditing?: boolean;
  onReply?: () => void;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => void;
  onRestore?: () => void;
  onReport?: () => Promise<void> | void;
  onHide?: (reason?: string) => Promise<void>;
  onCancelEdit?: () => void;
  onViewHistory?: () => void;
  onStartEditing?: () => void;
  className?: string;
}

export const CommentItem = ({
  comment,
  currentUser,
  depth = 0,
  isEditing = false,
  onReply,
  onEdit,
  onDelete,
  onRestore,
  onReport,
  onHide,
  onCancelEdit,
  onViewHistory,
  onStartEditing,
  className = '',
}: CommentItemProps) => {
  const [editContent, setEditContent] = useState(comment.content);

  // Синхронизируем локальный буфер редактирования с актуальным текстом комментария
  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  const isOwner = currentUser?.id === comment.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const isAuthor = currentUser?.role === 'author';
  const canModerate = isAdmin || isAuthor;

  const isDeleted = Boolean(comment.is_deleted);
  const isHidden = Boolean(comment.is_hidden);

  // Форматируем дату
  const formattedDate = format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: ru });

  // Определяем имя автора
  const authorName = comment.author_display_name || comment.author_arena_nickname || comment.author_username;

  // Обработчик сохранения редактирования
  const handleSaveEdit = async (content: string) => {
    if (onEdit) {
      await onEdit(content);
    }
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditContent(comment.content);
    onCancelEdit?.();
  };

  // Скрытые и удалённые комментарии показываются только модераторам
  if ((isHidden || isDeleted) && !canModerate) {
    return null;
  }

  return (
    <article
      id={`comment-${comment.id}`}
      className={`
        p-3 rounded-lg border space-y-2
        ${isHidden 
          ? 'bg-muted/30 border-amber-500/30' 
          : isDeleted 
          ? 'bg-muted/20 border-gray-300 dark:border-gray-700' 
          : 'bg-card border-border'
        }
        ${className}
      `}
      style={{ marginLeft: depth > 0 ? `${depth * 16}px` : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Автор */}
          {comment.author_character_url ? (
            <a
              href={comment.author_character_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm hover:underline text-primary"
            >
              {authorName}
            </a>
          ) : (
            <span className="font-semibold text-sm">{authorName}</span>
          )}

          {/* Бейдж автора новости */}
          {/* Можно добавить проверку на автора новости */}

          {/* Индикатор редактирования */}
          {comment.edited_at && (
            <span className="text-xs text-muted-foreground">(ред.)</span>
          )}

          {/* Дата */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </span>

          {/* Статусы */}
          {isHidden && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/30">
              Скрыт
            </Badge>
          )}
          {isDeleted && (
            <Badge variant="secondary" className="bg-destructive/20 text-destructive hover:bg-destructive/30">
              Удалён
            </Badge>
          )}
        </div>

        {/* Actions */}
        <CommentActions
          comment={comment}
          currentUser={currentUser}
          onReply={!isEditing && !isDeleted && !isHidden ? onReply : undefined}
          onEdit={!isEditing && !isDeleted && !isHidden && isOwner ? onStartEditing : undefined}
          onDelete={!isDeleted ? onDelete : undefined}
          onRestore={isHidden && canModerate ? onRestore : undefined}
          onReport={!isOwner && !isDeleted && !isHidden ? onReport : undefined}
          onViewHistory={canModerate ? onViewHistory : undefined}
          onHide={!isHidden && !isDeleted && canModerate ? onHide : undefined}
        />
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <CommentEditor
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            initialValue={editContent}
            isEditing={true}
          />
        </div>
      ) : (
        <div
          className={`
            text-sm prose prose-sm dark:prose-invert max-w-none comment-content
            whitespace-pre-wrap break-words
            ${isDeleted || isHidden ? 'opacity-60' : ''}
          `}
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      )}

      {/* Footer с информацией о скрытии/удалении */}
      {(isHidden || isDeleted) && canModerate && (
        <div className="text-xs text-muted-foreground pt-1.5 border-t">
          {isHidden && (
            <div className="flex items-center gap-2">
              <span>Скрыт:</span>
              {comment.hidden_reason && (
                <span className="italic">{comment.hidden_reason}</span>
              )}
              {comment.hidden_at && (
                <span>
                  {format(new Date(comment.hidden_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </span>
              )}
            </div>
          )}
          {isDeleted && (
            <div className="flex items-center gap-2">
              <span>Удалён автором</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
