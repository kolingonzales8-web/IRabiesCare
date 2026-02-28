import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <NavigationContainer>
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