import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Mail, KeyRound, Lock, Shield, ArrowLeft } from 'lucide-react-native';
import { resetPassword } from '../api/auth';

export default function ResetPasswordScreen({ navigation, route }) {
  const [email, setEmail]           = useState(route.params?.email || '');
  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]       = useState(false);

  const emailRef = useRef(null);
  const otpRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!email && emailRef.current) {
      emailRef.current.focus();
    }
  }, [email]);

  const handleReset = async () => {
    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please provide email, OTP and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), otp: otp.trim(), newPassword });
      Alert.alert('Success', 'Password reset successfully. Please login with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Reset failed', err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={18} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <KeyRound color="#1565C0" size={42} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the OTP from the email and choose a new password.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Mail color="#94a3b8" size={17} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#b0bec5"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => otpRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OTP Code</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={otpRef}
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#b0bec5"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputRow}>
              <Lock color="#94a3b8" size={17} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#b0bec5"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputRow}>
              <Lock color="#94a3b8" size={17} />
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#b0bec5"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Shield color="#fff" size={17} /><Text style={styles.submitText}>Reset Password</Text></>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1565C0' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 36 },
  topRow: { width: '100%', marginBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: { width: '100%', borderRadius: 24, backgroundColor: '#fff', padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 18 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#f8fafc' },
  input: { flex: 1, fontSize: 14, color: '#1e293b', paddingVertical: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1565C0', paddingVertical: 15, borderRadius: 14, marginTop: 12 },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});