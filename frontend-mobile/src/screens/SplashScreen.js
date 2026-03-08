import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Shield } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onComplete, duration = 3000 }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const fadeOut   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }).start(() => onComplete?.());
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>

      {/* ── Background decorative circles — matching Dashboard header ── */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      <View style={styles.circle4} />

      {/* ── Logo ── */}
      <Animated.View style={[
        styles.logoWrapper,
        { transform: [{ scale: logoScale }], opacity: fadeAnim },
      ]}>
        {/* Pulse glow ring */}
        <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />

        {/* White logo circle */}
        <View style={styles.logoCircle}>
          <View style={styles.shieldOuter}>
            <Shield color="#1565C0" fill="#1565C0" size={56} />
            <View style={styles.crossH} />
            <View style={styles.crossV} />
            <View style={styles.redDot}>
              <View style={styles.dotCrossH} />
              <View style={styles.dotCrossV} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Brand text ── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
        <Text style={styles.brandName}>iRabiesCare</Text>
        <Text style={styles.subtitle}>CASE MANAGEMENT SYSTEM</Text>
        <Text style={styles.tagline}>
          Protecting Lives Through Timely{'\n'}Vaccination & Comprehensive Care
        </Text>
      </Animated.View>

      {/* ── Spinner ── */}
      <Animated.View style={[styles.spinnerWrapper, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <Text style={styles.loadingText}>LOADING SYSTEM...</Text>
      </Animated.View>

      {/* ── Footer ── */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerOrg}>Department of Health</Text>
        <Text style={styles.footerVersion}>Rabies Prevention Program v1.0</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    // Base color matches Dashboard header #1565C0
    backgroundColor: '#1565C0',
  },

  // ── Decorative circles — same style as Dashboard header ──
  // Large cyan circle top-right (matches bgCircle1)
  circle1: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(0,188,212,0.22)',
    top: -100, right: -100,
  },
  // Medium cyan circle mid-right (matches bgCircle2)
  circle2: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,188,212,0.15)',
    top: 60, right: 40,
  },
  // Small circle bottom-left
  circle3: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40, left: -40,
  },
  // Extra accent circle bottom-right
  circle4: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,188,212,0.12)',
    bottom: 80, right: -30,
  },

  // ── Logo ──
  logoWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    // Cyan glow matching FAB and accent color
    backgroundColor: 'rgba(0,188,212,0.25)',
  },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  shieldOuter: {
    width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 22, height: 4, backgroundColor: '#fff',
    borderRadius: 2, top: '50%', marginTop: -2,
  },
  crossV: {
    position: 'absolute',
    width: 4, height: 22, backgroundColor: '#fff',
    borderRadius: 2, left: '50%', marginLeft: -2, top: '25%',
  },
  redDot: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#e74c3c',
    top: 4, right: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  dotCrossH: {
    position: 'absolute',
    width: 8, height: 2, backgroundColor: '#fff', borderRadius: 1,
  },
  dotCrossV: {
    position: 'absolute',
    width: 2, height: 8, backgroundColor: '#fff', borderRadius: 1,
  },

  // ── Text ──
  brandName: {
    fontSize: 40, fontWeight: '700', color: '#fff',
    letterSpacing: 0.5, marginBottom: 4,
  },
  subtitle: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    letterSpacing: 3, marginBottom: 16,
  },
  tagline: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 22,
    marginBottom: 40, paddingHorizontal: 32,
  },

  // ── Spinner — cyan top border matches Dashboard accent ──
  spinnerWrapper: { alignItems: 'center', gap: 12 },
  spinner: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    // Cyan spinner tip matches FAB color #00BCD4
    borderTopColor: '#00BCD4',
  },
  loadingText: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2, marginTop: 10,
  },

  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 36,
    alignItems: 'center',
  },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});