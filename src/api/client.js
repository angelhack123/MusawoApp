// src/api/client.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detect correct backend URL based on environment
const getBaseUrl = () => {
  if (Constants.manifest?.debuggerHost?.includes('localhost')) {
    return 'http://localhost:8000/api'; // Web browser
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'; // Android Emulator
  }
  // Physical devices & iOS simulator: use LAN IP
  // Replace with your PC's IP or use a .env file
  return 'http://192.168.5.82:8000/api';
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