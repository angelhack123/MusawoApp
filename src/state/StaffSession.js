// Doctor / facility-owner login. Token kept in the phone's encrypted store (expo-secure-store).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../api/client';
import { StaffAPI } from '../api/booking';
import { getPushToken } from '../utils/push';

const TOKEN_KEY = 'musawo_staff_token';
const StaffSessionContext = createContext(null);

// SecureStore isn't available on web previews; fall back to no persistence there
const store = {
  get: () => (Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(TOKEN_KEY).catch(() => null)),
  set: (v) => (Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(TOKEN_KEY, v).catch(() => {})),
  clear: () => (Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})),
};

export function StaffSessionProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState(null); // 'on' | 'denied' | 'unavailable'

  const clear = useCallback(async () => {
    setAuthToken(null);
    setProfile(null);
    await store.clear();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await StaffAPI.me();
      setProfile(me);
      return me;
    } catch (err) {
      if (err.status === 401 || err.status === 403) await clear(); // Token revoked or account removed
      return null;
    }
  }, [clear]);

  // Restore a saved login on app start
  useEffect(() => {
    (async () => {
      const token = await store.get();
      if (token) {
        setAuthToken(token);
        await refresh();
      }
      setLoading(false);
    })();
  }, [refresh]);

  // Once approved, register this phone for booking alerts
  useEffect(() => {
    if (!profile?.is_approved) return;
    getPushToken().then(async ({ token, reason }) => {
      if (token) {
        try { await StaffAPI.pushToken(token); setPushStatus('on'); } catch { setPushStatus('unavailable'); }
      } else {
        setPushStatus(reason);
      }
    });
  }, [profile?.is_approved, profile?.email]);

  const begin = useCallback(async ({ token, profile: p }) => {
    setAuthToken(token);
    await store.set(token);
    setProfile(p);
    return p;
  }, []);

  const login = useCallback(async (email, password) => begin(await StaffAPI.login(email.trim(), password)), [begin]);
  const register = useCallback(async (payload) => begin(await StaffAPI.register(payload)), [begin]);
  const logout = useCallback(async () => {
    try { await StaffAPI.logout(); } catch {}
    await clear();
  }, [clear]);

  const value = useMemo(
    () => ({ profile, loading, pushStatus, login, register, logout, refresh, signedIn: !!profile }),
    [profile, loading, pushStatus, login, register, logout, refresh]
  );
  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>;
}

export const useStaffSession = () => useContext(StaffSessionContext);
