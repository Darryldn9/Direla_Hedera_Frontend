import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './useApi';
import { api } from '../services/api';
import { User } from '../types/api';
import { LoginRequest, SignupRequest } from '../services/api/auth.service';

/**
 * Hook for user authentication operations
 */
export function useAuth() {
  const signUp = useApi<any>(api.auth.signUp.bind(api.auth));
  const signIn = useApi<any>(api.auth.signIn.bind(api.auth));
  const signOut = useApi<void>(api.auth.signOut.bind(api.auth));
  const getCurrentUser = useApi<any>(api.auth.getCurrentUser.bind(api.auth));
  
  // Legacy methods
  const createUser = useApi<User>(api.auth.createUser.bind(api.auth));
  const getAllUsers = useApi<User[]>(api.auth.getAllUsers.bind(api.auth));
  const getUserById = useApi<User>(api.auth.getUserById.bind(api.auth));
  const updateUserBalance = useApi<User>(api.auth.updateUserBalance.bind(api.auth));
  const deleteUser = useApi<void>(api.auth.deleteUser.bind(api.auth));
  const userExists = useApi<boolean>(api.auth.userExists.bind(api.auth));
  const getUserProfile = useApi<User>(api.auth.getUserProfile.bind(api.auth));
  const updateUserProfile = useApi<User>(api.auth.updateUserProfile.bind(api.auth));

  return {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    createUser,
    getAllUsers,
    getUserById,
    updateUserBalance,
    deleteUser,
    userExists,
    getUserProfile,
    updateUserProfile,
  };
}

/**
 * Hook for user management with local state
 */
export function useUserManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = useAuth();

  // Load authentication state from storage on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      console.log('🔄 Loading auth state from storage...');
      const [savedUser, savedAuth] = await Promise.all([
        AsyncStorage.getItem('@direla_user'),
        AsyncStorage.getItem('@direla_authenticated')
      ]);
      
      console.log('📦 Storage data:', { savedUser: !!savedUser, savedAuth });
      
      if (savedUser && savedAuth === 'true') {
        const user = JSON.parse(savedUser);
        console.log('👤 User loaded from storage:', user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('✅ Auth state restored from storage');
      } else {
        console.log('❌ No valid auth state found in storage');
      }
    } catch (error) {
      console.error('💥 Error loading auth state:', error);
    } finally {
      console.log('🏁 Auth state loading complete');
      setIsLoading(false);
    }
  };

  const saveAuthState = async (user: any) => {
    try {
      await AsyncStorage.setItem('@direla_user', JSON.stringify(user));
      await AsyncStorage.setItem('@direla_authenticated', 'true');
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await AsyncStorage.removeItem('@direla_user');
      await AsyncStorage.removeItem('@direla_authenticated');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      console.log('🔐 Login attempt with credentials:', credentials);
      const result = await auth.signIn.execute(credentials);
      console.log('📥 Login result from API:', result);
      if (result) {
        console.log('✅ Login successful, user data:', result);
        setCurrentUser(result);
        setIsAuthenticated(true);
        await saveAuthState(result);
        console.log('💾 Auth state saved to storage');
        return result as User;
      }
      console.log('❌ Login failed - no data in result');
      return null;
    } catch (error) {
      console.error('💥 Login error in useAuth:', error);
      throw error;
    }
  }, [auth.signIn]);

  const signup = useCallback(async (credentials: SignupRequest) => {
    try {
      console.log('📝 Signup attempt with credentials:', credentials);
      const result = await auth.signUp.execute(credentials);
      console.log('📥 Signup result from API:', result);
      if (result) {
        console.log('✅ Signup successful, user data:', result);
        setCurrentUser(result);
        setIsAuthenticated(true);
        await saveAuthState(result);
        console.log('💾 Auth state saved to storage');
        return result as User;
      }
      console.log('❌ Signup failed - no data in result');
      return null;
    } catch (error) {
      console.error('💥 Signup error in useAuth:', error);
      throw error;
    }
  }, [auth.signUp]);

  const logout = useCallback(async () => {
    try {
      await auth.signOut.execute();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
      await clearAuthState();
    }
  }, [auth.signOut]);

  const refreshUser = useCallback(async () => {
    try {
      const result = await auth.getCurrentUser.execute();
      if (result?.data) {
        setCurrentUser(result.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, [auth.getCurrentUser]);

  // Legacy method for backward compatibility
  const loginById = useCallback(async (userId: string) => {
    const user = await auth.getUserById.execute(userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    return user;
  }, [auth.getUserById]);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
    loginById, // Legacy method
    ...auth,
  };
}
