import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import {
  User, Mail, Shield, LogOut, ChevronRight,
  FileText, Syringe, Lock, Info,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';

const MenuItem = ({ icon: Icon, label, sub, color = '#3b5998', onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: (danger ? '#fef2f2' : color + '18') }]}>
      <Icon color={danger ? '#ef4444' : color} size={19} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: '#ef4444' }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    <ChevronRight color={danger ? '#fecaca' : '#cbd5e1'} size={16} />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => { await logout(); navigation.replace('Login'); },
      },
    ]);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2d4a8a" />

      {/* Blue header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.roleChip}>
          <Shield color="#fff" size={12} />
          <Text style={styles.roleText}>Registered Patient</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Account info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <User color="#3b5998" size={16} />
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Mail color="#3b5998" size={16} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>
        </View>

        {/* Quick links */}
        <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon={FileText} label="My Cases"
            sub="View all registered exposure cases"
            onPress={() => navigation.getParent()?.navigate('Cases')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon={Syringe} label="Vaccination Schedule"
            sub="Check your PEP dose timeline"
            onPress={() => navigation.getParent()?.navigate('Schedule')}
          />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon={Lock} label="Change Password"
            sub="Update your account password"
            color="#8b5cf6"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon={Info} label="About iRabiesCare"
            sub="Rabies Prevention Program v1.0"
            color="#64748b"
            onPress={() => Alert.alert('iRabiesCare', 'Rabies Prevention & Case Management System\nDepartment of Health\nVersion 1.0')}
          />
        </View>

        <Text style={styles.sectionLabel}>SESSION</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={LogOut} label="Log Out" sub="Sign out of your account" danger onPress={handleLogout} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>iRabiesCare · Department of Health</Text>
          <Text style={styles.footerVersion}>Rabies Prevention Program v1.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: '#2d4a8a',
    alignItems: 'center',
    paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
  },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  userName:   { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 3 },
  userEmail:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  body: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  infoLabel: { fontSize: 12, color: '#64748b', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },

  menuCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 1 },
  menuSub:   { fontSize: 11, color: '#94a3b8' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 66 },

  footer:        { alignItems: 'center', marginTop: 8 },
  footerText:    { fontSize: 12, color: '#94a3b8', marginBottom: 3 },
  footerVersion: { fontSize: 11, color: '#cbd5e1' },
});