import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { Mail, Shield, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react-native';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [error, setError]           = useState('');
  const [sent, setSent]             = useState(false);

  const emailRef = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, delay: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateSuccess = () => {
    Animated.spring(successScale, {
      toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
      animateSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Animated.View style={[styles.backRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <ArrowLeft color="#fff" size={18} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Icon */}
        <Animated.View style={[styles.iconSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.iconCircle}>
            <KeyRound color="#1565C0" size={48} strokeWidth={1.8} />
          </View>
          <Text style={styles.pageTitle}>Forgot Password?</Text>
          <Text style={styles.pageSubtitle}>
            {sent
              ? 'A reset link and an OTP code were sent to your email.'
              : 'Enter your registered email and we\'ll send you reset instructions.'}
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardAccent} />
          <View style={styles.cardBody}>

            {!sent ? (
              /* ── Request Form ── */
              <>
                <Text style={styles.cardTitle}>Account Recovery</Text>
                <Text style={styles.cardSubtitle}>Use email to receive OTP and reset link</Text>

                {/* Error */}
                {!!error && (
                  <View style={styles.errorBox}>
                    <View style={styles.errorDot} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <Pressable
                    style={[styles.inputRow, emailFocused && styles.inputRowFocused]}
                    onPress={() => emailRef.current?.focus()}
                  >
                    <Mail color={emailFocused ? '#1565C0' : '#94a3b8'} size={17} />
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#b0bec5"
                      value={email}
                      onChangeText={v => { setEmail(v); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      returnKeyType="send"
                      onSubmitEditing={handleSubmit}
                    />
                  </Pressable>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Mail color="#fff" size={17} />
                      <Text style={styles.submitText}>Send Reset Link & OTP</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => navigation.goBack()}
                  disabled={loading}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Success State ── */
              <>
                <Animated.View style={[styles.successIcon, { transform: [{ scale: successScale }] }]}>
                  <CheckCircle color="#10b981" size={52} strokeWidth={1.8} />
                </Animated.View>

                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successSubtitle}>
                  A reset link and OTP were sent to:
                </Text>
                <View style={styles.emailChip}>
                  <Mail color="#1565C0" size={13} />
                  <Text style={styles.emailChipText}>{email}</Text>
                </View>

                <Text style={[styles.successSubtitle, { marginBottom: 16, fontSize: 13 }]}>Open Reset Password screen and use the OTP provided in email.</Text>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => navigation.navigate('ResetPassword', { email })}
                  activeOpacity={0.88}
                >
                  <Shield color="#fff" size={17} />
                  <Text style={styles.submitText}>Go to Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { marginTop: 14 }]}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.cancelText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.footerRow}>
            <View style={styles.footerDot} />
            <Text style={styles.footerOrg}>Secured by Department of Health</Text>
          </View>
          <Text style={styles.footerVersion}>Rabies Prevention Program v1.0</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1565C0' },

  circle1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,188,212,0.22)', top: -100, right: -100,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,188,212,0.15)', top: 60, right: 40,
  },
  circle3: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -40, left: -40,
  },

  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 36 },

  /* Back */
  backRow: { width: '100%', marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },

  /* Icon section */
  iconSection:  { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 18, elevation: 12,
  },
  pageTitle:    { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

  /* Card */
  card: {
    width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22, shadowRadius: 28, elevation: 14,
  },
  cardAccent:   { height: 5, backgroundColor: '#1565C0', width: '100%' },
  cardBody:     { padding: 28 },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },

  /* Error */
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 18,
  },
  errorDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1, lineHeight: 18 },

  /* Inputs */
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#f8fafc',
  },
  inputRowFocused: {
    borderColor: '#1565C0', backgroundColor: '#fff',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1e293b' },

  /* Buttons */
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1565C0', paddingVertical: 16, borderRadius: 14,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  cancelBtn:  { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  /* Success */
  successIcon:     { alignItems: 'center', marginBottom: 14 },
  successTitle:    { fontSize: 22, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 6 },
  successSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 12 },

  emailChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'center', marginBottom: 20,
  },
  emailChipText: { fontSize: 13, color: '#1d4ed8', fontWeight: '600' },

  /* Temp password box */
  tempPassBox: {
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac',
    borderRadius: 14, padding: 16, marginBottom: 20, alignItems: 'center',
  },
  tempPassLabel: { fontSize: 11, fontWeight: '700', color: '#166534', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  tempPassValue: {
    fontSize: 24, fontWeight: '700', color: '#15803d', letterSpacing: 3,
    fontVariant: ['tabular-nums'], marginBottom: 10,
  },
  tempPassNote:  { fontSize: 11, color: '#4ade80', textAlign: 'center', lineHeight: 16 },

  /* Steps */
  stepList: { marginBottom: 24, gap: 10 },
  stepRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  stepNumText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  stepText:    { fontSize: 13, color: '#475569', flex: 1, lineHeight: 20 },

  /* Footer */
  footer:        { alignItems: 'center', marginTop: 30 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});