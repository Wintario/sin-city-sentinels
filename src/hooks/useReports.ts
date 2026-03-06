/**
 * TanStack Query hooks for reports moderation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CommentReport, ReportsResponse } from '@/types/comments';
import {
  getReports,
  getPendingReportsCount,
  getReportById,
  updateReportStatus,
  reviewReport,
} from '@/lib/api/comments';

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary';

export const useReports = (status = 'pending', page = 1, limit = 50) => {
  return useQuery<ReportsResponse, Error>({
    queryKey: ['reports', status, page, limit],
    queryFn: () => getReports(status, page, limit),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
};

export const usePendingReportsCount = () => {
  return useQuery<{ count: number }, Error>({
    queryKey: ['reports', 'pending-count'],
    queryFn: () => getPendingReportsCount(),
    staleTime: 1000 * 60,
    retry: 2,
  });
};

export const useReportById = (id: number, enabled = false) => {
  return useQuery<{ success: boolean; report: CommentReport }, Error>({
    queryKey: ['report', id],
    queryFn: () => getReportById(id),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'reviewed' | 'resolved' | 'rejected' }) =>
      updateReportStatus(id, status),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previousReports = queryClient.getQueryData<ReportsResponse>(['reports', 'pending']);

      if (previousReports) {
        queryClient.setQueryData(['reports', 'pending'], {
          ...previousReports,
          reports: previousReports.reports.filter((r) => r.id !== id),
          total: previousReports.total - 1,
        });
      }

      return { previousReports };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(['reports', 'pending'], context.previousReports);
      }
      toast.error('Не удалось обновить статус жалобы');
    },
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'pending-count'] });
      toast.success(`Статус обновлён: ${getStatusLabel(status)}`);
    },
    retry: 2,
  });
};

export const useReviewReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: number;
      status: 'resolved' | 'rejected';
      reason?: string;
      hideComment?: boolean;
    }) => reviewReport(id, status, reason),
    onSuccess: (_data, { status, hideComment }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'pending-count'] });

      if (hideComment) {
        queryClient.invalidateQueries({ queryKey: ['comments'] });
        toast.success('Комментарий скрыт, жалоба закрыта');
      } else {
        toast.success(status === 'resolved' ? 'Жалоба решена' : 'Жалоба отклонена');
      }
    },
    onError: () => {
      toast.error('Ошибка при рассмотрении жалобы');
    },
    retry: 2,
  });
};

export const useReportsSummary = () => {
  return useQuery<{ pending: number }, Error>({
    queryKey: ['reports', 'summary'],
    queryFn: async () => {
      const pending = await getPendingReportsCount();
      return { pending: pending.count };
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    reviewed: 'Проверено',
    resolved: 'Решено',
    rejected: 'Отклонено',
  };
  return labels[status] || status;
};

export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  const variants: Record<string, BadgeVariant> = {
    pending: 'destructive',
    reviewed: 'default',
    resolved: 'secondary',
    rejected: 'outline',
  };
  return variants[status] || 'secondary';
};
