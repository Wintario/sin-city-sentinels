import { CommentItem } from './CommentItem';
import CommentEditor from './CommentEditor';
import type { Comment } from '@/types/comments';

interface CommentThreadProps {
  comment: Comment;
  currentUser?: { id: number; role: string };
  depth?: number;
  maxDepth?: number;
  editingCommentId?: number | null;
  replyingToId?: number | null;
  replyInitialValue?: string;
  onReply?: (comment: Comment) => void;
  onEdit?: (comment: Comment, content: string) => Promise<void>;
  onDelete?: (comment: Comment) => void;
  onRestore?: (comment: Comment) => void;
  onReport?: (comment: Comment) => void | Promise<void>;
  onHide?: (comment: Comment, reason?: string) => Promise<void>;
  onCancelEdit?: () => void;
  onViewHistory?: (comment: Comment) => void;
  onStartEditing?: (comment: Comment) => void;
  onSubmitReply?: (comment: Comment, content: string) => Promise<void>;
  onCancelReply?: () => void;
}

export const CommentThread = ({
  comment,
  currentUser,
  depth = 0,
  maxDepth = 5,
  editingCommentId,
  replyingToId,
  replyInitialValue,
  onReply,
  onEdit,
  onDelete,
  onRestore,
  onReport,
  onHide,
  onCancelEdit,
  onViewHistory,
  onStartEditing,
  onSubmitReply,
  onCancelReply,
}: CommentThreadProps) => {
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToId === comment.id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;
  const isDeleted = !!comment.is_deleted;
  const isHidden = !!comment.is_hidden;

  const handleReply = () => {
    if (onReply) onReply(comment);
  };

  const handleEdit = async (content: string) => {
    if (onEdit) await onEdit(comment, content);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(comment);
  };

  const handleRestore = () => {
    if (onRestore) onRestore(comment);
  };

  const handleReport = async () => {
    if (onReport) await onReport(comment);
  };

  const handleHide = async (reason?: string) => {
    if (onHide) await onHide(comment, reason);
  };

  const handleViewHistory = () => {
    if (onViewHistory) onViewHistory(comment);
  };

  const handleStartEditing = () => {
    if (onStartEditing) onStartEditing(comment);
  };

  const handleSubmitReply = async (content: string) => {
    if (onSubmitReply) await onSubmitReply(comment, content);
  };

  return (
    <div className="space-y-3">
      <CommentItem
        comment={comment}
        currentUser={currentUser}
        depth={depth}
        isEditing={isEditing}
        onReply={canReply ? handleReply : undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onReport={handleReport}
        onHide={handleHide}
        onCancelEdit={onCancelEdit}
        onViewHistory={handleViewHistory}
        onStartEditing={handleStartEditing}
      />

      {isReplying && !isEditing && !isDeleted && !isHidden && (
        <div
          className="border rounded-lg p-3 bg-card"
          style={{ marginLeft: depth > 0 ? `${depth * 16}px` : undefined }}
        >
          <CommentEditor
            onSubmit={handleSubmitReply}
            onCancel={onCancelReply}
            replyingTo={{ id: comment.id, author: comment.author_username }}
            initialValue={replyInitialValue}
          />
        </div>
      )}

      {hasReplies && (
        <div className="space-y-3">
          {comment.replies!.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              depth={depth + 1}
              maxDepth={maxDepth}
              editingCommentId={editingCommentId}
              replyingToId={replyingToId}
              replyInitialValue={replyInitialValue}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              onReport={onReport}
              onHide={onHide}
              onCancelEdit={onCancelEdit}
              onViewHistory={onViewHistory}
              onStartEditing={onStartEditing}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

