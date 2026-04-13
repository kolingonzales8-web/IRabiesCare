import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { loginUser } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);
  const { setAuth } = useAuthStore();

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      await setAuth(res.data.user, res.data.token);
      navigation.replace('Dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
    const isDeactivated = msg.toLowerCase().includes('deactivated');
    Alert.alert(
      isDeactivated ? 'Account Deactivated' : 'Login Failed',
      isDeactivated ? 'Your account has been deactivated. Please contact your administrator.' : msg,
      [{ text: 'OK', style: isDeactivated ? 'destructive' : 'cancel' }]
    ); 
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
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Access your patient portal</Text>

            {/* Email */}
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
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </Pressable>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Pressable
                style={[styles.inputRow, passFocused && styles.inputRowFocused]}
                onPress={() => passwordRef.current?.focus()}
              >
                <Lock color={passFocused ? '#1565C0' : '#94a3b8'} size={17} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#b0bec5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword
                    ? <EyeOff color="#94a3b8" size={17} />
                    : <Eye    color="#94a3b8" size={17} />}
                </TouchableOpacity>
              </Pressable>
            </View>

            {/* ✅ Navigates to ForgotPassword screen */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Shield color="#fff" size={17} />
                  <Text style={styles.signInText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerTxt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                <Text style={styles.registerLink}>Register Here</Text>
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

 

  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 36 },

  brandSection: { alignItems: 'center', marginBottom: 36 },
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
  cardAccent:   { height: 5, backgroundColor: '#1565C0', width: '100%' },
  cardBody:     { padding: 28 },
  cardTitle:    { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 28 },

  inputGroup: { marginBottom: 18 },
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

  forgotRow:  { alignSelf: 'flex-end', marginTop: -6, marginBottom: 22 },
  forgotText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },

  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1565C0', paddingVertical: 16, borderRadius: 14,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  divText: { fontSize: 12, color: '#cbd5e1', fontWeight: '500' },

  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerTxt:  { fontSize: 13, color: '#64748b' },
  registerLink: { fontSize: 13, color: '#1565C0', fontWeight: '700' },

  footer:        { alignItems: 'center', marginTop: 30 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});