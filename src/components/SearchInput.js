// Outlined 56dp input with search icon and clear button (UI Spec 2.4, SCR-004).
import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { Txt } from './ui';

const SearchInput = forwardRef(function SearchInput(
  { value, onChangeText, placeholder, icon = 'search', error, onClear, style, ...rest }, ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <View style={[styles.box, focused && styles.focused, error && styles.error]}>
        <Ionicons name={icon} size={22} color={focused ? colors.primary : colors.neutral} />
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={placeholder}
          {...rest}
        />
        {value ? (
          <Pressable
            onPress={() => { onChangeText(''); onClear?.(); }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear"
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={22} color={colors.neutral} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Txt variant="caption" color={colors.dangerText} style={styles.errorText}>{error}</Txt> : null}
    </View>
  );
});

export default SearchInput;

const styles = StyleSheet.create({
  box: {
    height: touch.large,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
  },
  focused: { borderWidth: 2, borderColor: colors.primary },
  error: { borderWidth: 2, borderColor: colors.danger },
  input: { flex: 1, fontSize: 16, color: colors.text, marginLeft: space.sm, paddingVertical: 0 },
  clear: { padding: 4 },
  errorText: { marginTop: 6, marginLeft: 4 },
});
