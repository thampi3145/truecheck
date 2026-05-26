import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Signal } from '../utils/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

interface Props {
  signal: Signal;
}

const ICON_MAP: Record<string, string> = {
  seller: 'shield-checkmark-outline',
  reviews: 'chatbubbles-outline',
  price: 'pricetag-outline',
  warranty: 'ribbon-outline',
  returns: 'refresh-outline',
  authenticity: 'finger-print-outline',
  images: 'images-outline',
  listing: 'document-text-outline',
};

export default function SignalCard({ signal }: Props) {
  const color =
    signal.status === 'good' ? COLORS.success :
    signal.status === 'warn' ? COLORS.warning :
    COLORS.danger;

  const bgColor =
    signal.status === 'good' ? COLORS.successDim :
    signal.status === 'warn' ? COLORS.warningDim :
    COLORS.dangerDim;

  const iconName = ICON_MAP[signal.id] || 'information-circle-outline';
  const barWidth = `${signal.score}%`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName as any} size={16} color={color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>{signal.label}</Text>
          <Text style={styles.detail}>{signal.detail}</Text>
        </View>
        <Text style={[styles.score, { color }]}>{signal.score}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: barWidth as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  info: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  detail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  barBg: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: RADIUS.full,
  },
});
