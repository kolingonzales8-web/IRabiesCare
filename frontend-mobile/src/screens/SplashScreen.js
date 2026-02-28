import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Shield } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onComplete, duration = 3000 }) {
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(30)).current;
  const logoScale    = useRef(new Animated.Value(0.7)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const spinAnim     = useRef(new Animated.Value(0)).current;
  const fadeOut      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Pulse glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Spinner
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();

    // Fade out and finish
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
      {/* Background blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrapper,
        { transform: [{ scale: logoScale }], opacity: fadeAnim }
      ]}>
        {/* Pulse glow */}
        <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />

        {/* Logo circle */}
        <View style={styles.logoCircle}>
          {/* Shield */}
          <View style={styles.shieldOuter}>
            <Shield color="#3b5998" fill="#3b5998" size={56} />
            {/* Cross overlay */}
            <View style={styles.crossH} />
            <View style={styles.crossV} />
            {/* Red dot */}
            <View style={styles.redDot}>
              <View style={styles.dotCrossH} />
              <View style={styles.dotCrossV} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Brand text */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
        <Text style={styles.brandName}>iRabiesCare</Text>
        <Text style={styles.subtitle}>CASE MANAGEMENT SYSTEM</Text>
        <Text style={styles.tagline}>
          Protecting Lives Through Timely{'\n'}Vaccination & Comprehensive Care
        </Text>
      </Animated.View>

      {/* Spinner */}
      <Animated.View style={[styles.spinnerWrapper, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <Text style={styles.loadingText}>LOADING SYSTEM...</Text>
      </Animated.View>

      {/* Footer */}
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
    backgroundColor: '#2d4a8a',
  },

  // Background blobs
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobTop: {
    width: 280, height: 280,
    top: -60, left: -60,
  },
  blobBottom: {
    width: 360, height: 360,
    bottom: -80, right: -80,
  },

  // Logo
  logoWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    width: 22, height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    top: '50%', marginTop: -2,
  },
  crossV: {
    position: 'absolute',
    width: 4, height: 22,
    backgroundColor: '#fff',
    borderRadius: 2,
    left: '50%', marginLeft: -2,
    top: '25%',
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

  // Text
  brandName: {
    fontSize: 40, fontWeight: '700',
    color: '#fff', letterSpacing: 0.5,
    marginBottom: 4,
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

  // Spinner
  spinnerWrapper: { alignItems: 'center', gap: 12 },
  spinner: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopColor: '#fff',
  },
  loadingText: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2, marginTop: 10,
  },

  // Footer
  footer: {
    position: 'absolute', bottom: 36,
    alignItems: 'center',
  },
  footerOrg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  footerVersion: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});