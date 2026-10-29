// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from './src/state/AppState';
import { StaffSessionProvider } from './src/state/StaffSession';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StaffSessionProvider>
          {/* Headers are dark teal throughout, so light status bar content */}
          <StatusBar style="light" />
          <AppNavigator />
        </StaffSessionProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
