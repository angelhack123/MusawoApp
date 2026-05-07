import { Linking, Platform, Alert } from 'react-native';

export const shareViaWhatsApp = async (doctor) => {
  const statusText = doctor.status === 'ACTIVE' 
    ? 'LICENSED & ACTIVE ✓' 
    : doctor.status.replace('_', ' ').toUpperCase();
    
  const message = `👨‍⚕️ Dr. ${doctor.full_name} (${doctor.registration_number}) is ${statusText} — Verified on Musawo app`;
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // WhatsApp URL schemes
  const whatsappUrl = Platform.select({
    ios: `whatsapp://send?text=${encodedMessage}`,
    android: `https://wa.me/?text=${encodedMessage}`,
    default: `https://web.whatsapp.com/send?text=${encodedMessage}`,
  });

  try {
    // Check if WhatsApp is installed
    const supported = await Linking.canOpenURL(whatsappUrl);
    
    if (supported) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback: copy to clipboard + alert
      await Clipboard.setStringAsync(message);
      Alert.alert(
        'WhatsApp Not Found',
        'Message copied to clipboard. Please paste it in WhatsApp manually.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    // Final fallback: copy to clipboard
    try {
      await Clipboard.setStringAsync(message);
      Alert.alert('Copied', 'Verification details copied to clipboard');
    } catch {}
  }
};