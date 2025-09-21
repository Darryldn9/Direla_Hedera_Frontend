import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountProvider } from './AccountContext';

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
      console.log('🔍 AppContext: Loading saved mode from storage:', savedMode);
      if (savedMode && (savedMode === 'consumer' || savedMode === 'business')) {
        console.log('✅ AppContext: Setting mode to:', savedMode);
        setModeState(savedMode as AppMode);
      } else {
        console.log('📱 AppContext: No saved mode found, using default: consumer');
      }
    } catch (error) {
      console.error('❌ AppContext: Error loading app mode:', error);
    } finally {
      console.log('🏁 AppContext: Finished loading, isLoading = false');
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: AppMode) => {
    try {
      console.log('💾 AppContext: Saving new mode to storage:', newMode);
      await AsyncStorage.setItem(APP_MODE_KEY, newMode);
      console.log('🔄 AppContext: Updating state to:', newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('❌ AppContext: Error saving app mode:', error);
    }
  };

  return (
    <AppContext.Provider value={{ mode, setMode, isLoading }}>
      <AccountProvider>
        {children}
      </AccountProvider>
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
