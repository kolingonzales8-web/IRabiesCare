import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen       from '../screens/LoginScreen';
import RegisterScreen    from '../screens/RegisterScreen';
import AddCaseScreen     from '../screens/AddCaseScreen';
import CaseDetail        from '../screens/CaseDetail';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth screens */}
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Main app — bottom tabs */}
      <Stack.Screen name="Dashboard" component={BottomTabNavigator} />

      {/* Screens that push on top of tabs */}
      <Stack.Screen name="AddCase"    component={AddCaseScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetail} />
    </Stack.Navigator>
  );
}