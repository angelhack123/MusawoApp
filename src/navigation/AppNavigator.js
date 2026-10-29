// Root stack (detail screens) + bottom tabs with a raised centre "Feedback" action.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { useAppState } from '../state/AppState';
import { Txt } from '../components/ui';
import { useStaffSession } from '../state/StaffSession';
import { Notifications } from '../utils/push';

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
import BookSearchScreen from '../screens/BookSearchScreen';
import BookDoctorScreen from '../screens/BookDoctorScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import BookingDoneScreen from '../screens/BookingDoneScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import StaffAuthScreen from '../screens/StaffAuthScreen';
import StaffHomeScreen from '../screens/StaffHomeScreen';
import DoctorBookingScreen from '../screens/DoctorBookingScreen';
import AvailabilityScreen from '../screens/AvailabilityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OwnerFacilityScreen from '../screens/OwnerFacilityScreen';
import OwnerFacilityFormScreen from '../screens/OwnerFacilityFormScreen';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Verify: 'shield-checkmark',
  Book: 'calendar',
  Track: 'receipt',
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
      <Tab.Screen name="Book" component={BookSearchScreen} options={{ title: t('tabs.book') }} />
      <Tab.Screen name="Track" component={TrackScreen} options={{ title: t('tabs.track') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { ready, settings } = useAppState();
  const staff = useStaffSession();
  const [splashDone, setSplashDone] = useState(false);
  const pendingOpen = useRef(null);

  // Tapping a booking push opens that booking (also when it launched the app)
  useEffect(() => {
    const open = (response) => {
      const bookingId = response?.notification?.request?.content?.data?.booking_id;
      if (!bookingId) return;
      if (navigationRef.isReady()) navigationRef.navigate('DoctorBooking', { id: bookingId });
      else pendingOpen.current = bookingId;
    };
    Notifications.getLastNotificationResponseAsync?.().then(open).catch(() => {});
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    // A push while the app is open: refresh the unread badge
    const received = Notifications.addNotificationReceivedListener(() => staff.refresh());
    return () => { tapped.remove(); received.remove(); };
  }, [staff.refresh]);

  // Brief brand moment; never longer than the 2s the spec allows
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !splashDone || staff.loading) return <SplashScreen />;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        if (pendingOpen.current) navigationRef.navigate('DoctorBooking', { id: pendingOpen.current });
        pendingOpen.current = null;
      }}
    >
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
            <Stack.Screen name="Facilities" component={FacilitiesScreen} />
            <Stack.Screen name="BookDoctor" component={BookDoctorScreen} />
            <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
            <Stack.Screen name="BookingDone" component={BookingDoneScreen} options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="StaffAuth" component={StaffAuthScreen} />
            <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
            <Stack.Screen name="DoctorBooking" component={DoctorBookingScreen} />
            <Stack.Screen name="Availability" component={AvailabilityScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="OwnerFacility" component={OwnerFacilityScreen} />
            <Stack.Screen name="OwnerFacilityForm" component={OwnerFacilityFormScreen} />
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
