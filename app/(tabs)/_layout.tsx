import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { session } from '@/services/session';

const PRIMARY = '#1abc9c';
const INACTIVE = '#95a5a6';

export default function TabLayout() {
  if (!session.getUser()) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={focused ? PRIMARY : INACTIVE} />
          ),
        }}
      />
      <Tabs.Screen
        name="house"
        options={{
          title: 'Casa',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons name="office-building-outline" size={size} color={focused ? PRIMARY : INACTIVE} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={focused ? PRIMARY : INACTIVE} />
          ),
        }}
      />
    </Tabs>
  );
}
