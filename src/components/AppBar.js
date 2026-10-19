// Dark teal app bar (UI Spec: Primary Dark) with soft decorative shapes for depth.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';
import { IconButton, Txt } from './ui';

export function Decor({ variant = 'default' }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, styles.blobA, variant === 'hero' && styles.blobAHero]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.ring, variant === 'hero' && styles.ringHero]} />
    </View>
  );
}

export default function AppBar({ title, subtitle, onBack, right, children, rounded = true, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.sm }, rounded && styles.rounded, style]}>
      <Decor />
      <View style={styles.row}>
        {onBack ? (
          <IconButton icon="arrow-back" onPress={onBack} label="Back" style={{ marginLeft: -8 }} />
        ) : null}
        <View style={{ flex: 1, marginLeft: onBack ? 4 : 0 }}>
          {title ? <Txt variant="h2" color={colors.white} numberOfLines={1} accessibilityRole="header">{title}</Txt> : null}
          {subtitle ? <Txt variant="label" color="rgba(255,255,255,0.8)" numberOfLines={1}>{subtitle}</Txt> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    overflow: 'hidden',
  },
  rounded: { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 220, height: 220, right: -70, top: -110, backgroundColor: colors.primary, opacity: 0.35 },
  blobAHero: { width: 320, height: 320, right: -120, top: -140, opacity: 0.45 },
  blobB: { width: 140, height: 140, left: -60, bottom: -80, backgroundColor: colors.primaryDeep, opacity: 0.6 },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 18, borderColor: 'rgba(255,255,255,0.05)', right: 40, bottom: -70 },
  ringHero: { width: 180, height: 180, borderRadius: 90, borderWidth: 26, right: -30, bottom: -60 },
});
