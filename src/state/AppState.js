// App-wide settings + translation. Language changes apply immediately (US-5.2).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage, DEFAULT_SETTINGS } from '../utils/storage';
import en from '../i18n/en';
import lg from '../i18n/lg';

const DICTS = { en, lg };
const AppStateContext = createContext(null);

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), dict);

export function AppStateProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getSettings().then(s => { setSettings(s); setReady(true); });
  }, []);

  const updateSettings = useCallback(async (updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    // Keep onboarding/consent so a data reset doesn't re-run first-time setup
    setSettings(prev => {
      const next = { ...DEFAULT_SETTINGS, onboarded: prev.onboarded, consented: prev.consented };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  // t('home.greeting', { name }) — falls back to English until Luganda strings are supplied
  const t = useCallback((key, vars) => {
    let text = lookup(DICTS[settings.lang], key) ?? lookup(en, key) ?? key;
    if (vars && typeof text === 'string') {
      text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
    }
    return text;
  }, [settings.lang]);

  const value = useMemo(
    () => ({ settings, ready, updateSettings, resetSettings, t }),
    [settings, ready, updateSettings, resetSettings, t]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export const useAppState = () => useContext(AppStateContext);
export const useT = () => useContext(AppStateContext).t;
