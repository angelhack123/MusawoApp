// Core building blocks (UI Spec Part 2: buttons, cards, chips). 48dp minimum touch targets.
import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, touch, type } from '../theme';
import { initials } from '../utils/format';

export function Txt({ variant = 'body', color = colors.text, style, children, ...rest }) {
  return <Text style={[type[variant], { color }, style]} {...rest}>{children}</Text>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Springy press feedback shared by buttons and tappable cards.
// Style sits on the pressable itself so layout props (flex, margins) apply to it.
export function PressableScale({ onPress, disabled, style, children, scaleTo = 0.97, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      android_ripple={{ color: 'rgba(13,148,136,0.12)' }}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.card, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.dangerBg, fg: colors.dangerText, border: '#FCA5A5' },
  whatsapp: { bg: colors.whatsapp, fg: colors.white, border: colors.whatsapp },
  light: { bg: 'rgba(255,255,255,0.16)', fg: colors.white, border: 'rgba(255,255,255,0.35)' },
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, size = 'md', style, accessibilityHint }) {
  if (variant === 'text') {
    return (
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button"
        style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.6 }, style]}>
        {icon && <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: 6 }} />}
        <Txt variant="label" color={disabled ? colors.placeholder : colors.primary} style={styles.textBtnLabel}>{title}</Txt>
      </Pressable>
    );
  }
  const v = BUTTON_VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      accessibilityHint={accessibilityHint}
      style={[
        styles.btn,
        size === 'lg' && styles.btnLg,
        { backgroundColor: v.bg, borderColor: v.border },
        inactive && variant === 'primary' && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'lg' ? 22 : 20} color={v.fg} style={{ marginRight: 8 }} />}
          <Txt variant="label" color={v.fg} style={[styles.btnLabel, size === 'lg' && { fontSize: 16 }]}>{title}</Txt>
        </>
      )}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, color = colors.white, bg = 'transparent', size = 24, label, style, badge }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg }, pressed && { opacity: 0.6 }, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge ? <View style={styles.iconBadge} /> : null}
    </Pressable>
  );
}

export function Card({ children, style, onPress, accent, accessibilityLabel }) {
  const content = [styles.card, accent && { borderLeftWidth: 4, borderLeftColor: accent }, style];
  if (!onPress) return <View style={content}>{children}</View>;
  return (
    <PressableScale onPress={onPress} style={content} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {children}
    </PressableScale>
  );
}

export function Chip({ label, selected, onPress, icon, style, onRemove }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.75 }, style]}
    >
      {icon && <Ionicons name={icon} size={16} color={selected ? colors.white : colors.primary} style={{ marginRight: 6 }} />}
      <Txt variant="label" color={selected ? colors.white : colors.primaryDark} numberOfLines={1}>{label}</Txt>
      {onRemove && (
        <Ionicons name="close" size={16} color={selected ? colors.white : colors.neutral} style={{ marginLeft: 6 }} onPress={onRemove} />
      )}
    </Pressable>
  );
}

const BANNER_TONES = {
  info: { bg: colors.primaryLight, fg: colors.primaryDark, icon: 'information-circle' },
  warning: { bg: colors.warningBg, fg: colors.warningText, icon: 'warning' },
  danger: { bg: colors.dangerBg, fg: colors.dangerText, icon: 'alert-circle' },
  success: { bg: colors.successBg, fg: colors.successText, icon: 'checkmark-circle' },
  offline: { bg: colors.neutralBg, fg: colors.neutralText, icon: 'cloud-offline' },
};

export function Banner({ tone = 'info', icon, title, text, style, onPress }) {
  const t = BANNER_TONES[tone];
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.banner, { backgroundColor: t.bg }, style]}>
      <Ionicons name={icon || t.icon} size={22} color={t.fg} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        {title ? <Txt variant="label" color={t.fg} style={{ fontWeight: '700' }}>{title}</Txt> : null}
        {text ? <Txt variant="label" color={t.fg} style={{ fontWeight: '400' }}>{text}</Txt> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={t.fg} />}
    </Wrapper>
  );
}

export function SectionTitle({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.sectionTitle, style]}>
      <Txt variant="h3" color={colors.primaryDark}>{title}</Txt>
      {actionLabel ? <Button variant="text" title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

// Label/value row used in detail cards
export function InfoRow({ icon, label, value, valueColor = colors.text, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      {icon ? (
        <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant="caption" color={colors.textSecondary}>{label}</Txt>
        <Txt variant="body" color={valueColor} style={{ fontWeight: '600', marginTop: 2 }}>{value}</Txt>
      </View>
    </View>
  );
}

export function Avatar({ name, photoUrl, size = 56, color = colors.primary, bg = colors.primaryLight }) {
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }} />;
  }
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Txt style={{ fontSize: size * 0.36, fontWeight: '700' }} color={color}>{initials(name) || '?'}</Txt>
    </View>
  );
}

// Segmented progress bar for multi-step flows (Mandate 2: progress visibility)
export function ProgressSegments({ total, current, style, light }) {
  return (
    <View style={[styles.segments, style]} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: light ? 'rgba(255,255,255,0.25)' : colors.border },
            i < current && { backgroundColor: light ? colors.white : colors.primary },
          ]}
        />
      ))}
    </View>
  );
}

export function IconCircle({ icon, size = 48, color = colors.primary, bg = colors.primaryLight, iconSize }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={iconSize || size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: touch.min,
    minWidth: 120,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLg: { minHeight: touch.large, borderRadius: radius.md },
  btnDisabled: { backgroundColor: '#A7C9C5', borderColor: '#A7C9C5' },
  btnLabel: { fontWeight: '700', letterSpacing: 0.2 },
  textBtn: { minHeight: touch.min, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
  textBtnLabel: { textDecorationLine: 'underline', fontWeight: '600' },
  iconBtn: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.primaryDark },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, ...shadow.card },
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: space.md, borderRadius: radius.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  infoRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
