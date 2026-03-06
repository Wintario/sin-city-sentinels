import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Flag, Trash2, Eye, EyeOff, Edit, Reply, History } from 'lucide-react';
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
  onReport,
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

  // Показываем меню только если есть доступные действия
  const hasActions = (
    (!isDeleted && !isHidden && (onReply || onEdit)) ||
    (canModerate && (onHide || onRestore || onViewHistory)) ||
    (!isOwner && !isDeleted && !isHidden && onReport) ||
    ((isOwner || canModerate) && !isDeleted && onDelete)
  );

  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          disabled={disabled}
          aria-label="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {!isDeleted && !isHidden && onEdit && isOwner && (
          <DropdownMenuItem 
            onSelect={() => {
              onEdit();
            }} 
            disabled={disabled}
          >
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </DropdownMenuItem>
        )}
        {onReply && !isDeleted && !isHidden && (
          <DropdownMenuItem 
            onSelect={() => {
              onReply();
            }}
            disabled={disabled}
          >
            <Reply className="h-4 w-4 mr-2" />
            Ответить
          </DropdownMenuItem>
        )}
        {canModerate && onViewHistory && (
          <DropdownMenuItem 
            onSelect={() => {
              onViewHistory();
            }} 
            disabled={disabled}
          >
            <History className="h-4 w-4 mr-2" />
            История изменений
          </DropdownMenuItem>
        )}
        {!isDeleted && !isHidden && onDelete && (isOwner || canModerate) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onDelete();
              }}
              disabled={disabled}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </>
        )}
        {canModerate && isHidden && onRestore && (
          <DropdownMenuItem
            onSelect={() => {
              onRestore();
            }}
            disabled={disabled}
          >
            <Eye className="h-4 w-4 mr-2" />
            Восстановить
          </DropdownMenuItem>
        )}
        {canModerate && !isHidden && !isDeleted && onHide && (
          <DropdownMenuItem
            onSelect={() => {
              onHide();
            }}
            disabled={disabled}
            className="text-amber-600 focus:text-amber-600"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Скрыть
          </DropdownMenuItem>
        )}
        {!isOwner && !isDeleted && !isHidden && onReport && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={() => {
                onReport();
              }} 
              disabled={disabled}
            >
              <Flag className="h-4 w-4 mr-2" />
              Пожаловаться
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
