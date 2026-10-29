// Push notifications for staff (Firebase Cloud Messaging via expo-notifications).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme';

// Show alerts while the app is open too
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Must match the channel_id the backend sends on (musawo/push.py)
export const BOOKING_CHANNEL = 'bookings';

const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(BOOKING_CHANNEL, {
    name: 'Bookings',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.primary,
  });
};

// { token } on success; { token: null, reason: 'denied' | 'unavailable' } otherwise.
// 'unavailable' covers builds without Firebase (google-services.json) and web.
export const getPushToken = async () => {
  if (Platform.OS === 'web') return { token: null, reason: 'unavailable' };
  try {
    await ensureChannel();
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return { token: null, reason: 'denied' };
    const { data } = await Notifications.getDevicePushTokenAsync();
    return { token: data };
  } catch {
    return { token: null, reason: 'unavailable' };
  }
};

export { Notifications };
