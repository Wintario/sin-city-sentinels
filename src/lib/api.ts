// API configuration and utilities
const API_URL = '/api';

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
  excerpt?: string;
  image_url?: string;
  published_at?: string;
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
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<NewsCreateInput>) =>
    apiCall<News>(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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
  profile_url?: string;
  status?: string;
  avatar_url?: string;
  order_index?: number;
}

// Members API
export const membersAPI = {
  // Public endpoints
  getAll: () => apiCall<Member[]>('/members'),
  getById: (id: number) => apiCall<Member>(`/members/${id}`),
  
  // Admin endpoints
  create: (data: MemberCreateInput) =>
    apiCall<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<MemberCreateInput>) =>
    apiCall<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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
