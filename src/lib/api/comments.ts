/**
 * Comments API - рефакторинг с улучшенной обработкой ошибок
 */

import type {
  Comment,
  CommentsResponse,
  CreateCommentData,
  UpdateCommentData,
  HideCommentData,
  ReportCommentData,
  CommentEdit,
  CommentReport,
  ReportsResponse,
} from '@/types/comments';
import { apiCall } from '../api';

/**
 * Получить комментарии к новости
 */
export const getComments = async (
  newsId: number,
  page = 1,
  limit = 20,
  includeHidden = false
): Promise<CommentsResponse> => {
  const response = await apiCall<CommentsResponse>(
    `/comments?newsId=${newsId}&page=${page}&limit=${limit}${includeHidden ? '&includeHidden=true' : ''}`
  );
  return response;
};

/**
 * Получить комментарии текущего пользователя (для профиля)
 */
export const getMyComments = async (
  page = 1,
  limit = 10
): Promise<CommentsResponse> => {
  const response = await apiCall<CommentsResponse>(
    `/comments/me?page=${page}&limit=${limit}`
  );
  return response;
};

/**
 * Создать комментарий
 */
export const createComment = async (
  data: CreateCommentData
): Promise<{ success: boolean; comment: Comment }> => {
  const response = await apiCall<{ success: boolean; comment: Comment }>(
    '/comments',
    {
      method: 'POST',
      body: JSON.stringify({
        newsId: data.newsId,
        content: data.content,
        parentId: data.parentId ?? null,
      }),
    }
  );
  return response;
};

/**
 * Обновить комментарий
 */
export const updateComment = async (
  id: number,
  data: UpdateCommentData
): Promise<{ success: boolean; comment: Comment }> => {
  const response = await apiCall<{ success: boolean; comment: Comment }>(
    `/comments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ content: data.content }),
    }
  );
  return response;
};

/**
 * Удалить комментарий (мягкое удаление)
 */
export const deleteComment = async (
  id: number
): Promise<{ success: boolean; comment: Comment }> => {
  const response = await apiCall<{ success: boolean; comment: Comment }>(
    `/comments/${id}`,
    {
      method: 'DELETE',
    }
  );
  return response;
};

/**
 * Скрыть комментарий (модерация)
 */
export const hideComment = async (
  id: number,
  data?: HideCommentData
): Promise<{ success: boolean; comment: Comment }> => {
  const response = await apiCall<{ success: boolean; comment: Comment }>(
    `/comments/${id}/hide`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: data?.reason }),
    }
  );
  return response;
};

/**
 * Восстановить комментарий
 */
export const restoreComment = async (
  id: number
): Promise<{ success: boolean; comment: Comment }> => {
  const response = await apiCall<{ success: boolean; comment: Comment }>(
    `/comments/${id}/restore`,
    {
      method: 'PATCH',
    }
  );
  return response;
};

/**
 * Получить историю редактирования комментария
 */
export const getCommentHistory = async (
  id: number
): Promise<{ success: boolean; history: CommentEdit[] }> => {
  const response = await apiCall<{ success: boolean; history: CommentEdit[] }>(
    `/comments/${id}/history`
  );
  return response;
};

/**
 * Пожаловаться на комментарий
 */
export const reportComment = async (
  id: number,
  data: ReportCommentData
): Promise<{ success: boolean; report: CommentReport }> => {
  const response = await apiCall<{ success: boolean; report: CommentReport }>(
    `/comments/${id}/report`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: data.reason }),
    }
  );
  return response;
};

/**
 * Admin: Получить все комментарии с фильтрами
 */
export const getAdminComments = async (params: {
  page?: number;
  limit?: number;
  status?: 'all' | 'hidden' | 'deleted';
  newsId?: number;
  userId?: number;
  search?: string;
}): Promise<{
  success: boolean;
  comments: (Comment & { reports_count: number })[];
  total: number;
  page: number;
  limit: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.status) queryParams.append('status', params.status);
  if (params.newsId) queryParams.append('newsId', String(params.newsId));
  if (params.userId) queryParams.append('userId', String(params.userId));
  if (params.search) queryParams.append('search', params.search);

  const response = await apiCall<any>(`/comments/admin/all?${queryParams}`);
  return response;
};

/**
 * Admin: Получить комментарий с контекстом (новость, жалобы)
 */
export const getCommentWithContext = async (id: number): Promise<{
  success: boolean;
  comment: Comment;
  news: { id: number; title: string; slug?: string };
  reports: any[];
}> => {
  const response = await apiCall<any>(`/comments/admin/${id}/context`);
  return response;
};

/**
 * Admin: Массовые операции с комментариями
 */
export const bulkCommentAction = async (params: {
  ids: number[];
  action: 'hide' | 'restore' | 'delete';
  reason?: string;
}): Promise<{
  success: boolean;
  results: { id: number; success: boolean; action?: string; error?: string }[];
  total: number;
  successful: number;
  failed: number;
}> => {
  const response = await apiCall<any>('/comments/admin/bulk-action', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
};

/**
 * Admin: Получить статистику комментариев пользователя
 */
export const getUserCommentStats = async (userId: number): Promise<{
  success: boolean;
  stats: {
    totalComments: number;
    hiddenComments: number;
    totalReports: number;
  };
  recentComments: any[];
}> => {
  const response = await apiCall<any>(`/comments/admin/user/${userId}/stats`);
  return response;
};

/**
 * Admin: Скрыть все комментарии пользователя
 */
export const hideAllUserComments = async (
  userId: number,
  reason?: string
): Promise<{ success: boolean; hidden: number }> => {
  const response = await apiCall<any>(
    `/comments/admin/user/${userId}/hide-all`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );
  return response;
};

/**
 * Комментарии API объект (для обратной совместимости)
 */
export const commentsAPI = {
  getByNewsId: getComments,
  getMy: getMyComments,
  create: createComment,
  update: updateComment,
  delete: deleteComment,
  hide: hideComment,
  restore: restoreComment,
  getHistory: getCommentHistory,
  report: reportComment,
  // Admin endpoints
  admin: {
    getAll: getAdminComments,
    getById: getCommentWithContext,
    bulkAction: bulkCommentAction,
    getUserStats: getUserCommentStats,
    hideAllFromUser: hideAllUserComments,
  },
};

/**
 * Получить все жалобы
 */
export const getReports = async (
  status = 'pending',
  page = 1,
  limit = 20
): Promise<ReportsResponse> => {
  const response = await apiCall<ReportsResponse>(
    `/reports?status=${status}&page=${page}&limit=${limit}`
  );
  return response;
};

/**
 * Получить количество ожидающих жалоб
 */
export const getPendingReportsCount = async (): Promise<{ count: number }> => {
  const response = await apiCall<{ count: number }>('/reports/pending-count');
  return response;
};

/**
 * Получить жалобу по ID
 */
export const getReportById = async (
  id: number
): Promise<{ success: boolean; report: CommentReport }> => {
  const response = await apiCall<{ success: boolean; report: CommentReport }>(
    `/reports/${id}`
  );
  return response;
};

/**
 * Обновить статус жалобы
 */
export const updateReportStatus = async (
  id: number,
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected'
): Promise<{ success: boolean; report: CommentReport }> => {
  const response = await apiCall<{ success: boolean; report: CommentReport }>(
    `/reports/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return response;
};

/**
 * Рассмотреть жалобу (скрыть комментарий если жалоба обоснована)
 */
export const reviewReport = async (
  id: number,
  status: 'resolved' | 'rejected',
  reason?: string
): Promise<{ success: boolean; report: CommentReport }> => {
  const response = await apiCall<{ success: boolean; report: CommentReport }>(
    `/reports/${id}/review`,
    {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }
  );
  return response;
};

/**
 * Reports API объект
 */
export const reportsAPI = {
  getAll: getReports,
  getPendingCount: getPendingReportsCount,
  getById: getReportById,
  updateStatus: updateReportStatus,
  review: reviewReport,
};
