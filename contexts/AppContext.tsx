import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'consumer' | 'business';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_MODE_KEY = '@direla_app_mode';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('consumer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(APP_MODE_KEY);
      if (savedMode && (savedMode === 'consumer' || savedMode === 'business')) {
        setModeState(savedMode as AppMode);
      }
    } catch (error) {
      console.error('Error loading app mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: AppMode) => {
    try {
      await AsyncStorage.setItem(APP_MODE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Error saving app mode:', error);
    }
  };

  return (
    <AppContext.Provider value={{ mode, setMode, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppProvider');
  }
  return context;
}
