// Staff inbox: every booking alert, also delivered as a phone push when Firebase is set up.
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, space } from '../theme';
import { useAppState } from '../state/AppState';
import { useStaffSession } from '../state/StaffSession';
import { StaffAPI } from '../api/booking';
import { formatDateTime } from '../utils/format';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { Card, IconCircle, Txt } from '../components/ui';

const ICONS = {
  BOOKING_REQUESTED: 'calendar',
  BOOKING_CANCELLED: 'close-circle',
  FACILITY_LINKED: 'business',
  ACCOUNT_APPROVED: 'shield-checkmark',
};

export default function NotificationsScreen({ navigation }) {
  const t = useAppState().t;
  const { refresh } = useStaffSession();
  const [items, setItems] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await StaffAPI.notifications();
      setItems(res.items);
      if (res.items.some(n => !n.is_read)) {
        await StaffAPI.markRead();  // Opening the inbox counts as reading it
        refresh();
      }
    } catch {
      setItems(prev => prev || []);
    }
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <AppBar title={t('staff.notifications')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[colors.primary]} />}
      >
        {!items ? <SkeletonList count={3} /> : items.length === 0 ? (
          <EmptyState icon="notifications-off" title={t('staff.noNotifications')} />
        ) : items.map(n => (
          <Card key={n.id} style={[styles.item, !n.is_read && styles.unread]}
            onPress={n.booking_id ? () => navigation.navigate('DoctorBooking', { id: n.booking_id }) : undefined}>
            <IconCircle icon={ICONS[n.kind] || 'notifications'} size={40} />
            <View style={{ flex: 1, marginLeft: space.md }}>
              <Txt variant="body" style={{ fontWeight: n.is_read ? '600' : '800' }}>{n.title}</Txt>
              <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }}>{n.body}</Txt>
              <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>{formatDateTime(n.created_at)}</Txt>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
});
