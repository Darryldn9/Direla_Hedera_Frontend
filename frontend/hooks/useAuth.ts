import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { api } from '../services/api';
import { User, CreateUserRequest } from '../types/api';

/**
 * Hook for user authentication operations
 */
export function useAuth() {
  const createUser = useApi<User>(api.auth.createUser.bind(api.auth));
  const getAllUsers = useApi<User[]>(api.auth.getAllUsers.bind(api.auth));
  const getUserById = useApi<User>(api.auth.getUserById.bind(api.auth));
  const updateUserBalance = useApi<User>(api.auth.updateUserBalance.bind(api.auth));
  const deleteUser = useApi<void>(api.auth.deleteUser.bind(api.auth));
  const userExists = useApi(api.auth.userExists.bind(api.auth));
  const getUserProfile = useApi<User>(api.auth.getUserProfile.bind(api.auth));
  const updateUserProfile = useApi<User>(api.auth.updateUserProfile.bind(api.auth));

  return {
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
  
  const auth = useAuth();

  const login = useCallback(async (userId: string) => {
    const user = await auth.getUserById.execute(userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    return user;
  }, [auth.getUserById]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (currentUser) {
      const user = await auth.getUserById.execute(currentUser.id);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [currentUser, auth.getUserById]);

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    ...auth,
  };
}
