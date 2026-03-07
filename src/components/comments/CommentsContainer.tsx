import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useCommentStore } from '@/stores/useCommentStore';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useHideComment,
  useRestoreComment,
  useReportComment,
  useCommentHistory,
} from '@/hooks/useComments';
import { CommentThread } from './CommentThread';
import CommentEditor from './CommentEditor';
import { ReportDialog } from './ReportDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { EditHistoryDialog } from './EditHistoryDialog';
import type { Comment } from '@/types/comments';

interface CommentsContainerProps {
  newsId: number;
}

const extractReplyText = (html: string): string => {
  const withoutQuotedBlocks = html.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ');
  const withLineBreaks = withoutQuotedBlocks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n');

  const plain = withLineBreaks.replace(/<[^>]*>/g, ' ');

  return plain
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const CommentsContainer = ({ newsId }: CommentsContainerProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [showEditor, setShowEditor] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [pendingScrollCommentId, setPendingScrollCommentId] = useState<number | null>(null);

  const {
    editingComment,
    replyingTo,
    editorInitialValue,
    setEditingComment,
    setReplyingTo,
    setEditorInitialValue,
    resetAll,
    reportDialog,
    closeReportDialog,
    deleteDialog,
    closeDeleteDialog,
    editHistoryDialog,
    closeEditHistoryDialog,
    openEditHistoryDialog,
  } = useCommentStore();

  const { data, isLoading, error } = useComments(newsId, page, limit);
  const createMutation = useCreateComment(newsId);
  const updateMutation = useUpdateComment(newsId);
  const deleteMutation = useDeleteComment(newsId);
  const hideMutation = useHideComment(newsId);
  const restoreMutation = useRestoreComment(newsId);
  const reportMutation = useReportComment();
  const historyQuery = useCommentHistory(editHistoryDialog.comment?.id ?? 0, editHistoryDialog.isOpen);

  useEffect(() => {
    setPage(1);
    setShowEditor(false);
    resetAll();
  }, [newsId, resetAll]);

  useEffect(() => {
    if (!pendingScrollCommentId) return;

    const element = document.getElementById(`comment-${pendingScrollCommentId}`);
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setPendingScrollCommentId(null);
  }, [pendingScrollCommentId, data?.comments]);

  const commentsTree = useMemo(() => {
    if (!data?.comments) return [];

    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    data.comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    data.comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (!commentWithReplies) return;

      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }, [data?.comments]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleOpenEditor = () => {
    resetAll();
    setShowEditor(true);

    setTimeout(() => {
      editorContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    resetAll();
  };

  const handleCreateComment = async (content: string) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти для комментирования');
      navigate('/auth');
      return;
    }

    const result = await createMutation.mutateAsync({
      newsId,
      content,
      parentId: null,
    });
    const targetPage = Math.ceil((total + 1) / limit);
    if (targetPage !== page) {
      setPage(targetPage);
    }
    setPendingScrollCommentId(result.comment.id);

    toast.success('Комментарий опубликован');
    handleCloseEditor();
  };

  const handleSubmitReply = async (comment: Comment, content: string) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти для комментирования');
      navigate('/auth');
      return;
    }

    const result = await createMutation.mutateAsync({
      newsId,
      content,
      parentId: comment.id,
    });

    setPendingScrollCommentId(result.comment.id);
    toast.success('Ответ опубликован');
    setReplyingTo(null);
    setEditorInitialValue('');
  };

  const handleEditComment = async (comment: Comment, content: string) => {
    await updateMutation.mutateAsync({
      id: comment.id,
      data: { content },
    });

    setPendingScrollCommentId(comment.id);
    setEditingComment(null);
    toast.success('Комментарий обновлён');
  };

  const handleDeleteComment = async () => {
    if (!deleteDialog.comment) return;
    await deleteMutation.mutateAsync(deleteDialog.comment.id);
    closeDeleteDialog();
  };

  const handleHideComment = async (comment: Comment, reason?: string) => {
    await hideMutation.mutateAsync({
      id: comment.id,
      data: { reason },
    });
  };

  const handleRestoreComment = async (comment: Comment) => {
    await restoreMutation.mutateAsync(comment.id);
  };

  const handleReportComment = async (reason: string) => {
    if (!reportDialog.comment) return;

    await reportMutation.mutateAsync({
      id: reportDialog.comment.id,
      data: { reason },
    });
    closeReportDialog();
  };

  const handleReply = (comment: Comment) => {
    setShowEditor(false);
    setEditingComment(null);

    const source = String(comment.content ?? '');
    const cleanReplyText = extractReplyText(source) || source.replace(/<[^>]*>/g, ' ').trim();
    const plainText = cleanReplyText.substring(0, 200);
    const quote = `<blockquote><strong>${comment.author_username} пишет:</strong><br />${plainText}</blockquote>\n\n`;

    setReplyingTo(comment);
    setEditorInitialValue(quote);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setEditorInitialValue('');
  };

  const handleStartEditing = (comment: Comment) => {
    setShowEditor(false);
    setReplyingTo(null);
    setEditorInitialValue('');

    setEditingComment(comment);
  };

  const handleCancelEditing = () => {
    setEditingComment(null);
  };

  const handleViewHistory = (comment: Comment) => {
    openEditHistoryDialog(comment);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Не удалось загрузить комментарии</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Комментарии ({total})
        </h2>

        {isAuthenticated && !showEditor && (
          <Button onClick={handleOpenEditor}>Написать комментарий</Button>
        )}
      </div>

      {showEditor && (
        <div ref={editorContainerRef} className="border rounded-lg p-4 bg-card">
          <CommentEditor onSubmit={handleCreateComment} onCancel={handleCloseEditor} initialValue="" />
        </div>
      )}

      {!isAuthenticated && !showEditor && (
        <div className="border rounded-lg p-6 bg-card text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">Авторизуйтесь, чтобы оставлять комментарии</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate('/auth')}>Войти</Button>
            <Button variant="outline" onClick={() => navigate('/auth?tab=register')}>
              Регистрация
            </Button>
          </div>
        </div>
      )}

      {commentsTree.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Комментариев пока нет</p>
          {isAuthenticated && <p className="text-sm mt-2">Будьте первым, кто прокомментирует!</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {commentsTree.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUser={user || undefined}
              editingCommentId={editingComment?.id ?? null}
              replyingToId={replyingTo?.id ?? null}
              replyInitialValue={editorInitialValue}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={(target) => useCommentStore.getState().openDeleteDialog(target)}
              onRestore={handleRestoreComment}
              onReport={(target) => useCommentStore.getState().openReportDialog(target)}
              onHide={handleHideComment}
              onCancelEdit={handleCancelEditing}
              onViewHistory={handleViewHistory}
              onStartEditing={handleStartEditing}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                  isActive={p === page}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {isAuthenticated && !showEditor && (
        <div className="pt-2">
          <Button onClick={handleOpenEditor}>Написать комментарий</Button>
        </div>
      )}

      <ReportDialog
        open={reportDialog.isOpen}
        onOpenChange={closeReportDialog}
        onSubmit={handleReportComment}
        commentAuthor={reportDialog.comment?.author_username}
        isSubmitting={reportMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteComment}
        commentAuthor={deleteDialog.comment?.author_username}
        isDeleting={deleteMutation.isPending}
      />

      <EditHistoryDialog
        open={editHistoryDialog.isOpen}
        onOpenChange={closeEditHistoryDialog}
        history={historyQuery.data?.history}
        isLoading={historyQuery.isLoading}
        commentAuthor={editHistoryDialog.comment?.author_username}
      />
    </div>
  );
};

export default CommentsContainer;


