/**
 * Типы данных для системы комментариев
 */

export interface Comment {
  id: number;
  news_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  is_deleted: boolean;
  is_hidden: boolean;
  hidden_by?: number | null;
  hidden_at?: string | null;
  hidden_reason?: string | null;
  edited_at?: string | null;
  created_at: string;
  author_username: string;
  author_display_name?: string | null;
  author_arena_nickname?: string | null;
  author_character_url?: string | null;
  // Вложенные комментарии (заполняется на фронтенде)
  replies?: Comment[];
  // Флаг оптимистичного обновления
  _isOptimistic?: boolean;
  // Глубина вложенности (заполняется на фронтенде)
  _depth?: number;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCommentData {
  newsId: number;
  content: string;
  parentId?: number | null;
}

export interface UpdateCommentData {
  content: string;
}

export interface HideCommentData {
  reason?: string;
}

export interface ReportCommentData {
  reason: string;
}

export interface CommentEdit {
  id: number;
  comment_id: number;
  user_id: number;
  old_content: string;
  edited_at: string;
  editor_username: string;
}

export interface CommentReport {
  id: number;
  comment_id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  comment_content?: string;
  reporter_username?: string;
}

export interface ReportsResponse {
  reports: CommentReport[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Статусы операции
 */
export type OperationStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Контекст для оптимистичного обновления
 */
export interface OptimisticContext {
  previousComments?: CommentsResponse;
  previousComment?: Comment;
}

/**
 * Настройки пагинации
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Параметры для загрузки комментариев
 */
export interface LoadCommentsParams extends PaginationParams {
  newsId: number;
  includeHidden?: boolean;
}

/**
 * Результат операции с комментарием
 */
export interface CommentOperationResult {
  success: boolean;
  comment?: Comment;
  error?: string;
}
