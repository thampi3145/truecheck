import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnalysisResult } from '../utils/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

interface Props {
  item: AnalysisResult;
  onPress: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  'Amazon India': COLORS.amazon,
  'Flipkart': COLORS.flipkart,
  'Myntra': COLORS.myntra,
  'Ajio': COLORS.ajio,
};

export default function HistoryItem({ item, onPress }: Props) {
  const scoreColor =
    item.authenticityScore >= 70 ? COLORS.success :
    item.authenticityScore >= 40 ? COLORS.warning : COLORS.danger;

  const platformColor = PLATFORM_COLORS[item.platform] || COLORS.accent;
  const date = new Date(item.checkedAt);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
        <View style={styles.meta}>
          <Text style={[styles.platform, { color: platformColor }]}>{item.platform}</Text>
          <Text style={styles.sep}>·</Text>
          <Text style={styles.time}>{dateStr} {timeStr}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.score, { color: scoreColor }]}>{item.authenticityScore}</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  platformDot: {
    width: 8, height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  platform: { fontSize: 11, fontWeight: '500' },
  sep: { fontSize: 11, color: COLORS.textMuted },
  time: { fontSize: 11, color: COLORS.textSecondary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { fontSize: 16, fontWeight: '700' },
});
