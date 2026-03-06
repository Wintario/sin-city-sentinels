/**
 * TanStack Query С…СѓРєРё РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ РєРѕРјРјРµРЅС‚Р°СЂРёСЏРјРё
 * Р РµР°Р»РёР·СѓРµС‚ РѕРїС‚РёРјРёСЃС‚РёС‡РЅС‹Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ, РєСЌС€РёСЂРѕРІР°РЅРёРµ Рё РѕР±СЂР°Р±РѕС‚РєСѓ РѕС€РёР±РѕРє
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Comment,
  CommentsResponse,
  CreateCommentData,
  UpdateCommentData,
  HideCommentData,
  ReportCommentData,
  CommentEdit,
} from '@/types/comments';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  hideComment,
  restoreComment,
  getCommentHistory,
  reportComment,
} from '@/lib/api/comments';

/**
 * РҐСѓРє РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёРµРІ СЃ РїР°РіРёРЅР°С†РёРµР№
 */
export const useComments = (newsId: number, page = 1, limit = 20) => {
  return useQuery<CommentsResponse, Error>({
    queryKey: ['comments', newsId, page, limit],
    queryFn: () => getComments(newsId, page, limit),
    staleTime: 1000 * 60 * 5, // 5 РјРёРЅСѓС‚
    gcTime: 1000 * 60 * 30, // 30 РјРёРЅСѓС‚
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * РҐСѓРє РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ СЃ РѕРїС‚РёРјРёСЃС‚РёС‡РЅС‹Рј РѕР±РЅРѕРІР»РµРЅРёРµРј
 */
export const useCreateComment = (newsId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => createComment(data),
    onMutate: async (newComment) => {
      // РћС‚РјРµРЅСЏРµРј С‚РµРєСѓС‰РёРµ Р·Р°РїСЂРѕСЃС‹
      await queryClient.cancelQueries({ queryKey: ['comments', newsId] });

      // РЎРѕС…СЂР°РЅСЏРµРј РїСЂРµРґС‹РґСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ
      const previousComments = queryClient.getQueryData<CommentsResponse>([
        'comments',
        newsId,
      ]);

      // РЎРѕР·РґР°С‘Рј РѕРїС‚РёРјРёСЃС‚РёС‡РЅС‹Р№ РєРѕРјРјРµРЅС‚Р°СЂРёР№
      const optimisticComment: Comment = {
        id: Date.now(), // Р’СЂРµРјРµРЅРЅС‹Р№ ID
        news_id: newsId,
        user_id: 0, // Р‘СѓРґРµС‚ РѕР±РЅРѕРІР»РµРЅРѕ СЃРµСЂРІРµСЂРѕРј
        parent_id: newComment.parentId ?? null,
        content: newComment.content,
        is_deleted: false,
        is_hidden: false,
        created_at: new Date().toISOString(),
        author_username: 'Вы',
        _isOptimistic: true,
      };

      // РћР±РЅРѕРІР»СЏРµРј РєСЌС€ РѕРїС‚РёРјРёСЃС‚РёС‡РЅРѕ
      if (previousComments) {
        queryClient.setQueryData(['comments', newsId], {
          ...previousComments,
          comments: [...previousComments.comments, optimisticComment],
          total: previousComments.total + 1,
        });
      }

      return { previousComments, optimisticComment };
    },
    onError: (err, variables, context) => {
      // РћС‚РєР°С‚ РїСЂРё РѕС€РёР±РєРµ
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newsId], context.previousComments);
      }
      toast.error('Не удалось опубликовать комментарий');
    },
    onSuccess: () => {
      // РРЅРІР°Р»РёРґРёСЂСѓРµРј Рё РїРµСЂРµР·Р°РіСЂСѓР¶Р°РµРј РґР°РЅРЅС‹Рµ
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ СЃ РѕРїС‚РёРјРёСЃС‚РёС‡РЅС‹Рј РѕР±РЅРѕРІР»РµРЅРёРµРј
 */
export const useUpdateComment = (newsId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCommentData }) =>
      updateComment(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', newsId] });

      const previousComments = queryClient.getQueryData<CommentsResponse>([
        'comments',
        newsId,
      ]);

      // РќР°С…РѕРґРёРј РєРѕРјРјРµРЅС‚Р°СЂРёР№ Рё СЃРѕС…СЂР°РЅСЏРµРј РїСЂРµРґС‹РґСѓС‰РµРµ СЃРѕРґРµСЂР¶РёРјРѕРµ
      const previousComment = previousComments?.comments.find(
        (c) => c.id === id
      );

      if (previousComments && previousComment) {
        queryClient.setQueryData(['comments', newsId], {
          ...previousComments,
          comments: previousComments.comments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  content: data.content,
                  edited_at: new Date().toISOString(),
                  _isOptimistic: true,
                }
              : c
          ),
        });
      }

      return { previousComments, previousComment };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newsId], context.previousComments);
      }
      toast.error('Не удалось обновить комментарий');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      queryClient.invalidateQueries({ queryKey: ['comment-history', variables.id] });
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ СѓРґР°Р»РµРЅРёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ
 */
export const useDeleteComment = (newsId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['comments', newsId] });

      const previousComments = queryClient.getQueryData<CommentsResponse>([
        'comments',
        newsId,
      ]);

      // РЎРѕС…СЂР°РЅСЏРµРј СѓРґР°Р»СЏРµРјС‹Р№ РєРѕРјРјРµРЅС‚Р°СЂРёР№
      const deletedComment = previousComments?.comments.find((c) => c.id === id);

      if (previousComments) {
        queryClient.setQueryData(['comments', newsId], {
          ...previousComments,
          comments: previousComments.comments.filter((c) => c.id !== id),
          total: previousComments.total - 1,
        });
      }

      return { previousComments, deletedComment };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newsId], context.previousComments);
      }
      toast.error('Не удалось удалить комментарий');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      toast.success('Комментарий удалён');
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ СЃРєСЂС‹С‚РёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ (РјРѕРґРµСЂР°С†РёСЏ)
 */
export const useHideComment = (newsId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: HideCommentData }) =>
      hideComment(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', newsId] });

      const previousComments = queryClient.getQueryData<CommentsResponse>([
        'comments',
        newsId,
      ]);

      if (previousComments) {
        queryClient.setQueryData(['comments', newsId], {
          ...previousComments,
          comments: previousComments.comments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  is_hidden: true,
                  hidden_at: new Date().toISOString(),
                  hidden_reason: data?.reason,
                }
              : c
          ),
        });
      }

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newsId], context.previousComments);
      }
      toast.error('Не удалось скрыть комментарий');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      toast.success('Комментарий скрыт');
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РєРѕРјРјРµРЅС‚Р°СЂРёСЏ
 */
export const useRestoreComment = (newsId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => restoreComment(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['comments', newsId] });

      const previousComments = queryClient.getQueryData<CommentsResponse>([
        'comments',
        newsId,
      ]);

      if (previousComments) {
        queryClient.setQueryData(['comments', newsId], {
          ...previousComments,
          comments: previousComments.comments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  is_hidden: false,
                  hidden_by: null,
                  hidden_at: null,
                  hidden_reason: null,
                }
              : c
          ),
        });
      }

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', newsId], context.previousComments);
      }
      toast.error('Не удалось восстановить комментарий');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', newsId] });
      toast.success('Комментарий восстановлен');
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ Р¶Р°Р»РѕР±С‹ РЅР° РєРѕРјРјРµРЅС‚Р°СЂРёР№
 */
export const useReportComment = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReportCommentData }) =>
      reportComment(id, data),
    onSuccess: () => {
      toast.success('Жалоба отправлена');
    },
    onError: (err) => {
      toast.error('Не удалось отправить жалобу');
    },
    retry: 2,
  });
};

/**
 * РҐСѓРє РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РёСЃС‚РѕСЂРёРё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ
 */
export const useCommentHistory = (commentId: number, enabled = false) => {
  return useQuery<{ success: boolean; history: CommentEdit[] }, Error>({
    queryKey: ['comment-history', commentId],
    queryFn: () => getCommentHistory(commentId),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 РјРёРЅСѓС‚
    retry: 2,
  });
};

