import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Comment, commentsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';
import CommentCard from './CommentCard';
import CommentEditor from './CommentEditor';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface CommentsSectionProps {
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

const CommentsSection = ({ newsId }: CommentsSectionProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorInitialValue, setEditorInitialValue] = useState('');

  useEffect(() => {
    loadComments();
  }, [newsId, page]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await commentsAPI.getByNewsId(newsId, page, limit);
      setComments(response.comments);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error: any) {
      console.error('Failed to load comments:', error);
      toast.error('Не удалось загрузить комментарии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (content: string, parentId?: number) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти для комментирования');
      navigate('/auth');
      return;
    }

    // Если редактируем комментарий
    if (editingComment) {
      await handleEditComment(editingComment, content);
      setEditingComment(null);
    } else {
      // Если создаём новый комментарий или ответ
      await commentsAPI.create(newsId, content, parentId);
      toast.success(parentId ? 'Ответ опубликован' : 'Комментарий опубликован');
    }
    
    loadComments();
    // Сбрасываем только то, что активно
    if (editingComment) {
      setEditingComment(null);
    } else {
      setReplyingTo(null);
    }
    setEditorInitialValue('');
    setShowEditor(false);
  };

  const handleEditComment = async (comment: Comment, newContent: string) => {
    try {
      await commentsAPI.update(comment.id, newContent);
      toast.success('Комментарий обновлён');
      loadComments();
      // Сбрасываем состояние редактирования
      setEditingComment(null);
      setEditorInitialValue('');
      setShowEditor(false);
    } catch (error: any) {
      console.error('Edit error:', error);
      // Не показываем toast здесь - он уже показан в api
      throw error;
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    await commentsAPI.delete(comment.id);
    loadComments();
  };

  const handleHideComment = async (comment: Comment, reason?: string) => {
    await commentsAPI.hide(comment.id, reason);
    loadComments();
  };

  const handleRestoreComment = async (comment: Comment) => {
    await commentsAPI.restore(comment.id);
    loadComments();
  };

  const handleReportComment = async (comment: Comment, reason: string) => {
    await commentsAPI.report(comment.id, reason);
  };

  const handleReply = (comment: Comment) => {
    // Сбрасываем всё и устанавливаем новое значение
    setEditingComment(null);
    setEditorInitialValue('');
    
    // Добавляем цитату с именем автора в формате HTML
    const source = String(comment.content ?? '');
    const cleanReplyText = extractReplyText(source) || source.replace(/<[^>]*>/g, ' ').trim();
    const plainText = cleanReplyText.substring(0, 200);
    const quote = `<blockquote><strong>${comment.author_username} пишет:</strong><p>${plainText}</p></blockquote>\n\n`;
    
    // Устанавливаем replyingTo и открываем редактор
    setReplyingTo(comment);
    setEditorInitialValue(quote);
    setShowEditor(true);
  };

  const handleStartEditing = (comment: Comment) => {
    setEditingComment(comment);
    setEditorInitialValue(comment.content);
    setShowEditor(true);
  };

  const handleCancelEditing = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setEditorInitialValue('');
    setShowEditor(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Комментарии ({total})
        </h2>

        {isAuthenticated && !showEditor && (
          <Button onClick={() => setShowEditor(true)}>
            Написать комментарий
          </Button>
        )}
      </div>

      {/* Editor */}
      {showEditor && (
        <div className="border rounded-lg p-4 bg-card">
          <CommentEditor
            onSubmit={handleCreateComment}
            onCancel={handleCancelEditing}
            replyingTo={
              replyingTo && !editingComment
                ? { id: replyingTo.id, author: replyingTo.author_username }
                : undefined
            }
            initialValue={editorInitialValue}
            isEditing={!!editingComment}
          />
        </div>
      )}

      {/* Auth prompt for non-authenticated users */}
      {!isAuthenticated && (
        <div className="border rounded-lg p-6 bg-card text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Авторизуйтесь, чтобы оставлять комментарии
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate('/auth')}>
              Войти
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth?tab=register')}>
              Регистрация
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Комментариев пока нет</p>
          {isAuthenticated && (
            <p className="text-sm mt-2">
              Будьте первым, кто прокомментирует!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((rawComment) => {
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
              author_race_code,
              author_race_class,
              author_race_title,
              author_race_style,
              author_clan_name,
              author_clan_url,
              author_clan_icon,
            } = rawComment;

            // Преобразуем числа в булевы значения для корректного рендеринга
            const isDeleted = Boolean(is_deleted);
            const isHidden = Boolean(is_hidden);

            const comment = {
              id,
              news_id,
              user_id,
              parent_id,
              content,
              is_deleted: isDeleted,
              is_hidden: isHidden,
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
              author_race_code,
              author_race_class,
              author_race_title,
              author_race_style,
              author_clan_name,
              author_clan_url,
              author_clan_icon,
            };

            return (
              <CommentCard
                key={id}
                comment={comment}
                currentUser={user || undefined}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onHide={handleHideComment}
                onRestore={handleRestoreComment}
                onReport={handleReportComment}
                onStartEditing={handleStartEditing}
                onCancelEditing={handleCancelEditing}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
};

export default CommentsSection;
