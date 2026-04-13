import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, Modal,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  User, Mail, Shield, LogOut, ChevronRight,
  FileText, Syringe, Lock, Info, Eye, EyeOff, X,
  Moon, Sun,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useColors } from '../theme/colors';
import apiClient from '../api/client';

/* ── Menu Item ── */
const MenuItem = memo(({ icon: Icon, label, sub, color = '#1565C0', onPress, danger, colors }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? '#fef2f2' : color + '18' }]}>
      <Icon color={danger ? '#ef4444' : color} size={19} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, { color: colors.text }, danger && { color: '#ef4444' }]}>{label}</Text>
      {sub && <Text style={[styles.menuSub, { color: colors.subText }]}>{sub}</Text>}
    </View>
    <ChevronRight color={danger ? '#fecaca' : colors.border} size={16} />
  </TouchableOpacity>
));

/* ── Individual Password Field Component (Memoized) ── */
const PasswordField = memo(({ 
  label, 
  value, 
  onChangeText, 
  showPassword, 
  onToggleShow,
  onSubmitEditing,
  returnKeyType,
  inputRef,
  colors,
  loading 
}) => {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.subText }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.subText}
          autoCapitalize="none"
          editable={!loading}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          onPress={onToggleShow} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}>
          {showPassword ? <EyeOff color={colors.subText} size={18} /> : <Eye color={colors.subText} size={18} />}
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ── Change Password Modal ── */
const ChangePasswordModal = memo(({ visible, onClose, colors }) => {
  // Separate state for each field to avoid re-rendering all fields on every keystroke
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs for input fields
  const currentRef = useRef(null);
  const newRef = useRef(null);
  const confirmRef = useRef(null);

  const reset = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = useCallback(async () => {
    setError('');
    
    if (!currentPassword) {
      setError('Please enter your current password.');
      currentRef.current?.focus();
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      newRef.current?.focus();
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      newRef.current?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      confirmRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      reset();
      onClose();
      Alert.alert('Success', 'Your password has been updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, reset, onClose]);

  const handleCurrentSubmit = useCallback(() => {
    newRef.current?.focus();
  }, []);

  const handleNewSubmit = useCallback(() => {
    confirmRef.current?.focus();
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Memoized callbacks for password changes
  const onCurrentChange = useCallback((text) => {
    setCurrentPassword(text);
  }, []);

  const onNewChange = useCallback((text) => {
    setNewPassword(text);
  }, []);

  const onConfirmChange = useCallback((text) => {
    setConfirmPassword(text);
  }, []);

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={handleClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              <Text style={[styles.modalSub, { color: colors.subText }]}>Enter your current and new password</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.bg }]}>
              <X color={colors.subText} size={18} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChangeText={onCurrentChange}
            showPassword={showCurrent}
            onToggleShow={() => setShowCurrent(prev => !prev)}
            onSubmitEditing={handleCurrentSubmit}
            returnKeyType="next"
            inputRef={currentRef}
            colors={colors}
            loading={loading}
          />
          
          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={onNewChange}
            showPassword={showNew}
            onToggleShow={() => setShowNew(prev => !prev)}
            onSubmitEditing={handleNewSubmit}
            returnKeyType="next"
            inputRef={newRef}
            colors={colors}
            loading={loading}
          />
          
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={onConfirmChange}
            showPassword={showConfirm}
            onToggleShow={() => setShowConfirm(prev => !prev)}
            onSubmitEditing={handleConfirmSubmit}
            returnKeyType="done"
            inputRef={confirmRef}
            colors={colors}
            loading={loading}
          />

          {newPassword && confirmPassword ? (
            <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#16a34a' : '#dc2626' }]}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.subText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

/* ── Main Screen ── */
export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { dark, toggleTheme } = useThemeStore();
  const colors = useColors(dark);
  const [changePassVisible, setChangePassVisible] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleChangePassword = useCallback(() => {
    setChangePassVisible(true);
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert('iRabiesCare', 'Rabies Prevention & Case Management System\nDepartment of Health\nVersion 1.0');
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      <ChangePasswordModal
        visible={changePassVisible}
        onClose={() => setChangePassVisible(false)}
        colors={colors}
      />

      {/* Blue header */}
     <View style={[styles.header, { backgroundColor: colors.header }]}>
  <Svg
    width={200} height={210}
    viewBox="0 0 100 100"
    style={{ position: 'absolute', top: 0, right: 0 }}
  >
    <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.22)" />
    <Path d="M50 33 L50 70 M32 52 L68 52" fill="none" stroke="rgba(0,188,212,0.15)" strokeWidth={5} strokeLinecap="round" />
  </Svg>
  <Svg
    width={120} height={120}
    viewBox="0 0 100 100"
    style={{ position: 'absolute', bottom: 0, left: 0 }}
  >
    <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.15)" />
  </Svg>
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

      <ScrollView 
        contentContainerStyle={styles.body} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        {/* Account info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <User color={colors.accent} size={16} />
            <Text style={[styles.infoLabel, { color: colors.subText }]}>Full Name</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.name || '—'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Mail color={colors.accent} size={16} />
            <Text style={[styles.infoLabel, { color: colors.subText }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || '—'}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.subText }]}>QUICK ACCESS</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem colors={colors} icon={FileText} label="My Cases" sub="View all registered exposure cases" onPress={() => navigation.navigate('Cases')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem colors={colors} icon={Syringe} label="Vaccination Schedule" sub="Check your PEP dose timeline" onPress={() => navigation.navigate('Schedule')} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.subText }]}>APPEARANCE</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem
            colors={colors}
            icon={dark ? Sun : Moon}
            label={dark ? 'Light Mode' : 'Night Mode'}
            sub={dark ? 'Switch to light theme' : 'Switch to dark blue theme'}
            color={dark ? '#f59e0b' : '#6366f1'}
            onPress={toggleTheme}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.subText }]}>ACCOUNT</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem colors={colors} icon={Lock} label="Change Password" sub="Update your account password" color="#8b5cf6" onPress={handleChangePassword} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            colors={colors}
            icon={Info}
            label="About iRabiesCare"
            sub="Rabies Prevention Program v1.0"
            color="#64748b"
            onPress={handleAbout}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.subText }]}>SESSION</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem colors={colors} icon={LogOut} label="Log Out" sub="Sign out of your account" danger onPress={handleLogout} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subText }]}>iRabiesCare · Department of Health</Text>
          <Text style={[styles.footerVersion, { color: colors.border }]}>Rabies Prevention Program v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    alignItems: 'center',
    paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  body:         { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  infoCard: {
    borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  infoLabel: { fontSize: 12, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600' },

  menuCard: {
    borderRadius: 14, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2, overflow: 'hidden',
  },
  menuItem:  { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
  menuIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  menuSub:   { fontSize: 11 },
  divider:   { height: 1, marginLeft: 66 },

  footer:        { alignItems: 'center', marginTop: 8 },
  footerText:    { fontSize: 12, marginBottom: 3 },
  footerVersion: { fontSize: 11 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
  },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700' },
  modalSub:     { fontSize: 12, marginTop: 2 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  errorBox:  { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#dc2626' },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14 },
  input:      { flex: 1, paddingVertical: 13, fontSize: 14 },
  matchText:  { fontSize: 12, fontWeight: '600', marginBottom: 16, marginTop: -8 },

  submitBtn: {
    backgroundColor: '#1565C0', paddingVertical: 15,
    borderRadius: 14, alignItems: 'center', marginTop: 4,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:  { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});