import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
  commentAuthor?: string;
  isSubmitting?: boolean;
}

export const ReportDialog = ({
  open,
  onOpenChange,
  onSubmit,
  commentAuthor,
  isSubmitting = false,
}: ReportDialogProps) => {
  const [reason, setReason] = useState('');
  const minLength = 10;

  const handleSubmit = async () => {
    if (reason.length < minLength) {
      toast.error(`Причина должна быть не менее ${minLength} символов`);
      return;
    }

    await onSubmit(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Пожаловаться на комментарий</AlertDialogTitle>
          <AlertDialogDescription>
            {commentAuthor && (
              <p className="mt-2 text-sm">
                Жалоба на комментарий пользователя <strong>{commentAuthor}</strong>.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Укажите причину жалобы. Модераторы рассмотрят её в ближайшее время.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="report-reason">Причина жалобы</Label>
          <Input
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: спам, оскорбления, нарушение правил..."
            disabled={isSubmitting}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Минимум {minLength} символов (введено: {reason.length})
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting || reason.length < minLength}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              'Отправить жалобу'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
