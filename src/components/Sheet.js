// Bottom sheets: info explanations "(i)" (Mandate 2) and searchable dropdowns (US-1.5, US-2.2).
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { Button, IconCircle, Txt } from './ui';
import SearchInput from './SearchInput';

export function BottomSheet({ visible, onClose, children, title, fullHeight }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, fullHeight && styles.sheetTall, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Txt variant="h3" color={colors.primaryDark} style={{ flex: 1 }} accessibilityRole="header">{title}</Txt>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
                <Ionicons name="close" size={24} color={colors.neutral} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function InfoSheet({ visible, onClose, icon = 'information-circle', iconColor = colors.primary, iconBg = colors.primaryLight, title, children, closeLabel = 'OK' }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.xl }}>
        <View style={{ alignItems: 'center', marginBottom: space.lg }}>
          <IconCircle icon={icon} size={64} color={iconColor} bg={iconBg} />
          <Txt variant="h2" color={colors.primaryDark} style={{ marginTop: space.md, textAlign: 'center' }}>{title}</Txt>
        </View>
        {children}
        <Button title={closeLabel} onPress={onClose} size="lg" style={{ marginTop: space.xl }} />
      </ScrollView>
    </BottomSheet>
  );
}

// options: [{ value, label, sub?, group? }]; groups render as sticky section headers
export function SelectSheet({ visible, onClose, title, options, selected, onSelect, searchPlaceholder, allLabel }) {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = options.filter(o => !q || o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q));
    const groups = {};
    filtered.forEach(o => { (groups[o.group || ''] ||= []).push(o); });
    return Object.entries(groups).map(([group, data]) => ({ title: group, data }));
  }, [options, query]);

  const choose = (value) => { onSelect(value); setQuery(''); onClose(); };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} fullHeight>
      {searchPlaceholder ? (
        <SearchInput value={query} onChangeText={setQuery} placeholder={searchPlaceholder} style={{ marginHorizontal: space.lg, marginBottom: space.sm }} />
      ) : null}
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.value)}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        ListHeaderComponent={allLabel ? <Option label={allLabel} selected={!selected} onPress={() => choose(null)} /> : null}
        renderSectionHeader={({ section }) => section.title ? (
          <View style={styles.groupHeader}><Txt variant="caption" color={colors.primaryDark} style={{ fontWeight: '700' }}>{section.title.toUpperCase()}</Txt></View>
        ) : null}
        renderItem={({ item }) => (
          <Option label={item.label} sub={item.sub} selected={item.value === selected} onPress={() => choose(item.value)} />
        )}
      />
    </BottomSheet>
  );
}

function Option({ label, sub, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected }}
      android_ripple={{ color: colors.primaryLight }}
      style={[styles.option, selected && { backgroundColor: colors.primaryLight }]}
    >
      <View style={{ flex: 1 }}>
        <Txt variant="body" style={selected && { fontWeight: '700', color: colors.primaryDark }}>{label}</Txt>
        {sub ? <Txt variant="caption" color={colors.textSecondary}>{sub}</Txt> : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.sm,
    maxHeight: '88%',
  },
  sheetTall: { height: '80%' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, marginBottom: space.sm },
  close: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  groupHeader: { backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingVertical: 6 },
  option: { minHeight: touch.large, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm },
});
