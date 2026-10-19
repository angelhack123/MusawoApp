// Share a verification result (US-1.6): WhatsApp first, native share sheet as fallback.
import { Linking, Share } from 'react-native';
import { withTitle } from './format';

const STATUS_TEXT = {
  ACTIVE: 'LICENSED & ACTIVE ✓',
  SUSPENDED: 'SUSPENDED ⚠',
  EXPIRED: 'LICENSE EXPIRED',
  DECEASED: 'DECEASED',
};

// e.g. "Dr. John Mukasa (MDC/12345) is LICENSED & ACTIVE ✓ — Verified on Musawo app"
export const verificationMessage = (doctor) =>
  `${withTitle(doctor.full_name)} (${doctor.registration_number}) is ${STATUS_TEXT[doctor.status] || doctor.status} — Verified on Musawo app`;

export const shareDoctor = async (doctor) => {
  try {
    await Share.share({ message: verificationMessage(doctor) });
  } catch {}
};

export const shareDoctorWhatsApp = async (doctor) => {
  const url = `whatsapp://send?text=${encodeURIComponent(verificationMessage(doctor))}`;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }
  } catch {}
  await shareDoctor(doctor);
};
