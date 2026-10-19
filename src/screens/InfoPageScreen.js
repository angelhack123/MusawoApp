// About / Privacy / Terms / Contact pages (SCR-013 menu). Rendered in-app; no webview dependency.
import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { useAppState } from '../state/AppState';
import { APP_VERSION, SUPPORT_CONTACT } from '../config';
import AppBar from '../components/AppBar';
import { Banner, Button, Card, IconCircle, Txt } from '../components/ui';

const ICONS = { about: 'information-circle', privacy: 'shield', terms: 'document-text', contact: 'mail' };

export default function InfoPageScreen({ navigation, route }) {
  const t = useAppState().t;
  const { page } = route.params;
  const sections = t(`info.${page}.sections`);

  return (
    <View style={styles.container}>
      <AppBar title={t(`info.${page}.title`)} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
        <View style={{ alignItems: 'center', marginBottom: space.lg }}>
          <IconCircle icon={ICONS[page]} size={72} />
          {page === 'about' ? <Txt variant="label" color={colors.textSecondary} style={{ marginTop: space.sm }}>Musawo v{APP_VERSION}</Txt> : null}
        </View>

        {t(`info.${page}.draft`) !== `info.${page}.draft` ? (
          <Banner tone="warning" text={t(`info.${page}.draft`)} style={{ marginBottom: space.lg }} />
        ) : null}

        {Array.isArray(sections) && sections.map(([heading, body]) => (
          <Card key={heading} style={{ marginBottom: space.md }}>
            <Txt variant="h3" color={colors.primaryDark}>{heading}</Txt>
            <Txt variant="body" color={colors.text} style={{ marginTop: space.sm }}>{body}</Txt>
          </Card>
        ))}

        {page === 'contact' && (
          <Card>
            <Txt variant="h3" color={colors.primaryDark}>{SUPPORT_CONTACT.organisation}</Txt>
            {SUPPORT_CONTACT.email ? (
              <View style={styles.contactRow}>
                <Txt variant="body" selectable style={{ flex: 1 }}>{SUPPORT_CONTACT.email}</Txt>
                <Button variant="text" title={t('info.contact.email')} onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`)} />
              </View>
            ) : null}
            {SUPPORT_CONTACT.phone ? (
              <View style={styles.contactRow}>
                <Txt variant="body" selectable style={{ flex: 1 }}>{SUPPORT_CONTACT.phone}</Txt>
                <Button variant="text" title={t('info.contact.call')} onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`)} />
              </View>
            ) : null}
            {!SUPPORT_CONTACT.email && !SUPPORT_CONTACT.phone ? (
              <Txt variant="body" color={colors.textSecondary} style={{ marginTop: space.sm }}>{t('info.contact.pending')}</Txt>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
});
