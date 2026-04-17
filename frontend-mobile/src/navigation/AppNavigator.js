import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import AddCaseScreen        from '../screens/AddCaseScreen';
import CaseDetail           from '../screens/CaseDetail';
import BottomTabNavigator   from './BottomTabNavigator';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChatScreen           from '../screens/ChatScreen';
import ResetPasswordScreen  from '../screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, logout } = useAuthStore();
  const intervalRef = useRef(null);
  const alertShownRef = useRef(false);

  useEffect(() => {
    // Only poll when logged in
    if (!token) {
      clearInterval(intervalRef.current);
      alertShownRef.current = false;
      return;
    }

    const checkAccountStatus = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const user = res.data?.user;

        if (user && user.isActive === false && !alertShownRef.current) {
          alertShownRef.current = true;
          clearInterval(intervalRef.current);

          Alert.alert(
            'Account Deactivated',
            'Your account has been deactivated by an administrator. You will be logged out.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await logout();
                },
              },
            ],
            { cancelable: false }
          );
        }
      } catch (err) {
        const message = err.response?.data?.message || '';
        // Also catch if middleware rejects deactivated token
        if (err.response?.status === 401 && message === 'Account is deactivated' && !alertShownRef.current) {
          alertShownRef.current = true;
          clearInterval(intervalRef.current);

          Alert.alert(
            'Account Deactivated',
            'Your account has been deactivated by an administrator. You will be logged out.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await logout();
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
    };

    // Check immediately then every 15 seconds
    checkAccountStatus();
    intervalRef.current = setInterval(checkAccountStatus, 15000);

    return () => clearInterval(intervalRef.current);
  }, [token]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Dashboard"  component={BottomTabNavigator} />
          <Stack.Screen name="AddCase"    component={AddCaseScreen} />
          <Stack.Screen name="CaseDetail" component={CaseDetail} />
          <Stack.Screen name="Chat"       component={ChatScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"          component={LoginScreen} />
          <Stack.Screen name="Register"       component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}