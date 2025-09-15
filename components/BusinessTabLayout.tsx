import { Tabs } from 'expo-router';
import { Building2, BarChart3, Banknote, Users, Settings } from 'lucide-react-native';

export default function BusinessTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0C7C59',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingTop: 8,
          paddingBottom: 0,
          height: 77,
          marginBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Hub',
          tabBarIcon: ({ size, color }) => (
            <Building2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: 'Money',
          tabBarIcon: ({ size, color }) => (
            <Banknote size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lending"
        options={{
          title: 'Lending',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />

      {/* Hide all consumer and unused tabs */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="pay" options={{ href: null }} />
      <Tabs.Screen name="merchant" options={{ href: null }} />
    </Tabs>
  );
}
