import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, RADIUS, SPACING, API_BASE } from '../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductResult {
  productName: string;
  platform: string;
  price: string;
  priceNum: number;
  priceDeviation: number;
  priceLabel: string;
  isSuspiciousPrice: boolean;
  rating: number;
  reviewCount: number;
  authenticityScore: number;
  verdict: string;
  aiSummary: string;
  recommendation: string;
  url: string;
  reviewSuspicions: string[];
  hasReviewWarnings: boolean;
  buyScore?: number;
}

interface ComparisonResult {
  searchTerm: string;
  totalResults: number;
  results: ProductResult[];
  bestBuy: ProductResult;
  summary: {
    genuineCount: number;
    suspiciousCount: number;
    fakeRiskCount: number;
    priceSpread: string;
    bestPlatform: string;
    bestPrice: string;
    bestScore: number;
    warning: string | null;
    tip: string;
  };
  priceRange: { min: number; max: number; avg: number };
}

// ─── Platform Colors ──────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  'Amazon India': '#FF9900',
  'Flipkart': '#2874F0',
  'Myntra': '#FF3E6C',
  'Ajio': '#00B5AD',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompareScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!query.trim()) {
      Alert.alert('Enter product name', 'e.g. "Nike Air Max" or "boAt earphones"');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const steps = [
      'Searching Amazon India...',
      'Searching Flipkart...',
      'Searching Myntra...',
      'Searching Ajio...',
      'Analyzing prices...',
      'Detecting fake listings...',
      'Finding best deal...',
    ];

    let i = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setLoadingStep(steps[i]);
    }, 4000);

    try {
      const res = await axios.post(
        `${API_BASE}/compare`,
        { productName: query.trim() },
        { timeout: 120000 } // 2 minutes timeout for multi-platform search
      );
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Comparison failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compare</Text>
        <Text style={styles.subtitle}>Find the best & safest deal</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder='e.g. "Nike shoes" or "boAt earphones"'
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleCompare}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.compareBtn, loading && { opacity: 0.5 }]}
          onPress={handleCompare}
          disabled={loading}
        >
          <Ionicons name="git-compare" size={18} color={COLORS.bg} />
          <Text style={styles.compareBtnText}>
            {loading ? loadingStep : 'Compare All Platforms'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>{loadingStep}</Text>
          <Text style={styles.loadingSubtext}>
            Searching Amazon, Flipkart, Myntra & Ajio simultaneously...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && !loading && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary Card */}
          <SummaryCard result={result} />

          {/* Best Buy Card */}
          {result.bestBuy && <BestBuyCard product={result.bestBuy} />}

          {/* Price Comparison Bar */}
          <PriceBar results={result.results} />

          {/* All Results */}
          <Text style={styles.sectionTitle}>
            All Listings ({result.totalResults})
          </Text>
          {result.results
            .sort((a, b) => b.authenticityScore - a.authenticityScore)
            .map((product, index) => (
              <ProductCard
                key={index}
                product={product}
                isBestBuy={product.url === result.bestBuy?.url}
              />
            ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ result }: { result: ComparisonResult }) {
  const { summary } = result;
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>🔍 "{result.searchTerm}"</Text>
      <Text style={styles.summarySubtitle}>
        Found {result.totalResults} listings across 4 platforms
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatBox label="Genuine" value={summary.genuineCount} color={COLORS.success} />
        <StatBox label="Suspicious" value={summary.suspiciousCount} color={COLORS.warning} />
        <StatBox label="Fake Risk" value={summary.fakeRiskCount} color={COLORS.danger} />
      </View>

      <View style={styles.dividerLine} />

      {/* Price Range */}
      <Text style={styles.priceSpreadLabel}>Price Range</Text>
      <Text style={styles.priceSpread}>{summary.priceSpread}</Text>

      {/* Warning */}
      {summary.warning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{summary.warning}</Text>
        </View>
      )}

      {/* Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>{summary.tip}</Text>
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statBox, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Best Buy Card ────────────────────────────────────────────────────────────
function BestBuyCard({ product }: { product: ProductResult }) {
  const platformColor = PLATFORM_COLORS[product.platform] || COLORS.accent;

  return (
    <View style={styles.bestBuyCard}>
      <View style={styles.bestBuyHeader}>
        <View style={styles.bestBuyBadge}>
          <Ionicons name="trophy" size={14} color="#FFD700" />
          <Text style={styles.bestBuyBadgeText}>BEST BUY</Text>
        </View>
        <Text style={[styles.bestBuyPlatform, { color: platformColor }]}>
          {product.platform}
        </Text>
      </View>

      <Text style={styles.bestBuyName} numberOfLines={2}>
        {product.productName}
      </Text>

      <View style={styles.bestBuyRow}>
        <Text style={styles.bestBuyPrice}>{product.price}</Text>
        <View style={styles.bestBuyScore}>
          <Text style={styles.bestBuyScoreText}>{product.authenticityScore}</Text>
          <Text style={styles.bestBuyScoreLabel}>/100</Text>
        </View>
      </View>

      <Text style={styles.bestBuyReason}>{product.recommendation}</Text>

      <TouchableOpacity
        style={[styles.buyBtn, { backgroundColor: platformColor }]}
        onPress={() => product.url && Linking.openURL(product.url)}
      >
        <Text style={styles.buyBtnText}>View on {product.platform}</Text>
        <Ionicons name="open-outline" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Price Bar ────────────────────────────────────────────────────────────────
function PriceBar({ results }: { results: ProductResult[] }) {
  const validPrices = results.filter(r => r.priceNum > 0);
  if (validPrices.length === 0) return null;

  const maxPrice = Math.max(...validPrices.map(r => r.priceNum));

  return (
    <View style={styles.priceBarSection}>
      <Text style={styles.sectionTitle}>Price Comparison</Text>
      {validPrices
        .sort((a, b) => a.priceNum - b.priceNum)
        .map((product, i) => {
          const barWidth = (product.priceNum / maxPrice) * 100;
          const color = PLATFORM_COLORS[product.platform] || COLORS.accent;
          return (
            <View key={i} style={styles.priceBarRow}>
              <Text style={[styles.priceBarPlatform, { color }]}>
                {product.platform.replace(' India', '')}
              </Text>
              <View style={styles.priceBarTrack}>
                <View style={[
                  styles.priceBarFill,
                  { width: `${barWidth}%` as any, backgroundColor: color },
                ]} />
              </View>
              <View style={styles.priceBarRight}>
                <Text style={styles.priceBarAmount}>{product.price}</Text>
                {product.isSuspiciousPrice && (
                  <Ionicons name="warning" size={12} color={COLORS.danger} />
                )}
              </View>
            </View>
          );
        })}
    </View>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, isBestBuy }: { product: ProductResult; isBestBuy: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const platformColor = PLATFORM_COLORS[product.platform] || COLORS.accent;
  const scoreColor = product.authenticityScore >= 70 ? COLORS.success
                   : product.authenticityScore >= 40 ? COLORS.warning
                   : COLORS.danger;
  const verdictLabel = product.verdict === 'genuine' ? 'Genuine'
                     : product.verdict === 'suspicious' ? 'Suspicious'
                     : 'Fake Risk';

  return (
    <View style={[
      styles.productCard,
      isBestBuy && { borderColor: '#FFD700', borderWidth: 1.5 },
      product.authenticityScore < 40 && { borderColor: COLORS.danger + '44' },
    ]}>
      {/* Card Header */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + '22' }]}>
            <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
            <Text style={[styles.platformText, { color: platformColor }]}>
              {product.platform}
            </Text>
            {isBestBuy && <Text style={styles.bestTag}> ⭐ Best</Text>}
          </View>

          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {product.authenticityScore}
            </Text>
            <Text style={[styles.verdictText, { color: scoreColor }]}>
              {verdictLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.productName} numberOfLines={expanded ? 0 : 2}>
          {product.productName}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={[
            styles.priceLabel,
            { color: product.isSuspiciousPrice ? COLORS.danger : COLORS.success }
          ]}>
            {product.priceLabel}
          </Text>
        </View>

        {product.hasReviewWarnings && (
          <View style={styles.reviewWarning}>
            <Ionicons name="warning" size={12} color={COLORS.warning} />
            <Text style={styles.reviewWarningText}>
              {product.reviewSuspicions[0]}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.dividerLine} />

          {/* AI Summary */}
          <Text style={styles.aiLabel}>AI Analysis</Text>
          <Text style={styles.aiText}>{product.aiSummary}</Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {product.rating} ({product.reviewCount.toLocaleString()} reviews)
            </Text>
            {product.priceDeviation > 0 && (
              <Text style={styles.deviationText}>
                {product.priceDeviation}% below avg
              </Text>
            )}
          </View>

          {/* All review warnings */}
          {product.reviewSuspicions.map((warning, i) => (
            <View key={i} style={styles.reviewWarning}>
              <Ionicons name="alert-circle" size={12} color={COLORS.warning} />
              <Text style={styles.reviewWarningText}>{warning}</Text>
            </View>
          ))}

          {/* View Product Button */}
          {product.url && (
            <TouchableOpacity
              style={[styles.viewBtn, { borderColor: platformColor }]}
              onPress={() => Linking.openURL(product.url)}
            >
              <Text style={[styles.viewBtnText, { color: platformColor }]}>
                View on {product.platform}
              </Text>
              <Ionicons name="open-outline" size={14} color={platformColor} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Expand toggle */}
      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.md, paddingBottom: SPACING.sm },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  searchWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, height: 48,
  },
  input: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  compareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 50, gap: 8,
  },
  compareBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.bg, flex: 1, textAlign: 'center' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACING.xxl },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.accent },
  loadingSubtext: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.dangerDim, borderRadius: RADIUS.md,
    margin: SPACING.md, padding: SPACING.md,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  summarySubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  statBox: {
    flex: 1, alignItems: 'center', padding: 8,
    borderRadius: RADIUS.md, borderWidth: 0.5,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  dividerLine: { height: 0.5, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  priceSpreadLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  priceSpread: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  warningBox: {
    backgroundColor: COLORS.dangerDim, borderRadius: RADIUS.sm,
    padding: 8, marginBottom: 6,
  },
  warningText: { fontSize: 12, color: COLORS.danger },
  tipBox: {
    backgroundColor: COLORS.accentDim, borderRadius: RADIUS.sm, padding: 8,
  },
  tipText: { fontSize: 12, color: COLORS.accent },

  // Best Buy
  bestBuyCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1.5, borderColor: '#FFD700' + '88',
  },
  bestBuyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bestBuyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFD700' + '22', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  bestBuyBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFD700' },
  bestBuyPlatform: { fontSize: 12, fontWeight: '600' },
  bestBuyName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  bestBuyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bestBuyPrice: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  bestBuyScore: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  bestBuyScoreText: { fontSize: 22, fontWeight: '800', color: COLORS.success },
  bestBuyScoreLabel: { fontSize: 12, color: COLORS.textSecondary },
  bestBuyReason: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.md },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, padding: 10, gap: 6,
  },
  buyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Price Bar
  priceBarSection: { marginBottom: SPACING.md },
  priceBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  priceBarPlatform: { width: 65, fontSize: 11, fontWeight: '600' },
  priceBarTrack: {
    flex: 1, height: 8, backgroundColor: COLORS.border,
    borderRadius: RADIUS.full, overflow: 'hidden',
  },
  priceBarFill: { height: 8, borderRadius: RADIUS.full },
  priceBarRight: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  priceBarAmount: { fontSize: 11, color: COLORS.textSecondary },

  // Product Card
  productCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, paddingBottom: 8,
  },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  platformDot: { width: 6, height: 6, borderRadius: 3 },
  platformText: { fontSize: 11, fontWeight: '600' },
  bestTag: { fontSize: 10, color: '#FFD700' },
  scoreBadge: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  scoreText: { fontSize: 18, fontWeight: '800' },
  verdictText: { fontSize: 9, fontWeight: '600' },
  productName: {
    fontSize: 13, fontWeight: '500', color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  priceLabel: { fontSize: 11, fontWeight: '600' },
  reviewWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  reviewWarningText: { fontSize: 11, color: COLORS.warning, flex: 1 },
  expandedContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  aiLabel: { fontSize: 11, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  aiText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ratingText: { fontSize: 12, color: COLORS.textSecondary },
  deviationText: {
    fontSize: 11, color: COLORS.warning,
    backgroundColor: COLORS.warningDim, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: RADIUS.full,
  },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: RADIUS.md, padding: 8, gap: 6, marginTop: 4,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  expandBtn: { alignItems: 'center', paddingVertical: 6 },
});
