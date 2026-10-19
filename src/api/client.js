// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { API_URL } from '../config';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let deviceHash = null;

// SHA-256 of a random per-install id; the raw id never leaves the device (DPPA)
export const getDeviceHash = async () => {
  if (deviceHash) return deviceHash;
  let deviceId = await AsyncStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    await AsyncStorage.setItem('device_id', deviceId);
  }
  deviceHash = CryptoJS.SHA256(deviceId).toString();
  return deviceHash;
};

api.interceptors.request.use(async (config) => {
  try {
    const hash = await getDeviceHash();
    config.headers['X-Device-Token'] = hash;
  } catch {}
  return config;
});

// Normalise every failure to { message, code, status, offline }
const firstFieldError = (data) => {
  if (!data || typeof data !== 'object') return null;
  const value = Object.values(data)[0];
  const text = Array.isArray(value) ? value[0] : value;
  return typeof text === 'string' ? text.replace(/^[A-Z_]+: /, '') : null;
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    const offline = !err.response;
    const message =
      data?.error?.message || data?.detail || firstFieldError(data) ||
      (offline ? 'You appear to be offline' : err.message) || 'Network error';
    return Promise.reject({ message, code: data?.error?.code, status: err.response?.status, offline, data });
  }
);
