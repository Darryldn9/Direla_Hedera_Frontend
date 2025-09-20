import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserManagement } from '../hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserManagement();

  useEffect(() => {
    console.log('🏠 IndexScreen - Auth state:', { isAuthenticated, isLoading });
    // Wait for auth state to load before redirecting
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('✅ User is authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ User is not authenticated, redirecting to login');
        router.replace('/login');
      }
    } else {
      console.log('⏳ Still loading auth state...');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while determining authentication status
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
      <ActivityIndicator size="large" color="#0C7C59" />
    </View>
  );
}
