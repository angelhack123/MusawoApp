// src/api/client.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://musawobackend1-production.up.railway.app/api';

const getBaseUrl = () => {
  // Use local Django server only when running in Android emulator during development
  if (__DEV__ && Platform.OS === 'android' && Constants.manifest?.debuggerHost) {
    return 'https://musawobackend1-production.up.railway.app/api';
  }
  return PRODUCTION_URL;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add device ID hash (per your data model)
api.interceptors.request.use(async (config) => {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const { default: CryptoJS } = await import('crypto-js');
    
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    // Hash per DPPA requirements
    const hash = CryptoJS.SHA256(deviceId).toString();
    config.headers['X-Device-Hash'] = hash;
  } catch {}
  return config;
});

// Response interceptor: Standardize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Network error';
    console.error('API Error:', message);
    return Promise.reject({ message, status: err.response?.status });
  }
);