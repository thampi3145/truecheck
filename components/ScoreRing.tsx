import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({ score, size = 120, strokeWidth = 10 }: Props) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const color = score >= 70 ? COLORS.success : score >= 40 ? COLORS.warning : COLORS.danger;
  const verdict = score >= 70 ? 'Genuine' : score >= 40 ? 'Suspicious' : 'Fake Risk';
  const bgColor = score >= 70 ? COLORS.successDim : score >= 40 ? COLORS.warningDim : COLORS.dangerDim;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.outerRing, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        backgroundColor: bgColor,
      }]}>
        <View style={styles.center}>
          <Text style={[styles.score, { color }]}>{score}</Text>
          <Text style={styles.label}>{verdict}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  outerRing: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  score: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});
