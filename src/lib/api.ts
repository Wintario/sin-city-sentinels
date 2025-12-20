// API configuration and utilities
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

// Get stored user
export const getStoredUser = (): { id: number; username: string; role: string } | null => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};

// Set stored user
export const setStoredUser = (user: { id: number; username: string; role: string }): void => {
  localStorage.setItem('auth_user', JSON.stringify(user));
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Generic API call with auth handling
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  // Указываем чтобы максимально использовать cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // На одном домене - всегда передавать cookies
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
  
  // Handle 401 Unauthorized - clear token and redirect (только для защищённых маршрутов)
  if (response.status === 401) {
    clearToken();
    // Не редиректим сразу - пусть компонент сам решит что делать
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API Error');
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
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Upload Error');
  }
  
  return data as T;
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const data = await apiCall<{ token: string; user: { id: number; username: string; role: string } }>(  
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },
  
  logout: async () => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.log('Logout API error (expected if not authenticated):', error);
    } finally {
      clearToken();
    }
  },
  
  verify: async () => {
    // Специальная функция для проверки без редиректа
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      
      // Если 401 - просто возвращаем false, не редиректим
      if (response.status === 401) {
        return { valid: false };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { valid: false };
    }
  },
};

// News types
export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  published_at?: string;
  is_deleted?: number;
  views_count?: number;
  created_at: string;
  updated_at: string;
  updated_by?: number;
  updated_by_username?: string;
  author?: string;
  author_id?: number;
  display_order?: number;
}

export interface NewsCreateInput {
  title: string;
  content: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at?: string | null;
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
  reorder: (newsIds: number[]) =>
    apiCall<{ success: boolean; message: string; news: News[] }>('/news/admin/reorder', {
      method: 'POST',
      body: JSON.stringify({ newsIds }),
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

// Users API
export const usersAPI = {
  getList: () => apiCall<User[]>('/users'),
  getById: (id: number) => apiCall<User>(`/users/${id}`),
  create: (data: UserCreateInput) =>
    apiCall<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { password?: string; role?: 'admin' | 'author' }) =>
    apiCall<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

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