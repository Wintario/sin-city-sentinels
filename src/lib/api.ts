// API configuration and utilities
// In production on VPS, API is proxied via Nginx to /api
// For Lovable preview or local dev, set VITE_API_URL environment variable
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
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized - clear token and redirect
  if (response.status === 401) {
    clearToken();
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API Error');
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
  
  logout: () => {
    clearToken();
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
  created_at: string;
  updated_at: string;
  author?: string;
  author_id?: number;
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
        published_at: data.published_at || null,
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
  created_at: string;
  updated_at: string;
}

export interface MemberCreateInput {
  name: string;
  role: string;
  profile_url?: string | null;
  status?: string;
  avatar_url?: string | null;
  order_index?: number | null;
}

// Members API
export const membersAPI = {
  // Public endpoints - only active members
  getAll: () => apiCall<Member[]>('/members'),
  getById: (id: number) => apiCall<Member>(`/members/${id}`),
  
  // Admin endpoints - all members
  getAdminList: () => apiCall<Member[]>('/members'),
  
  create: (data: MemberCreateInput) =>
    apiCall<Member>('/members', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        role: data.role,
        status: data.status || 'active',
        profile_url: data.profile_url || null,
        avatar_url: data.avatar_url || null,
        order_index: data.order_index ?? null,
      }),
    }),
  update: (id: number, data: Partial<MemberCreateInput>) =>
    apiCall<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        avatar_url: data.avatar_url || null,
        profile_url: data.profile_url || null,
        order_index: data.order_index ?? null,
      }),
    }),
  delete: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE',
    }),
  reorder: (id: number, orderIndex: number) =>
    apiCall<Member>(`/members/${id}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ order_index: orderIndex }),
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

// Background settings (localStorage)
export const backgroundAPI = {
  get: () => ({
    bgImageUrl: localStorage.getItem('clan_bgImageUrl') || '',
    bgColor: localStorage.getItem('clan_bgColor') || '#1a1a1a',
    bgOpacity: parseFloat(localStorage.getItem('clan_bgOpacity') || '0.7'),
  }),
  save: (data: { bgImageUrl: string; bgColor: string; bgOpacity: number }) => {
    localStorage.setItem('clan_bgImageUrl', data.bgImageUrl);
    localStorage.setItem('clan_bgColor', data.bgColor);
    localStorage.setItem('clan_bgOpacity', data.bgOpacity.toString());
  },
};
