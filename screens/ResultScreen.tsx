import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScoreRing from '../components/ScoreRing';
import SignalCard from '../components/SignalCard';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { AnalysisResult } from '../utils/api';

const PLATFORM_COLORS: Record<string, string> = {
  'Amazon India': COLORS.amazon,
  'Flipkart': COLORS.flipkart,
  'Myntra': COLORS.myntra,
  'Ajio': COLORS.ajio,
};

export default function ResultScreen({ route, navigation }: any) {
  const result: AnalysisResult = route.params?.result;

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: COLORS.textPrimary, padding: 20 }}>No result to show.</Text>
      </SafeAreaView>
    );
  }

  const verdictColor =
    result.verdict === 'genuine' ? COLORS.success :
    result.verdict === 'suspicious' ? COLORS.warning : COLORS.danger;

  const verdictLabel =
    result.verdict === 'genuine' ? 'Likely Genuine' :
    result.verdict === 'suspicious' ? 'Suspicious' : 'High Fake Risk';

  const verdictIcon =
    result.verdict === 'genuine' ? 'shield-checkmark' :
    result.verdict === 'suspicious' ? 'warning' : 'close-circle';

  const platformColor = PLATFORM_COLORS[result.platform] || COLORS.accent;

  const handleShare = async () => {
    await Share.share({
      message: `TrueCheck Analysis: ${result.productName}\nAuthenticity Score: ${result.authenticityScore}/100\nVerdict: ${verdictLabel}\nPlatform: ${result.platform}`,
    });
  };

  const handleChatAbout = () => {
    navigation.getParent()?.navigate('ChatTab', { productContext: result });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Analysis Report</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product Header */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={[styles.platformBadge, { backgroundColor: platformColor + '22', borderColor: platformColor + '55' }]}>
              <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
              <Text style={[styles.platformText, { color: platformColor }]}>{result.platform}</Text>
            </View>
            <Text style={styles.price}>{result.price}</Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>{result.productName}</Text>
          <View style={styles.sellerRow}>
            <Ionicons name="storefront-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.sellerText}>{result.seller}</Text>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={COLORS.warning} />
              <Text style={styles.ratingText}>{result.rating}</Text>
              <Text style={styles.reviewCount}>({result.reviewCount.toLocaleString()})</Text>
            </View>
          </View>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <ScoreRing score={result.authenticityScore} size={140} strokeWidth={12} />
          <View style={styles.verdictWrap}>
            <View style={[styles.verdictBadge, { backgroundColor: verdictColor + '22', borderColor: verdictColor + '44' }]}>
              <Ionicons name={verdictIcon as any} size={16} color={verdictColor} />
              <Text style={[styles.verdictText, { color: verdictColor }]}>{verdictLabel}</Text>
            </View>
            <Text style={styles.checkedAt}>
              Checked {new Date(result.checkedAt).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {/* AI Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles" size={14} color={COLORS.accent} />
            <Text style={styles.summaryTitle}>AI Analysis Summary</Text>
          </View>
          <Text style={styles.summaryText}>{result.aiSummary}</Text>
        </View>

        {/* Recommendation */}
        <View style={[styles.recommendCard, { borderColor: verdictColor + '44', backgroundColor: verdictColor + '11' }]}>
          <Ionicons name="information-circle" size={16} color={verdictColor} />
          <Text style={[styles.recommendText, { color: verdictColor }]}>{result.recommendation}</Text>
        </View>

        {/* Trust Signals */}
        <View style={styles.signalsSection}>
          <Text style={styles.signalsTitle}>Trust Signals</Text>
          {result.signals.map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </View>

        {/* Chat CTA */}
        <TouchableOpacity style={styles.chatBtn} onPress={handleChatAbout} activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.accent} />
          <Text style={styles.chatBtnText}>Ask AI about this product</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
        </TouchableOpacity>

        {/* Scan Again */}
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.scanAgainText}>Scan Another Product</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  shareBtn: { padding: 4 },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  productCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 0.5,
  },
  platformDot: { width: 6, height: 6, borderRadius: 3 },
  platformText: { fontSize: 11, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm, lineHeight: 22 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: COLORS.warningDim,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: COLORS.warning },
  reviewCount: { fontSize: 10, color: COLORS.textSecondary },
  scoreSection: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    gap: SPACING.xl,
    justifyContent: 'center',
  },
  verdictWrap: { alignItems: 'flex-start', gap: SPACING.sm },
  verdictBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.md, borderWidth: 0.5,
  },
  verdictText: { fontSize: 14, fontWeight: '700' },
  checkedAt: { fontSize: 11, color: COLORS.textMuted },
  summaryCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  summaryText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  recommendCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 0.5,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  recommendText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  signalsSection: { marginBottom: SPACING.md },
  signalsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.accentGlow,
    padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  chatBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.accent },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
  },
  scanAgainText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
});
