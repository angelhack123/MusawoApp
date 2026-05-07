import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import VerifyScreen from '../screens/VerifyScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import TrackScreen from '../screens/TrackScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Home: focused ? 'home' : 'home-outline',
              Verify: focused ? 'shield-checkmark' : 'shield-checkmark-outline',
              Feedback: focused ? 'chatbubble' : 'chatbubble-outline',
              Track: focused ? 'list' : 'list-outline',
              Settings: focused ? 'settings' : 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary.teal,
          tabBarInactiveTintColor: colors.neutral,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.gray[200],
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Verify" component={VerifyScreen} options={{ title: 'Verify' }} />
        <Tab.Screen name="Feedback" component={FeedbackScreen} />
        <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}