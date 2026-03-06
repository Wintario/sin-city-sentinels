import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, History } from 'lucide-react';
import type { CommentEdit } from '@/types/comments';

interface EditHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: CommentEdit[] | undefined;
  isLoading?: boolean;
  commentAuthor?: string;
}

export const EditHistoryDialog = ({
  open,
  onOpenChange,
  history,
  isLoading = false,
  commentAuthor,
}: EditHistoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История редактирования
          </DialogTitle>
          <DialogDescription>
            {commentAuthor && (
              <span>
                История изменений комментария пользователя <strong>{commentAuthor}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((edit, index) => (
                <div
                  key={edit.id}
                  className="rounded-lg border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Редактирование #{history.length - index}
                    </span>
                    <span>
                      {format(new Date(edit.edited_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Изменил: </span>
                    <span className="font-medium">{edit.editor_username}</span>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {edit.old_content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>История редактирования пуста</p>
              <p className="text-xs mt-2">
                Этот комментарий ещё не редактировался
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
