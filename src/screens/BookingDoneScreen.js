// Patient: request sent — show the booking reference and what happens next.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, space } from '../theme';
import { useAppState } from '../state/AppState';
import { formatSlot } from '../utils/format';
import { BookingStatusPill } from '../components/BookingParts';
import { Button, Card, Txt } from '../components/ui';

export default function BookingDoneScreen({ navigation, route }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const { booking } = route.params;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
  }, [pop]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.body, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
      <Animated.View style={[styles.icon, { transform: [{ scale: pop }] }]}>
        <Ionicons name="paper-plane" size={52} color={colors.white} />
      </Animated.View>
      <Txt variant="h1" color={colors.primaryDark} style={styles.center} accessibilityRole="header">{t('book.sentTitle')}</Txt>
      <Txt variant="bodyLg" color={colors.textSecondary} style={[styles.center, { marginTop: space.sm }]}>
        {t('book.sentBody', { doctor: booking.doctor.full_name })}
      </Txt>

      <Card style={styles.refCard}>
        <Txt variant="label" color={colors.textSecondary}>{t('book.reference')}</Txt>
        <Txt style={styles.ref} selectable>{booking.reference}</Txt>
        <BookingStatusPill status={booking.status} />
        <Txt variant="body" style={{ marginTop: space.md, textAlign: 'center', fontWeight: '600' }}>
          {booking.facility.name}{'\n'}{formatSlot(booking.start_at)}
        </Txt>
      </Card>

      <Card style={styles.next}>
        {['review', 'confirm', 'arrive'].map((key, i) => (
          <View key={key} style={styles.nextRow}>
            <View style={styles.num}><Txt variant="label" color={colors.white} style={{ fontWeight: '700' }}>{i + 1}</Txt></View>
            <Txt variant="body" style={{ flex: 1 }}>{t(`book.next.${key}`)}</Txt>
          </View>
        ))}
      </Card>

      <Button title={t('book.myBookings')} icon="calendar" variant="secondary" size="lg" onPress={() => navigation.replace('MyBookings')} style={styles.full} />
      <Button title={t('feedback.returnHome')} icon="home" size="lg" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} style={styles.full} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { alignItems: 'center', paddingHorizontal: space.lg },
  icon: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: space.xl, ...shadow.raised },
  center: { textAlign: 'center' },
  refCard: { alignSelf: 'stretch', alignItems: 'center', marginTop: space.xl, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  ref: { fontSize: 28, fontWeight: '800', color: colors.primaryDark, letterSpacing: 2, marginVertical: space.sm,
    fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo' }) },
  next: { alignSelf: 'stretch', marginTop: space.lg, backgroundColor: colors.primaryLight },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  full: { alignSelf: 'stretch', marginTop: space.md },
});
