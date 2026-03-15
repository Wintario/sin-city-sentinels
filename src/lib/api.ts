// API configuration and utilities
// РџСЂРё СЂР°Р·СЂР°Р±РѕС‚РєРµ С‡РµСЂРµР· Vite proxy РёСЃРїРѕР»СЊР·СѓРµРј РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅС‹Р№ РїСѓС‚СЊ '/api'
// Р‘РµРєРµРЅРґ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ Р·Р°РїСѓС‰РµРЅ РЅР° localhost:3000
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Clear auth token
export const clearToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export interface StoredUser {
  id: number;
  username: string;
  role: string;
  email?: string;
  displayName?: string;
  display_name?: string;
  arena_nickname?: string;
  is_active?: number;
  is_verified?: boolean;
  character_image?: string | null;
  character_level?: number | null;
  race_code?: string | null;
  race_class?: string | null;
  race_title?: string | null;
  race_style?: string | null;
  clan_name?: string | null;
  clan_url?: string | null;
  clan_icon?: string | null;
  is_target_clan_member?: boolean;
  clan_checked_at?: string | null;
}

// Get stored user
export const getStoredUser = (): StoredUser | null => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};

// Set stored user
export const setStoredUser = (user: StoredUser): void => {
  localStorage.setItem('auth_user', JSON.stringify(user));
};

// Generic API call with auth handling
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthCleanup = false // РќРµ РѕС‡РёС‰Р°С‚СЊ С‚РѕРєРµРЅ РїСЂРё 401
): Promise<T> => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // credentials: 'include' - РїРµСЂРµРґР°РІР°С‚СЊ cookies РґР°Р¶Рµ РЅР° СЂР°Р·РЅС‹Рµ origins (РЅСѓР¶РЅРѕ РґР»СЏ CORS)
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };

  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  // Handle 401 Unauthorized - clear token and redirect (С‚РѕР»СЊРєРѕ РґР»СЏ Р·Р°С‰РёС‰С‘РЅРЅС‹С… РјР°СЂС€СЂСѓС‚РѕРІ)
  if (response.status === 401) {
    if (!skipAuthCleanup) {
      clearToken();
    }
    // РќРµ СЂРµРґРёСЂРµРєС‚РёРј СЃСЂР°Р·Сѓ - РїСѓСЃС‚СЊ РєРѕРјРїРѕРЅРµРЅС‚ СЃР°Рј СЂРµС€РёС‚ С‡С‚Рѕ РґРµР»Р°С‚СЊ
    throw new Error('Unauthorized');
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }
  
  return data as T;
};

// File upload helper
export const apiUpload = async <T>(
  endpoint: string,
  file: File,
  fieldName: string = 'file'
): Promise<T> => {
  const token = getToken();

  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  
  if (response.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  
  const data = await parseResponseBody(response);
  
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status, 'Upload Error'));
  }
  
  return data as T;
};

const parseResponseBody = async (response: Response): Promise<Record<string, any>> => {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return { message: raw };
};

const extractErrorMessage = (
  data: Record<string, any>,
  status: number,
  fallbackPrefix = 'API Error'
): string => {
  const arrayLikeErrors = [data?.details, data?.errors].find(Array.isArray);
  if (arrayLikeErrors && arrayLikeErrors.length > 0) {
    return arrayLikeErrors
      .map((item) => (typeof item === 'string' ? item : item?.message))
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .join(', ');
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  return `${fallbackPrefix} (${status})`;
};

export interface VideoUploadJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
  };
  error?: string;
}

export const uploadVideoForNews = async (file: File): Promise<{ videoUrl: string; thumbnailUrl: string }> => {
  const startResponse = await apiUpload<{ success: boolean; jobId: string }>(
    '/upload/video',
    file,
    'video'
  );

  const maxAttempts = 120;
  const delayMs = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusResponse = await apiCall<{ success: boolean; job: VideoUploadJob }>(
      `/upload/video/status/${startResponse.jobId}`
    );

    if (statusResponse.job.status === 'completed' && statusResponse.job.result) {
      return statusResponse.job.result;
    }

    if (statusResponse.job.status === 'failed') {
      throw new Error(statusResponse.job.error || 'РћС€РёР±РєР° РѕР±СЂР°Р±РѕС‚РєРё РІРёРґРµРѕ');
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('РџСЂРµРІС‹С€РµРЅРѕ РІСЂРµРјСЏ РѕР¶РёРґР°РЅРёСЏ РѕР±СЂР°Р±РѕС‚РєРё РІРёРґРµРѕ');
};

// News types
export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  header_image_meta?: string | null;
  published_at?: string;
  is_deleted?: number;
  views_count?: number;
  created_at: string;
  updated_at: string;
  updated_by?: number;
  updated_by_username?: string;
  author?: string;
  author_id?: number;
  comments_total?: number;
  comments_new?: number;
  card_width?: 'wide' | 'narrow';
}

export interface NewsCreateInput {
  title: string;
  content: string;
  excerpt?: string | null;
  image_url?: string | null;
  header_image_meta?: string | null;
  published_at?: string | null;
  card_width?: 'wide' | 'narrow' | null;
}

// News API
export const newsAPI = {
  // Public endpoints
  getAll: () => apiCall<News[]>('/news'),
  getById: (id: number) => apiCall<News>(`/news/${id}`),
  
  // Admin endpoints
  getAdminList: () => apiCall<News[]>('/news/admin/list'),
  getAdminById: (id: number) => apiCall<News>(`/news/admin/${id}`),
  create: (data: NewsCreateInput) => 
    apiCall<News>('/news', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        image_url: data.image_url || null,
        header_image_meta: data.header_image_meta || null,
        published_at: data.published_at || null,
      }),
    }),
  update: (id: number, data: Partial<NewsCreateInput>) =>
    apiCall<News>(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        image_url: data.image_url || null,
        header_image_meta: data.header_image_meta || null,
        published_at: data.published_at,
      }),
    }),
  delete: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/news/${id}`, {
      method: 'DELETE',
    }),
  restore: (id: number) =>
    apiCall<News>(`/news/${id}/restore`, {
      method: 'PATCH',
    }),
  publish: (id: number) =>
    apiCall<News>(`/news/${id}/publish`, {
      method: 'PUT',
    }),
  moveUp: (id: number) =>
    apiCall<{ success: boolean; news: News }>(`/news/${id}/move-up`, {
      method: 'POST',
    }),
  moveDown: (id: number) =>
    apiCall<{ success: boolean; news: News }>(`/news/${id}/move-down`, {
      method: 'POST',
    }),
};

// Member types
export interface Member {
  id: number;
  name: string;
  role: string;
  profile_url?: string;
  status: string;
  avatar_url?: string;
  character_image?: string | null;
  character_level?: number | null;
  race_code?: string | null;
  race_class?: string | null;
  race_title?: string | null;
  race_style?: string | null;
  clan_name?: string | null;
  clan_url?: string | null;
  clan_icon?: string | null;
  order_index?: number;
  is_leader?: number;
  created_at: string;
  updated_at: string;
}

export interface MemberCreateInput {
  name: string;
  role?: string;
  profile_url?: string | null;
  status?: string;
  avatar_url?: string | null;
  order_index?: number | null;
}

// Import result type
export interface ImportResult {
  success: boolean;
  updated: number;
  created: number;
  processed: Array<{ name: string; action: string; error?: string }>;
}

export interface MembersVisibilitySettings {
  visible: boolean;
}

export interface ClanWidgetSettings {
  enabled: boolean;
  title: string;
  body: string;
  fights: Array<{
    date: string;
    time?: string;
    opponent: string;
  }>;
}

// Members API
export const membersAPI = {
  // Public endpoints
  getAll: () => apiCall<Member[]>('/members'),
  getById: (id: number) => apiCall<Member>(`/members/${id}`),
  
  // Admin endpoints
  getAdminList: () => apiCall<Member[]>('/members/admin/list'),
  
  create: (data: MemberCreateInput) =>
    apiCall<Member>('/members', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        role: data.role || 'Boec',
        status: data.status || 'active',
        profile_url: data.profile_url || null,
        avatar_url: data.avatar_url || null,
      }),
    }),
  update: (id: number, data: Partial<MemberCreateInput>) =>
    apiCall<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        avatar_url: data.avatar_url || null,
        profile_url: data.profile_url || null,
      }),
    }),
  delete: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE',
    }),
  setLeader: (id: number) =>
    apiCall<Member>(`/members/${id}/leader`, {
      method: 'PUT',
    }),
  import: (data: { members: Array<{ user_id: string; nickname: string; filename: string; avatar_url?: string }> }) =>
    apiCall<ImportResult>('/members/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const settingsAPI = {
  getMembersVisibility: () =>
    apiCall<MembersVisibilitySettings>('/settings/members-visibility'),

  updateMembersVisibility: (visible: boolean) =>
    apiCall<MembersVisibilitySettings>('/settings/members-visibility', {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    }),

  getClanWidget: () =>
    apiCall<ClanWidgetSettings>('/settings/clan-widget'),

  updateClanWidget: (data: ClanWidgetSettings) =>
    apiCall<ClanWidgetSettings>('/settings/clan-widget', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// User/Admin types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'author';
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: 'admin' | 'author';
}

// Stats types
export interface StatsOverview {
  total_news_views: number;
  total_page_views: number;
  unique_days: number;
  last_view: string;
}

export interface NewsViewStats {
  id: number;
  title: string;
  views_count: number;
  recent_views_7days: number;
}

export interface PageVisitStats {
  date: string;
  page_type: string;
  visits: number;
  unique_visitors: number;
}

// Stats API
export const statsAPI = {
  trackNewsView: (newsId: number) =>
    apiCall<{ success: boolean }>(`/stats/view/news/${newsId}`, {
      method: 'POST',
    }),

  getOverview: () => apiCall<StatsOverview>('/stats/overview'),

  getNewsViews: () => apiCall<NewsViewStats[]>('/stats/news-views'),

  getPageVisits: () => apiCall<PageVisitStats[]>('/stats/page-visits'),
};

// ============================================
// Registration & Auth API
// ============================================

export interface RegisterInput {
  password: string;
  characterUrl: string;    // Ссылка на персонажа (обязательно)
}

export interface LoginInput {
  username: string;        // Ник в Арене
  password: string;
}
export interface UserWithProfile {
  id: number;
  username: string;
  role: string;
  email?: string;
  displayName?: string;
  display_name?: string;
  arena_nickname?: string;
  is_active?: number;
  is_verified?: boolean;
  character_image?: string | null;
  character_level?: number | null;
  race_code?: string | null;
  race_class?: string | null;
  race_title?: string | null;
  race_style?: string | null;
  clan_name?: string | null;
  clan_url?: string | null;
  clan_icon?: string | null;
  is_target_clan_member?: boolean;
  clan_checked_at?: string | null;
}

export const authAPI = {
  login: (data: LoginInput) =>
    apiCall<{ token: string; user: UserWithProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterInput) =>
    apiCall<{ success: boolean; verificationToken?: string; user: UserWithProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyCharacter: (token: string) =>
    apiCall<{ success: boolean }>('/auth/verify-character', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resetPasswordRequest: (data: { username: string; characterUrl: string }) =>
    apiCall<{ success: boolean; resetToken?: string }>('/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (token: string, password: string) =>
    apiCall<{ success: boolean }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    apiCall<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => apiCall<{ user: UserWithProfile }>('/auth/me', {}, true), // РќРµ РѕС‡РёС‰Р°С‚СЊ С‚РѕРєРµРЅ РїСЂРё РѕС€РёР±РєРµ

  verifyToken: () => apiCall<{ valid: boolean; user: UserWithProfile }>('/auth/verify-token', { method: 'POST' }, true), // РќРµ РѕС‡РёС‰Р°С‚СЊ С‚РѕРєРµРЅ РїСЂРё РѕС€РёР±РєРµ - СЌС‚Рѕ С„РѕРЅРѕРІР°СЏ РїСЂРѕРІРµСЂРєР°
};

// ============================================
// Comments API
// ============================================

export interface Comment {
  id: number;
  news_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  is_deleted: boolean;
  is_hidden: boolean;
  hidden_by?: number;
  hidden_at?: string;
  hidden_reason?: string;
  edited_at?: string;
  created_at: string;
  author_username: string;
  author_display_name?: string;
  author_arena_nickname?: string;
  author_character_url?: string;
  author_character_level?: number | null;
  author_race_code?: string | null;
  author_race_class?: string | null;
  author_race_title?: string | null;
  author_race_style?: string | null;
  author_clan_name?: string | null;
  author_clan_url?: string | null;
  author_clan_icon?: string | null;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export const commentsAPI = {
  getByNewsId: (newsId: number, page = 1, limit = 20) =>
    apiCall<CommentsResponse>(`/comments?newsId=${newsId}&page=${page}&limit=${limit}`),

  create: (newsId: number, content: string, parentId?: number) =>
    apiCall<{ success: boolean; comment: Comment }>('/comments', {
      method: 'POST',
      body: JSON.stringify({ newsId, content, parentId }),
    }),

  update: (id: number, content: string) =>
    apiCall<{ success: boolean; comment: Comment }>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  delete: (id: number) =>
    apiCall<{ success: boolean; comment: Comment }>(`/comments/${id}`, {
      method: 'DELETE',
    }),

  hide: (id: number, reason?: string) =>
    apiCall<{ success: boolean; comment: Comment }>(`/comments/${id}/hide`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  restore: (id: number) =>
    apiCall<{ success: boolean; comment: Comment }>(`/comments/${id}/restore`, {
      method: 'PATCH',
    }),

  getHistory: (id: number) =>
    apiCall<{ success: boolean; history: any[] }>(`/comments/${id}/history`),

  report: (id: number, reason: string) =>
    apiCall<{ success: boolean; report: any }>(`/comments/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================
// Reports API (Admin)
// ============================================

export interface CommentReport {
  id: number;
  comment_id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
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

export const reportsAPI = {
  getAll: (status = 'pending', page = 1, limit = 20) =>
    apiCall<ReportsResponse>(`/reports?status=${status}&page=${page}&limit=${limit}`),

  getPendingCount: () => apiCall<{ count: number }>('/reports/pending-count'),

  getById: (id: number) => apiCall<{ success: boolean; report: CommentReport }>(`/reports/${id}`),

  updateStatus: (id: number, status: 'pending' | 'reviewed' | 'resolved' | 'rejected') =>
    apiCall<{ success: boolean; report: CommentReport }>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  bulkAction: (reportIds: number[], action: string, status?: string) =>
    apiCall<{ success: boolean; results: any[] }>('/reports/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ reportIds, action, status }),
    }),
};

// ============================================
// Users API (Extended for Admin)
// ============================================

export interface UserWithProfileExtended extends UserWithProfile {
  created_at: string;
  updated_at: string;
  email_verified?: boolean;
  email?: string;
  display_name?: string;
  arena_nickname?: string;
  character_url?: string;
}

export interface BanInfo {
  id: number;
  user_id: number;
  banned_by?: number;
  ban_reason?: string;
  ban_start: string;
  ban_end?: string;
  is_permanent: number;
  is_active: number;
  banned_by_username?: string;
}

export const usersAPI = {
  getList: () => apiCall<UserWithProfileExtended[]>('/users'),
  getById: (id: number) => apiCall<UserWithProfileExtended>(`/users/${id}`),
  getBanInfo: (id: number) => apiCall<{ success: boolean; ban?: BanInfo }>(`/users/${id}/ban`),
  create: (data: { username: string; password: string; role: string }) =>
    apiCall<UserWithProfileExtended>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { username?: string; email?: string; password?: string; role?: string; arenaNickname?: string; characterUrl?: string }) =>
    apiCall<UserWithProfileExtended>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  ban: (id: number, data: { banDuration: string; reason?: string }) =>
    apiCall<{ success: boolean; message: string; ban?: BanInfo }>(`/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unban: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/users/${id}/unban`, {
      method: 'POST',
    }),
  permanentDelete: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
  resetPassword: (id: number, newPassword: string) =>
    apiCall<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};

