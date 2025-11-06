// src/shared/hooks/useAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import ApiService, { LoginRequestDTO, DoctorRegisterRequestDTO, AuthResponse } from '../../services/api';
import { logError } from '../utils/errorHandler';
import { TokenStorage, secureStorage } from '../utils/secureStorage';
import { 
  sessionManager, 
  loginAttemptTracker, 
  validateForm 
} from '../utils/securityUtils';

const USER_INFO_KEY = 'user_info';

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  role?: 'doctor' | 'patient';
}

export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequestDTO) => Promise<void>;
  register: (data: DoctorRegisterRequestDTO) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

/**
 * Custom hook for authentication state management
 * Handles login, logout, token persistence, and user info
 * 
 * @example
 * const { isAuthenticated, user, login, logout } = useAuth();
 * 
 * const handleLogin = async () => {
 *   await login({ email: 'test@test.com', password: '123456' });
 * };
 */
export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginApi = useApi<AuthResponse>();
  const registerApi = useApi<AuthResponse>();

  // Load auth state from storage on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        TokenStorage.getToken(),
        secureStorage.getObject<UserInfo>(USER_INFO_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Initialize session manager
        sessionManager.init(async () => {
          await logout();
        });
      }
    } catch (err) {
      logError(err as Error, 'useAuth.loadAuthState');
    } finally {
      setLoading(false);
    }
  };

  const saveAuthState = async (authToken: string, userInfo: UserInfo) => {
    try {
      await Promise.all([
        TokenStorage.setToken(authToken),
        secureStorage.setObject(USER_INFO_KEY, userInfo),
      ]);
      setToken(authToken);
      setUser(userInfo);
      setIsAuthenticated(true);
      
      // Initialize session manager
      sessionManager.init(async () => {
        await logout();
      });
    } catch (err) {
      logError(err as Error, 'useAuth.saveAuthState');
      throw err;
    }
  };

  const clearAuthState = async () => {
    try {
      await Promise.all([
        TokenStorage.removeToken(),
        secureStorage.removeItem(USER_INFO_KEY),
      ]);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear session manager
      sessionManager.clear();
    } catch (err) {
      logError(err as Error, 'useAuth.clearAuthState');
    }
  };

  const login = useCallback(
    async (credentials: LoginRequestDTO) => {
      // Validate input
      const validation = validateForm.login(credentials);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Check if account is locked
      if (loginAttemptTracker.isLocked(credentials.email)) {
        const remainingTime = Math.ceil(
          loginAttemptTracker.getRemainingLockoutTime(credentials.email) / 1000 / 60
        );
        throw new Error(
          `Account locked due to multiple failed attempts. Try again in ${remainingTime} minutes.`
        );
      }

      try {
        const response = await loginApi.execute(() => ApiService.login(credentials));
        
        if (response && response.accessToken) {
          const userInfo: UserInfo = {
            id: response.id,
            email: response.email,
            name: response.email.split('@')[0], // Extract name from email
            role: 'doctor',
          };
          
          await saveAuthState(response.accessToken, userInfo);
          
          // Reset login attempts on success
          loginAttemptTracker.resetAttempts(credentials.email);
        }
      } catch (error) {
        // Record failed attempt
        loginAttemptTracker.recordFailure(credentials.email);
        
        const remainingAttempts = loginAttemptTracker.getRemainingAttempts(credentials.email);
        if (remainingAttempts > 0 && remainingAttempts <= 3) {
          throw new Error(
            `Invalid credentials. ${remainingAttempts} attempt(s) remaining before lockout.`
          );
        }
        
        throw error;
      }
    },
    [loginApi]
  );

  const register = useCallback(
    async (data: DoctorRegisterRequestDTO) => {
      // Validate registration data (skip confirmPassword validation for DTO)
      const validation = validateForm.registration({
        email: data.email,
        password: data.password,
        confirmPassword: data.password, // Use same password for validation
        name: data.name,
      });
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      const response = await registerApi.execute(() => ApiService.register(data));
      
      if (response && response.accessToken) {
        const userInfo: UserInfo = {
          id: response.id,
          email: response.email,
          name: data.name,
          role: 'doctor',
        };
        
        await saveAuthState(response.accessToken, userInfo);
      }
    },
    [registerApi]
  );

  const logout = useCallback(async () => {
    await clearAuthState();
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    await loadAuthState();
  }, []);

  return {
    isAuthenticated,
    user,
    token,
    loading: loading || loginApi.loading || registerApi.loading,
    error: loginApi.error || registerApi.error,
    login,
    register,
    logout,
    refreshAuth,
  };
}

/**
 * Helper hook to check if user has specific role
 */
export function useRequireAuth(requiredRole?: 'doctor' | 'patient') {
  const { isAuthenticated, user, loading } = useAuth();

  const hasAccess = isAuthenticated && (!requiredRole || user?.role === requiredRole);

  return {
    hasAccess,
    loading,
    isAuthenticated,
    user,
  };
}
