import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Href, useRouter, useSegments } from 'expo-router';
import { useAppMode } from '../../contexts/AppContext';
import ConsumerTabLayout from '../../components/ConsumerTabLayout';
import BusinessTabLayout from '../../components/BusinessTabLayout';

export default function TabLayout() {
  const { mode, isLoading } = useAppMode();
  const router = useRouter();
  const segments = useSegments();

  console.log('🎯 TabLayout: Current state - mode:', mode, 'isLoading:', isLoading);

  // Navigate to correct default route when mode changes
  useEffect(() => {
    if (!isLoading) {
      const currentRoute = segments[segments.length - 1];
      console.log('🧭 TabLayout: Current route:', currentRoute, 'Mode:', mode, 'All segments:', segments);
      
      // Add a small delay to ensure everything is fully loaded
      const timeoutId = setTimeout(() => {
        if (mode === 'consumer') {
          // If we're in consumer mode but on a business route, redirect to consumer default
          if (currentRoute === 'hub' || currentRoute === 'sales' || currentRoute === 'money') {
            console.log('🔄 TabLayout: Redirecting from business route to consumer default');
            router.replace('/(tabs)/' as Href);
          } else if (currentRoute === '(tabs)' || !currentRoute) {
            // If we're at the root tab level, ensure we're on the consumer default
            console.log('🔄 TabLayout: Ensuring consumer default route');
            router.replace('/(tabs)/' as Href);
          }
        } else if (mode === 'business') {
          // If we're in business mode but on a consumer route, redirect to business default
          // @ts-expect-error
          if (currentRoute === 'index' || currentRoute === 'pay') {
            console.log('🔄 TabLayout: Redirecting from consumer route to business default');
            router.replace('/(tabs)/hub' as Href);
          } else if (currentRoute === '(tabs)' || !currentRoute) {
            // If we're at the root tab level, ensure we're on the business default
            console.log('🔄 TabLayout: Ensuring business default route');
            router.replace('/(tabs)/hub' as Href);
          }
        }
      }, 100); // Small delay to ensure everything is loaded
      
      return () => clearTimeout(timeoutId);
    }
  }, [mode, isLoading, segments, router]);

  // Show loading indicator while mode is being loaded from storage
  if (isLoading) {
    console.log('⏳ TabLayout: Showing loading indicator');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
        <ActivityIndicator size="large" color="#0C7C59" />
      </View>
    );
  }

  // Return completely different tab layouts based on mode
  // Using key prop to force re-render when mode changes
  if (mode === 'consumer') {
    console.log('👤 TabLayout: Rendering ConsumerTabLayout');
    return <ConsumerTabLayout key="consumer-tabs" />;
  } else {
    console.log('🏢 TabLayout: Rendering BusinessTabLayout');
    return <BusinessTabLayout key="business-tabs" />;
  }
}