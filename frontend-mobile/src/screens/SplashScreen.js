import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

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
    <Svg
  width={320} height={340}
  viewBox="0 0 100 100"
  style={{ position: 'absolute', top: -40, right: -60 }}
>
  <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.22)" />
</Svg>
<Svg
  width={200} height={200}
  viewBox="0 0 100 100"
  style={{ position: 'absolute', top: 80, right: 20 }}
>
  <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.10)" />
</Svg>
<Svg
  width={180} height={180}
  viewBox="0 0 100 100"
  style={{ position: 'absolute', bottom: -20, left: -40 }}
>
  <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(255,255,255,0.06)" />
</Svg>
<Svg
  width={120} height={120}
  viewBox="0 0 100 100"
  style={{ position: 'absolute', bottom: 100, right: -20 }}
>
  <Path d="M50 4 L92 18 L92 52 Q92 82 50 96 Q8 82 8 52 L8 18 Z" fill="rgba(0,188,212,0.12)" />
</Svg>

      {/* ── Logo ── */}
      <Animated.View style={[
        styles.logoWrapper,
        { transform: [{ scale: logoScale }], opacity: fadeAnim },
      ]}>
        {/* Pulse glow ring */}
        <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />

        {/* White logo circle */}
        <View style={styles.logoCircle}>
          <Svg width={140} height={140} viewBox="0 0 100 100">
            {/* Shield shape */}
            <Path
              d="M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z"
              fill="rgba(255,255,255,0.95)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
            {/* Inner shield */}
            <Path
              d="M50 12 L83 25 L83 54 Q83 74 50 87 Q17 74 17 54 L17 25 Z"
              fill="rgba(255,255,255,0.6)"
            />
            {/* Vertical bar of cross */}
            <Rect x="44" y="30" width="12" height="38" rx="3" fill="#1565C0" opacity="0.95"/>
            {/* Horizontal bar of cross */}
            <Rect x="31" y="43" width="38" height="12" rx="3" fill="#1565C0" opacity="0.95"/>
            {/* Cross shine */}
            <Rect x="44" y="30" width="4" height="38" rx="2" fill="rgba(255,255,255,0.3)"/>
          </Svg>
        </View>
      </Animated.View>

      {/* ── Brand text ── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
        <Text style={styles.brandName}>
        <Text style={{ fontStyle: 'italic', color: '#ff6b6b' }}>i</Text>
        <Text style={{ color: '#ffffff' }}>Rabies</Text>
        <Text style={{ color: '#90caf9' }}>Care</Text>
      </Text>
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
 

  // ── Logo ──
  logoWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    // Cyan glow matching FAB and accent color
    backgroundColor: 'rgba(0,188,212,0.25)',
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