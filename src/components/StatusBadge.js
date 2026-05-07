import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const STATUS_CONFIG = {
  ACTIVE: { bg: colors.success, icon: 'checkmark-circle', label: 'ACTIVE' },
  SUSPENDED: { bg: colors.danger, icon: 'warning', label: 'SUSPENDED' },
  EXPIRED: { bg: colors.warning, icon: 'time', label: 'EXPIRED', textColor: '#422006' },
  NOT_FOUND: { bg: colors.neutral, icon: 'help-circle', label: 'NOT FOUND' },
};

export default function StatusBadge({ status, onPress, size = 'small' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_FOUND;
  const isLarge = size === 'large';
  
  return (
    <TouchableOpacity 
      style={[styles.badge, { backgroundColor: config.bg }, isLarge && styles.badgeLarge]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={config.icon} 
        size={isLarge ? 20 : 12} 
        color={config.textColor || '#fff'} 
      />
      <Text style={[styles.text, { color: config.textColor || '#fff' }, isLarge && styles.textLarge]}>
        {config.label.replace('_', ' ')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 28,
    minWidth: 44,
    justifyContent: 'center',
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 80,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  textLarge: {
    fontSize: 12,
    marginLeft: 6,
  },
});