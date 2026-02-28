import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, Shield, User, UserPlus } from 'lucide-react-native';
import { registerUser } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);

  const [nameFocused,    setNameFocused]    = useState(false);
  const [emailFocused,   setEmailFocused]   = useState(false);
  const [passFocused,    setPassFocused]    = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const { setAuth } = useAuthStore();

  // Refs — tapping anywhere on a row focuses the input inside it
  const nameRef    = useRef(null);
  const emailRef   = useRef(null);
  const passRef    = useRef(null);
  const confirmRef = useRef(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, delay: 100, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPass) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPass) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({ name, email, password });
      await setAuth(res.data.user, res.data.token);
      navigation.replace('Dashboard');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reusable InputField with ref + TouchableOpacity row ────────────────────
  const InputField = ({
    label, value, onChangeText, placeholder, secureTextEntry,
    keyboardType, autoCapitalize, icon: Icon, focused,
    onFocus, onBlur, showToggle, onToggle, showing,
    inputRef, nextRef, returnKeyType,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {/* Wrap the whole row so tapping the icon / padding focuses the TextInput */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef?.current?.focus()}
        style={[styles.inputRow, focused && styles.inputRowFocused]}
      >
        <Icon color={focused ? '#2d4a8a' : '#94a3b8'} size={17} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#b0bec5"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showing}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          returnKeyType={returnKeyType || (nextRef ? 'next' : 'done')}
          editable={!loading}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={() => nextRef?.current?.focus()}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showing
              ? <EyeOff color="#94a3b8" size={17} />
              : <Eye    color="#94a3b8" size={17} />}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e3a7c" />

      {/* Background blobs */}
      <View style={[styles.blob, styles.blobTL]} />
      <View style={[styles.blob, styles.blobBR]} />
      <View style={[styles.blob, styles.blobMid]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <Animated.View style={[
          styles.brandSection,
          { opacity: fadeAnim, transform: [{ scale: logoScale }] }
        ]}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />

          <View style={styles.logoCircle}>
            <View style={styles.shieldWrap}>
              <Shield color="#2d4a8a" fill="#2d4a8a" size={50} />
              <View style={styles.crossH} />
              <View style={styles.crossV} />
              <View style={styles.redDot}>
                <View style={styles.dotH} />
                <View style={styles.dotV} />
              </View>
            </View>
          </View>

          <Text style={styles.brandName}>iRabiesCare</Text>
          <Text style={styles.brandSub}>CASE MANAGEMENT SYSTEM</Text>
        </Animated.View>

        {/* ── Card ── */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.cardAccent} />

          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <UserPlus color="#2d4a8a" size={22} />
              <View>
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Register as a patient</Text>
              </View>
            </View>

            <InputField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Juan Dela Cruz"
              icon={User}
              inputRef={nameRef}
              nextRef={emailRef}
              focused={nameFocused}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />

            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              inputRef={emailRef}
              nextRef={passRef}
              focused={emailFocused}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              icon={Lock}
              secureTextEntry
              showToggle
              showing={showPassword}
              onToggle={() => setShowPassword(v => !v)}
              inputRef={passRef}
              nextRef={confirmRef}
              focused={passFocused}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />

            <InputField
              label="Confirm Password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="Re-enter your password"
              icon={Lock}
              secureTextEntry
              showToggle
              showing={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              inputRef={confirmRef}
              returnKeyType="done"
              focused={confirmFocused}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />

            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      password.length >= i * 3 && (
                        password.length < 6 ? styles.strengthWeak :
                        password.length < 9 ? styles.strengthMed :
                        styles.strengthStrong
                      ),
                    ]}
                  />
                ))}
                <Text style={styles.strengthLabel}>
                  {password.length < 6 ? 'Weak' : password.length < 9 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <UserPlus color="#fff" size={17} />
                  <Text style={styles.signInText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginTxt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Footer ── */}
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
  root: { flex: 1, backgroundColor: '#2d4a8a' },

  blob:    { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  blobTL:  { width: 320, height: 320, top: -100, left: -100 },
  blobBR:  { width: 400, height: 400, bottom: -120, right: -120 },
  blobMid: { width: 200, height: 200, top: '40%', left: '30%', backgroundColor: 'rgba(255,255,255,0.04)' },

  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 36 },

  // Brand
  brandSection: { alignItems: 'center', marginBottom: 30 },
  glowRing: {
    position: 'absolute', top: -14,
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  logoCircle: {
    width: 112, height: 112, borderRadius: 56, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 14,
  },
  shieldWrap: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  crossH: {
    position: 'absolute', width: 20, height: 4, backgroundColor: '#fff', borderRadius: 2,
    top: '50%', marginTop: -2,
  },
  crossV: {
    position: 'absolute', width: 4, height: 20, backgroundColor: '#fff', borderRadius: 2,
    left: '50%', marginLeft: -2, top: '24%',
  },
  redDot: {
    position: 'absolute', top: 3, right: 3,
    width: 15, height: 15, borderRadius: 7.5,
    backgroundColor: '#e74c3c', alignItems: 'center', justifyContent: 'center',
  },
  dotH: { position: 'absolute', width: 8, height: 2, backgroundColor: '#fff', borderRadius: 1 },
  dotV: { position: 'absolute', width: 2, height: 8, backgroundColor: '#fff', borderRadius: 1 },
  brandName: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: 0.4, marginBottom: 5 },
  brandSub:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 3.5 },

  // Card
  card: {
    width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22, shadowRadius: 28, elevation: 14,
  },
  cardAccent:   { height: 5, backgroundColor: '#2d4a8a' },
  cardBody:     { padding: 28 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  cardTitle:    { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#64748b' },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  inputRowFocused: {
    borderColor: '#2d4a8a', backgroundColor: '#fff',
    shadowColor: '#2d4a8a', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1e293b' },

  // Password strength
  strengthRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -8, marginBottom: 14 },
  strengthBar:    { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#e2e8f0' },
  strengthWeak:   { backgroundColor: '#ef4444' },
  strengthMed:    { backgroundColor: '#f59e0b' },
  strengthStrong: { backgroundColor: '#10b981' },
  strengthLabel:  { fontSize: 10, color: '#94a3b8', marginLeft: 4, fontWeight: '600' },

  // Button
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2d4a8a', paddingVertical: 16, borderRadius: 14, marginTop: 4,
    shadowColor: '#2d4a8a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  divText: { fontSize: 12, color: '#cbd5e1', fontWeight: '500' },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginTxt:  { fontSize: 13, color: '#64748b' },
  loginLink: { fontSize: 13, color: '#2d4a8a', fontWeight: '700' },

  footer:        { alignItems: 'center', marginTop: 28 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});