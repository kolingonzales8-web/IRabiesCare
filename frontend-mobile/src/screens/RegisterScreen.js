import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { registerUser } from '../api/auth';
import useAuthStore from '../store/authStore';

/* ─────────────────────────────────────
   InputField moved OUTSIDE component
   to prevent re-creation on re-render
   which caused the one-letter bug
───────────────────────────────────── */
const InputField = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, icon: Icon, focused,
  onFocus, onBlur, showToggle, onToggle, showing,
  inputRef, nextRef, returnKeyType, editable,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <Pressable
      style={[styles.inputRow, focused && styles.inputRowFocused]}
      onPress={() => inputRef?.current?.focus()}
    >
      <Icon color={focused ? '#1565C0' : '#94a3b8'} size={17} />
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
        editable={editable !== false}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={() => nextRef?.current?.focus()}
        blurOnSubmit={false}
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
    </Pressable>
  </View>
);

/* ─────────────────────────────────────
   Main Screen
───────────────────────────────────── */
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

  const nameRef    = useRef(null);
  const emailRef   = useRef(null);
  const passRef    = useRef(null);
  const confirmRef = useRef(null);

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

  const handleRegister = async () => {
  if (!name || !email || !password || !confirmPass) {
    Alert.alert('Missing Fields', 'Please fill in all fields.');
    return;
  }

  // ✅ Add email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
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
    await registerUser({ name, email, password });
    Alert.alert('Registration Successful', 'Your account has been created. Please sign in.', [
      { text: 'OK', onPress: () => navigation.replace('Login') }
    ]);
  } catch (err) {
    console.log('FULL ERROR:', JSON.stringify(err.response?.data));
    console.log('STATUS:', err.response?.status);
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    Alert.alert('Registration Failed', message);
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

     

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View style={[styles.brandSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.logoCircle}>
            <Svg width={90} height={90} viewBox="0 0 100 100">
              {/* Shield shape */}
              <Path
                d="M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z"
                fill="rgba(21,101,192,0.12)"
                stroke="#1565C0"
                strokeWidth="1.5"
              />
              {/* Inner shield */}
              <Path
                d="M50 12 L83 25 L83 54 Q83 74 50 87 Q17 74 17 54 L17 25 Z"
                fill="rgba(21,101,192,0.07)"
              />
              {/* Vertical bar of cross */}
              <Rect x="44" y="30" width="12" height="38" rx="3" fill="#1565C0" opacity="0.95"/>
              {/* Horizontal bar of cross */}
              <Rect x="31" y="43" width="38" height="12" rx="3" fill="#1565C0" opacity="0.95"/>
              {/* Cross shine */}
              <Rect x="44" y="30" width="4" height="38" rx="2" fill="rgba(255,255,255,0.4)"/>
            </Svg>
          </View>
          <Text style={styles.brandName}>
            <Text style={{ fontStyle: 'italic', color: '#ff6b6b' }}>i</Text>
            <Text style={{ color: '#ffffff' }}>Rabies</Text>
            <Text style={{ color: '#90caf9' }}>Care</Text>
          </Text>
          <Text style={styles.brandSub}>CASE MANAGEMENT SYSTEM</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardAccent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Register as a patient</Text>

            <InputField
              label="Full Name" value={name} onChangeText={setName}
              placeholder="Juan Dela Cruz" icon={User}
              inputRef={nameRef} nextRef={emailRef}
              focused={nameFocused} editable={!loading}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            <InputField
              label="Email Address" value={email} onChangeText={setEmail}
              placeholder="your@email.com" icon={Mail}
              keyboardType="email-address" autoCapitalize="none"
              inputRef={emailRef} nextRef={passRef}
              focused={emailFocused} editable={!loading}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            <InputField
              label="Password" value={password} onChangeText={setPassword}
              placeholder="Min. 6 characters" icon={Lock}
              secureTextEntry showToggle showing={showPassword}
              onToggle={() => setShowPassword(v => !v)}
              inputRef={passRef} nextRef={confirmRef}
              focused={passFocused} editable={!loading}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={[
                    styles.strengthBar,
                    password.length >= i * 3 && (
                      password.length < 6  ? styles.strengthWeak :
                      password.length < 9  ? styles.strengthMed  :
                      styles.strengthStrong
                    ),
                  ]} />
                ))}
                <Text style={styles.strengthLabel}>
                  {password.length < 6 ? 'Weak' : password.length < 9 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <InputField
              label="Confirm Password" value={confirmPass} onChangeText={setConfirmPass}
              placeholder="Re-enter your password" icon={Lock}
              secureTextEntry showToggle showing={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              inputRef={confirmRef} returnKeyType="done"
              focused={confirmFocused} editable={!loading}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />

          

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

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginTxt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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

 

  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 36 },

  brandSection: { alignItems: 'center', marginBottom: 30 },
  glowRing: {
    position: 'absolute', top: -14,
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: 'rgba(0,188,212,0.2)',
  },
  logoCircle: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  brandName: { fontSize: 36, fontWeight: '700', letterSpacing: 0.4, marginBottom: 5 },
  brandSub:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 3.5 },

  card: {
    width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22, shadowRadius: 28, elevation: 14,
  },
  cardAccent:   { height: 5, backgroundColor: '#1565C0' },
  cardBody:     { padding: 28 },
  cardTitle:    { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  inputRowFocused: {
    borderColor: '#1565C0', backgroundColor: '#fff',
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1e293b' },

  strengthRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -8, marginBottom: 14 },
  strengthBar:    { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#e2e8f0' },
  strengthWeak:   { backgroundColor: '#ef4444' },
  strengthMed:    { backgroundColor: '#f59e0b' },
  strengthStrong: { backgroundColor: '#10b981' },
  strengthLabel:  { fontSize: 10, color: '#94a3b8', marginLeft: 4, fontWeight: '600' },

  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1565C0', paddingVertical: 16, borderRadius: 14, marginTop: 4,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  divText: { fontSize: 12, color: '#cbd5e1', fontWeight: '500' },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginTxt:  { fontSize: 13, color: '#64748b' },
  loginLink: { fontSize: 13, color: '#1565C0', fontWeight: '700' },

  footer:        { alignItems: 'center', marginTop: 28 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});