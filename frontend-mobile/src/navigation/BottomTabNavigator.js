import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, FileText, User } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import ScheduleScreen  from '../screens/ScheduleScreen';
import CasesScreen     from '../screens/CasesScreen';
import ProfileScreen   from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon: Icon, label, focused }) => (
  <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
    <Icon color={focused ? '#2d4a8a' : '#94a3b8'} size={21} />
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabStyles.bar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Calendar} label="Schedule" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cases"
        component={CasesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={FileText} label="Cases" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    height: 68,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  wrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 10, paddingBottom: 6,
    width: 70, gap: 3,
  },
  wrapActive: {},
  label:       { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  labelActive: { color: '#2d4a8a', fontWeight: '700' },
});