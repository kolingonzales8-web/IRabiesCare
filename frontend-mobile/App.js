import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import useAuthStore from './src/store/authStore';
import useThemeStore from './src/store/themeStore';
import { navigationRef } from './src/navigation/navigationRef';
import usePushNotifications from './src/hooks/usePushNotifications';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const { loadAuth, user } = useAuthStore();
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    loadAuth();
    loadTheme();
  }, []);

  // Register for push notifications only when patient is logged in
  usePushNotifications(!!user);

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {splashDone && <AppNavigator />}
      </NavigationContainer>

      {!splashDone && (
        <SplashScreen
          duration={3000}
          onComplete={() => setSplashDone(true)}
        />
      )}
    </>
  );
}