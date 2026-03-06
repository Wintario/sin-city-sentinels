/**
 * Zustand store для управления UI состоянием комментариев
 * Хранит состояние диалогов, редактирования и других UI элементов
 */

import { create } from 'zustand';
import type { Comment } from '@/types/comments';

interface CommentUIState {
  // Редактирование
  editingComment: Comment | null;
  replyingTo: Comment | null;
  isEditorOpen: boolean;
  editorInitialValue: string;

  // Диалоги
  reportDialog: {
    isOpen: boolean;
    comment: Comment | null;
  };
  deleteDialog: {
    isOpen: boolean;
    comment: Comment | null;
  };
  hideDialog: {
    isOpen: boolean;
    comment: Comment | null;
  };
  editHistoryDialog: {
    isOpen: boolean;
    comment: Comment | null;
  };

  // Действия
  setEditingComment: (comment: Comment | null) => void;
  setReplyingTo: (comment: Comment | null) => void;
  setEditorOpen: (isOpen: boolean) => void;
  setEditorInitialValue: (value: string) => void;

  // Диалог жалобы
  openReportDialog: (comment: Comment) => void;
  closeReportDialog: () => void;

  // Диалог удаления
  openDeleteDialog: (comment: Comment) => void;
  closeDeleteDialog: () => void;

  // Диалог скрытия
  openHideDialog: (comment: Comment) => void;
  closeHideDialog: () => void;

  // Диалог истории
  openEditHistoryDialog: (comment: Comment) => void;
  closeEditHistoryDialog: () => void;

  // Сброс всех состояний
  resetAll: () => void;
}

export const useCommentStore = create<CommentUIState>((set) => ({
  // Начальное состояние
  editingComment: null,
  replyingTo: null,
  isEditorOpen: false,
  editorInitialValue: '',

  reportDialog: {
    isOpen: false,
    comment: null,
  },
  deleteDialog: {
    isOpen: false,
    comment: null,
  },
  hideDialog: {
    isOpen: false,
    comment: null,
  },
  editHistoryDialog: {
    isOpen: false,
    comment: null,
  },

  // Редактирование
  setEditingComment: (comment) => set({ editingComment: comment }),
  setReplyingTo: (comment) => set({ replyingTo: comment }),
  setEditorOpen: (isOpen) => set({ isEditorOpen: isOpen }),
  setEditorInitialValue: (value) => set({ editorInitialValue: value }),

  // Диалог жалобы
  openReportDialog: (comment) => set({
    reportDialog: { isOpen: true, comment },
  }),
  closeReportDialog: () => set({
    reportDialog: { isOpen: false, comment: null },
  }),

  // Диалог удаления
  openDeleteDialog: (comment) => set({
    deleteDialog: { isOpen: true, comment },
  }),
  closeDeleteDialog: () => set({
    deleteDialog: { isOpen: false, comment: null },
  }),

  // Диалог скрытия
  openHideDialog: (comment) => set({
    hideDialog: { isOpen: true, comment },
  }),
  closeHideDialog: () => set({
    hideDialog: { isOpen: false, comment: null },
  }),

  // Диалог истории
  openEditHistoryDialog: (comment) => set({
    editHistoryDialog: { isOpen: true, comment },
  }),
  closeEditHistoryDialog: () => set({
    editHistoryDialog: { isOpen: false, comment: null },
  }),

  // Сброс всех состояний
  resetAll: () => set({
    editingComment: null,
    replyingTo: null,
    isEditorOpen: false,
    editorInitialValue: '',
    reportDialog: { isOpen: false, comment: null },
    deleteDialog: { isOpen: false, comment: null },
    hideDialog: { isOpen: false, comment: null },
    editHistoryDialog: { isOpen: false, comment: null },
  }),
}));
