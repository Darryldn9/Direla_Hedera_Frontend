import React from 'react';
import { useAppMode } from '../../contexts/AppContext';
import ConsumerTabLayout from '../../components/ConsumerTabLayout';
import BusinessTabLayout from '../../components/BusinessTabLayout';

export default function TabLayout() {
  const { mode } = useAppMode();

  // Return completely different tab layouts based on mode
  if (mode === 'consumer') {
    return <ConsumerTabLayout />;
  } else {
    return <BusinessTabLayout />;
  }
}