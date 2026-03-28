import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import AddCaseScreen        from '../screens/AddCaseScreen';
import CaseDetail           from '../screens/CaseDetail';
import BottomTabNavigator   from './BottomTabNavigator';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChatScreen           from '../screens/ChatScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token } = useAuthStore();

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
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}