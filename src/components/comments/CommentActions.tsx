import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Eye, EyeOff, Edit, Reply, History } from 'lucide-react';
import type { Comment } from '@/types/comments';

interface CommentActionsProps {
  comment: Comment;
  currentUser?: { id: number; role: string };
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onReport?: () => void;
  onViewHistory?: () => void;
  onHide?: () => void;
  disabled?: boolean;
}

export const CommentActions = ({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onRestore,
  onViewHistory,
  onHide,
  disabled = false,
}: CommentActionsProps) => {
  const isOwner = currentUser?.id === comment.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const isAuthor = currentUser?.role === 'author';
  const canModerate = isAdmin || isAuthor;

  const isDeleted = Boolean(comment.is_deleted);
  const isHidden = Boolean(comment.is_hidden);

  const canEditOutside = !isDeleted && !isHidden && isOwner && !!onEdit;
  const canReplyOutside = !isDeleted && !isHidden && !!onReply;

  const canShowHistory = canModerate && !!onViewHistory;
  const canShowDelete = canModerate && !isDeleted && !!onDelete;
  const canShowRestore = canModerate && isHidden && !!onRestore;
  const canShowHide = canModerate && !isHidden && !isDeleted && !!onHide;
  const hasMenuActions = canShowHistory || canShowDelete || canShowRestore || canShowHide;

  if (!canEditOutside && !canReplyOutside && !hasMenuActions) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {canEditOutside && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onEdit}
          disabled={disabled}
        >
          <Edit className="mr-1 h-4 w-4" />
          Редактировать
        </Button>
      )}

      {canReplyOutside && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onReply}
          disabled={disabled}
        >
          <Reply className="mr-1 h-4 w-4" />
          Ответить
        </Button>
      )}

      {hasMenuActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              disabled={disabled}
              aria-label="Дополнительно"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
            }}
          >
            {canShowHistory && (
              <DropdownMenuItem onSelect={onViewHistory} disabled={disabled}>
                <History className="mr-2 h-4 w-4" />
                История изменений
              </DropdownMenuItem>
            )}

            {canShowDelete && (
              <>
                {canShowHistory && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onSelect={onDelete}
                  disabled={disabled}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </>
            )}

            {canShowRestore && (
              <DropdownMenuItem onSelect={onRestore} disabled={disabled}>
                <Eye className="mr-2 h-4 w-4" />
                Восстановить
              </DropdownMenuItem>
            )}

            {canShowHide && (
              <DropdownMenuItem
                onSelect={onHide}
                disabled={disabled}
                className="text-amber-600 focus:text-amber-600"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Скрыть
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
