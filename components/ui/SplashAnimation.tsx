import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  // Animation values
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const watermarkOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const sequence = Animated.sequence([
      // Phase 1: Glow burst + logo appear
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.4, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]),
      // Phase 2: Title slides in
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Phase 3: Subtitle + watermark
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(watermarkOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // Phase 4: Loading dots
      Animated.stagger(120, dotsOpacity.map((d) =>
        Animated.timing(d, { toValue: 1, duration: 250, useNativeDriver: true })
      )),
      // Hold
      Animated.delay(600),
      // Phase 5: Fade out everything
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 0, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
    ]);

    sequence.start(() => {
      onFinish();
    });

    // Pulsing glow loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.5, duration: 1400, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.2, duration: 1400, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
      ])
    );
    const timer = setTimeout(() => pulseLoop.start(), 900);
    return () => { clearTimeout(timer); pulseLoop.stop(); };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      <Image
        source={require('@/assets/images/splash-bg.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.overlay} />

      {/* Glow blob */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
        VaultOS
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Personal Finance Operating System
      </Animated.Text>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {dotsOpacity.map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, i === 1 && styles.dotMiddle, { opacity: anim }]}
          />
        ))}
      </View>

      {/* Watermark */}
      <Animated.Text style={[styles.watermark, { opacity: watermarkOpacity }]}>
        by ImsyadDeveloper
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,9,11,0.6)',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#6366f1',
    opacity: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 0,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6366f1',
  },
  dotMiddle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#818cf8',
  },
  watermark: {
    position: 'absolute',
    bottom: 52,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
