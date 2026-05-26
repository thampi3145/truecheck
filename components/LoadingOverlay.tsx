import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

interface Props {
  step: string;
}

export default function LoadingOverlay({ step }: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
          <View style={styles.ringInner} />
        </Animated.View>
        <View style={styles.iconCenter}>
          <Animated.Text style={[styles.shieldIcon, { opacity: pulse }]}>🛡️</Animated.Text>
        </View>
        <Text style={styles.title}>Analyzing Product</Text>
        <Text style={styles.step}>{step}</Text>
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <AnimatedDot key={i} delay={i * 200} />
          ))}
        </View>
      </View>
    </View>
  );
}

function AnimatedDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
  }, []);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,15,30,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentGlow,
    width: 260,
  },
  ring: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.accent,
    borderTopColor: 'transparent',
    position: 'absolute',
    top: SPACING.xl,
  },
  ringInner: {
    width: 68, height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
    margin: 3,
  },
  iconCenter: {
    width: 80, height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  shieldIcon: { fontSize: 32 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  step: {
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
});
