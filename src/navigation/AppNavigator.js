// Root stack (detail screens) + bottom tabs with a raised centre "Feedback" action.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { useAppState } from '../state/AppState';
import { Txt } from '../components/ui';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import DoctorSearchScreen from '../screens/DoctorSearchScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import TrackScreen from '../screens/TrackScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import FacilitiesScreen from '../screens/FacilitiesScreen';
import FacilityProfileScreen from '../screens/FacilityProfileScreen';
import CompareFacilitiesScreen from '../screens/CompareFacilitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import InfoPageScreen from '../screens/InfoPageScreen';
import PatientRightsScreen from '../screens/PatientRightsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Verify: 'shield-checkmark',
  Track: 'receipt',
  Facilities: 'business',
};

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } };

const Empty = () => null;

function FeedbackTabButton({ onPress }) {
  const t = useAppState().t;
  return (
    <Pressable onPress={onPress} style={styles.fabWrap} accessibilityRole="button" accessibilityLabel={t('home.feedbackTitle')}>
      <View style={styles.fab}>
        <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />
      </View>
      <Txt variant="caption" color={colors.primaryDark} style={styles.fabLabel}>{t('tabs.feedback')}</Txt>
    </Pressable>
  );
}

function Tabs() {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarStyle: [styles.tabBar, { height: 66 + insets.bottom, paddingBottom: insets.bottom + 8 }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Verify" component={DoctorSearchScreen} options={{ title: t('tabs.verify') }} />
      <Tab.Screen
        name="FeedbackTab"
        component={Empty}
        options={{ title: t('tabs.feedback'), tabBarButton: (props) => <FeedbackTabButton onPress={props.onPress} /> }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Feedback'); },
        })}
      />
      <Tab.Screen name="Track" component={TrackScreen} options={{ title: t('tabs.track') }} />
      <Tab.Screen name="Facilities" component={FacilitiesScreen} options={{ title: t('tabs.facilities') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { ready, settings } = useAppState();
  const [splashDone, setSplashDone] = useState(false);

  // Brief brand moment; never longer than the 2s the spec allows
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !splashDone) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
        {!settings.onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
            <Stack.Screen name="FacilityProfile" component={FacilityProfileScreen} />
            <Stack.Screen name="CompareFacilities" component={CompareFacilitiesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="InfoPage" component={InfoPageScreen} />
            <Stack.Screen name="PatientRights" component={PatientRightsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { paddingTop: 8, borderTopWidth: 0, backgroundColor: colors.card, ...shadow.raised },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  fabWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
    ...shadow.raised,
  },
  fabLabel: { marginTop: 2, fontWeight: '700' },
});
