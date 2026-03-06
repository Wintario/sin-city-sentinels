import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, setToken as setApiToken, getStoredUser, setStoredUser, clearToken as clearStoredToken } from '@/lib/api';

export interface User {
  id: number;
  username: string;
  role: string;
  is_active?: number;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    characterUrl: string;
  }) => Promise<{ verificationToken?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = getStoredUser();

    console.log('[AuthContext] Init - token:', storedToken ? 'exists' : 'none', 'user:', storedUser);

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser as User);
      // Проверяем валидность токена асинхронно
      // НЕ сбрасываем авторизацию при ошибке сети - даём пользователю работать
      authAPI.verifyToken()
        .then(() => {
          console.log('[AuthContext] Token is valid');
          // Токен валиден - всё ок
        })
        .catch((error) => {
          console.log('[AuthContext] Token verification error:', error.message);
          // Сбрасываем авторизацию только если сервер явно вернул 401
          if (error.message === 'Unauthorized') {
            console.log('[AuthContext] Clearing auth due to 401');
            clearAuth();
          }
          // При ошибках сети - не сбрасываем, даём работать офлайн
        })
        .finally(() => {
          setIsLoading(false);
          console.log('[AuthContext] Loading complete, isAuthenticated:', !!storedToken);
        });
    } else {
      console.log('[AuthContext] No stored auth, loading complete');
      setIsLoading(false);
    }
  }, []);

  const clearAuth = () => {
    clearStoredToken();
    setTokenState(null);
    setUser(null);
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      setApiToken(response.token);
      setTokenState(response.token);
      setStoredUser(response.user);
      setUser(response.user);
    } catch (error: any) {
      // Не очищаем авторизацию при ошибке входа
      throw error;
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    characterUrl: string;
  }) => {
    const response = await authAPI.register(data);
    return { verificationToken: response.verificationToken };
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Игнорируем ошибки выхода
    } finally {
      clearAuth();
    }
  };

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      setStoredUser(response.user);
    } catch (error: any) {
      // Сбрасываем авторизацию только при явном 401
      if (error.message === 'Unauthorized') {
        clearAuth();
      }
      // При других ошибках - не сбрасываем
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.role === 'author';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isAuthor,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
