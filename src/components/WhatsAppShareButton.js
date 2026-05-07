import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { shareViaWhatsApp } from '../utils/share';

export default function WhatsAppShareButton({ doctor, style, size = 'medium' }) {
  const isLarge = size === 'large';
  
  return (
    <TouchableOpacity
      style={[styles.button, isLarge && styles.buttonLarge, style]}
      onPress={() => shareViaWhatsApp(doctor)}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {/* WhatsApp Icon using Ionicons */}
        <Ionicons 
          name="logo-whatsapp" 
          size={isLarge ? 24 : 20} 
          color="#fff" 
        />
      </View>
      <Text style={[styles.text, isLarge && styles.textLarge]}>
        Share via WhatsApp
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366', // WhatsApp green
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44, // Minimum touch target
  },
  buttonLarge: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
});