import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { smartSearch, SmartSearchResponse, SearchResult } from '../utils/api';
import { COLORS, RADIUS, SPACING, API_BASE } from '../utils/theme';

const PLATFORM_COLORS: Record<string, string> = {
  'Amazon India': '#FF9900',
  'Flipkart': '#2874F0',
  'Myntra': '#FF3E6C',
  'Ajio': '#00B5AD',
  'Meesho': '#F43397',
  'MakeMyTrip': '#E91E63',
  'Goibibo': '#E53935',
  'OYO Rooms': '#EF4136',
  'Booking.com': '#003580',
  'Cleartrip': '#F77F00',
  'Ixigo': '#FF5722',
  'EaseMyTrip': '#00BCD4',
  'Swiggy': '#FC8019',
  'Zomato': '#CB202D',
  'Blinkit': '#F8CC1B',
  'Naukri': '#2557A7',
  'LinkedIn': '#0A66C2',
  'Indeed': '#003A9B',
};

const CATEGORY_EXAMPLES = [
  { label: 'Products', example: 'Nike shoes', icon: 'cart-outline' },
  { label: 'Hotels', example: 'Hotels in Goa', icon: 'business-outline' },
  { label: 'Flights', example: 'Mumbai to Delhi', icon: 'airplane-outline' },
  { label: 'Food', example: 'Biryani near me', icon: 'restaurant-outline' },
  { label: 'Jobs', example: 'React developer', icon: 'briefcase-outline' },
];

export default function SmartSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<SmartSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q) { Alert.alert('Enter a search query'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const steps = [
      'Detecting category...',
      'Searching platforms...',
      'Comparing prices...',
      'Analyzing results...',
      'Finding best deal...',
    ];

    let i = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setLoadingStep(steps[i]);
    }, 4000);

    try {
      const data = await smartSearch(q);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Search failed. Try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleBuy = (url: string, platform: string) => {
    if (!url) { Alert.alert('No link available for this listing'); return; }
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Search</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Platforms')}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchWrap}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder='Hotels in Goa, Nike shoes, Mumbai flights...'
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResult(null); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.5 }]}
          onPress={() => handleSearch()}
          disabled={loading}
        >
          <Ionicons name="search" size={18} color={COLORS.bg} />
          <Text style={styles.searchBtnText}>
            {loading ? loadingStep : 'Search All Platforms'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>{loadingStep}</Text>
          <Text style={styles.loadingSubtext}>Checking all platforms simultaneously</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {result && !loading && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Category Badge */}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: result.categoryInfo.color + '22' }]}>
              <Ionicons name="sparkles" size={12} color={result.categoryInfo.color} />
              <Text style={[styles.categoryText, { color: result.categoryInfo.color }]}>
                {result.categoryInfo.hint}
              </Text>
            </View>
            <Text style={styles.platformsText}>
              {result.platformsSearched.join(' · ')}
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryQuery}>"{result.query}"</Text>
            <Text style={styles.summaryCount}>{result.totalResults} results found</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Price range</Text>
                <Text style={styles.summaryValue}>{result.summary.priceSpread}</Text>
              </View>
              {result.summary.fakeRiskCount > 0 && (
                <View style={[styles.summaryItem, { backgroundColor: COLORS.dangerDim }]}>
                  <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>Fake risk</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                    {result.summary.fakeRiskCount} listing(s)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Best Deal */}
          {result.bestDeal && (
            <BestDealCard
              product={result.bestDeal}
              categoryColor={result.categoryInfo.color}
              onBuy={handleBuy}
            />
          )}

          {/* All Results */}
          <Text style={styles.sectionTitle}>All Results</Text>
          {result.results
            .sort((a, b) => (b.authenticityScore || 60) - (a.authenticityScore || 60))
            .map((item, index) => (
              <ResultCard
                key={index}
                item={item}
                isBestDeal={item.url === result.bestDeal?.url}
                category={result.category}
                onBuy={handleBuy}
              />
            ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Quick examples when no search */}
      {!result && !loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Try searching for</Text>
          {CATEGORY_EXAMPLES.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exampleCard}
              onPress={() => { setQuery(cat.example); handleSearch(cat.example); }}
              activeOpacity={0.7}
            >
              <View style={styles.exampleLeft}>
                <Ionicons name={cat.icon as any} size={20} color={COLORS.accent} />
                <View>
                  <Text style={styles.exampleLabel}>{cat.label}</Text>
                  <Text style={styles.exampleText}>{cat.example}</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Best Deal Card ───────────────────────────────────────────────────────────
function BestDealCard({ product, categoryColor, onBuy }: {
  product: SearchResult;
  categoryColor: string;
  onBuy: (url: string, platform: string) => void;
}) {
  const platformColor = PLATFORM_COLORS[product.platform] || categoryColor;
  return (
    <View style={styles.bestDealCard}>
      <View style={styles.bestDealHeader}>
        <View style={styles.bestDealBadge}>
          <Ionicons name="trophy" size={12} color="#FFD700" />
          <Text style={styles.bestDealBadgeText}>BEST DEAL</Text>
        </View>
        <Text style={[styles.bestDealPlatform, { color: platformColor }]}>
          {product.platform}
        </Text>
      </View>
      <Text style={styles.bestDealName} numberOfLines={2}>{product.productName}</Text>
      <View style={styles.bestDealPriceRow}>
        <Text style={styles.bestDealPrice}>{product.price}</Text>
        {product.authenticityScore !== undefined && (
          <Text style={[styles.bestDealScore, {
            color: product.authenticityScore >= 70 ? COLORS.success
              : product.authenticityScore >= 40 ? COLORS.warning : COLORS.danger
          }]}>
            {product.authenticityScore}/100
          </Text>
        )}
      </View>
      {product.description && (
        <Text style={styles.bestDealDesc} numberOfLines={2}>{product.description}</Text>
      )}
      <TouchableOpacity
        style={[styles.buyBtn, { backgroundColor: platformColor }]}
        onPress={() => onBuy(product.buyUrl || product.url, product.platform)}
        activeOpacity={0.8}
      >
        <Ionicons name="open-outline" size={16} color="#fff" />
        <Text style={styles.buyBtnText}>View & Buy on {product.platform}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ item, isBestDeal, category, onBuy }: {
  item: SearchResult;
  isBestDeal: boolean;
  category: string;
  onBuy: (url: string, platform: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const platformColor = PLATFORM_COLORS[item.platform] || COLORS.accent;
  const score = item.authenticityScore;
  const scoreColor = score === undefined ? COLORS.textSecondary
    : score >= 70 ? COLORS.success
    : score >= 40 ? COLORS.warning
    : COLORS.danger;

  return (
    <View style={[
      styles.resultCard,
      isBestDeal && { borderColor: '#FFD700', borderWidth: 1.5 },
    ]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        {/* Platform + Score */}
        <View style={styles.resultHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + '22' }]}>
            <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
            <Text style={[styles.platformText, { color: platformColor }]}>
              {item.platform}
            </Text>
            {isBestDeal && <Text style={styles.bestTag}> ⭐</Text>}
          </View>
          {score !== undefined && (
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.resultName} numberOfLines={expanded ? 0 : 2}>
          {item.productName}
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.resultPrice}>{item.price}</Text>
          {item.priceLabel && (
            <Text style={[styles.priceLabel, {
              color: item.isSuspiciousPrice ? COLORS.danger : COLORS.success
            }]}>
              {item.priceLabel}
            </Text>
          )}
        </View>

        {/* Review warning */}
        {item.hasReviewWarnings && item.reviewSuspicions?.[0] && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={12} color={COLORS.warning} />
            <Text style={styles.warningText}>{item.reviewSuspicions[0]}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {item.aiSummary && (
            <>
              <Text style={styles.aiLabel}>AI Analysis</Text>
              <Text style={styles.aiText}>{item.aiSummary}</Text>
            </>
          )}
          {item.description && !item.aiSummary && (
            <Text style={styles.aiText}>{item.description}</Text>
          )}
          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingText}>
                {item.rating} rating
                {item.reviewCount > 0 && ` · ${item.reviewCount.toLocaleString()} reviews`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Buy Button — always visible */}
      <TouchableOpacity
        style={[styles.viewBtn, { borderColor: platformColor }]}
        onPress={() => onBuy(item.buyUrl || item.url, item.platform)}
        activeOpacity={0.8}
      >
        <Ionicons name="cart-outline" size={14} color={platformColor} />
        <Text style={[styles.viewBtnText, { color: platformColor }]}>
          {category === 'hotels' ? 'Book Now' :
           category === 'flights' ? 'Check Flights' :
           category === 'food' ? 'Order Now' :
           category === 'jobs' ? 'Apply Now' : 'Buy Now'}
        </Text>
        <Ionicons name="open-outline" size={12} color={platformColor} />
      </TouchableOpacity>

      {/* Expand toggle */}
      <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  settingsBtn: { padding: 4 },
  searchWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, height: 48,
  },
  input: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 50, gap: 8,
  },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.bg },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACING.xxl },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.accent },
  loadingSubtext: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.dangerDim, borderRadius: RADIUS.md,
    margin: SPACING.md, padding: SPACING.md,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  categoryRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  platformsText: { fontSize: 10, color: COLORS.textMuted, flex: 1 },
  summaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  summaryQuery: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  summaryCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.sm },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryItem: {
    flex: 1, backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.md, padding: 8,
  },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  bestDealCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1.5, borderColor: '#FFD70088', marginBottom: SPACING.md,
  },
  bestDealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bestDealBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFD70022', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  bestDealBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFD700' },
  bestDealPlatform: { fontSize: 12, fontWeight: '600' },
  bestDealName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  bestDealPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bestDealPrice: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  bestDealScore: { fontSize: 18, fontWeight: '700' },
  bestDealDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, padding: 12, gap: 8,
  },
  buyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  resultCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  resultHeader: {
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
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.md,
  },
  scoreText: { fontSize: 16, fontWeight: '800' },
  resultName: {
    fontSize: 13, fontWeight: '500', color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  resultPrice: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  priceLabel: { fontSize: 11, fontWeight: '600' },
  warningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, marginBottom: 6,
  },
  warningText: { fontSize: 11, color: COLORS.warning, flex: 1 },
  expandedContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  aiLabel: { fontSize: 11, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  aiText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 12, color: COLORS.textSecondary },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: RADIUS.md, margin: SPACING.sm, padding: 8, gap: 6,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  expandBtn: { alignItems: 'center', paddingVertical: 4 },
  exampleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  exampleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  exampleLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  exampleText: { fontSize: 11, color: COLORS.textSecondary },
});
