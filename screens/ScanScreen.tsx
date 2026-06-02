import 'react-native-gesture-handler';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAnalysis } from '../hooks/useAnalysis';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, RADIUS, SPACING, PLATFORMS } from '../utils/theme';
import { detectPlatform } from '../utils/api';

const FEATURES = [
  { icon: 'shield-checkmark-outline', text: 'Seller credibility analysis' },
  { icon: 'chatbubbles-outline', text: 'Fake review detection with NLP' },
  { icon: 'pricetag-outline', text: 'Price anomaly intelligence' },
  { icon: 'ribbon-outline', text: 'Warranty & return policy check' },
  { icon: 'finger-print-outline', text: 'AI product authenticity scoring' },
  { icon: 'images-outline', text: 'Image comparison for counterfeits' },
];

export default function ScanScreen({ navigation }: any) {
  const [url, setUrl] = useState('');
  const { loading, error, loadingStep, runAnalysis, runImageAnalysis, result } = useAnalysis();

  React.useEffect(() => {
    if (result) navigation.navigate('Result', { result });
  }, [result]);

  const handleAnalyze = async () => {
    if (!url.trim()) { Alert.alert('Enter a URL', 'Paste a product link to analyze.'); return; }
    const platform = detectPlatform(url);
    if (platform === 'Unknown') {
      Alert.alert('Unsupported Platform', 'Please use Amazon India, Flipkart, Myntra, or Ajio links.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runAnalysis(url.trim());
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to upload screenshots.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].base64) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      runImageAnalysis(result.assets[0].base64);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access to capture screenshots.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].base64) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      runImageAnalysis(result.assets[0].base64);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="shield-checkmark" size={22} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.logoText}>TrueCheck</Text>
                <Text style={styles.logoSub}>AI Product Authenticator</Text>
              </View>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Is this product{'\n'}genuine or fake?</Text>
            <Text style={styles.heroSub}>AI-powered analysis across Amazon, Flipkart, Myntra & Ajio</Text>
          </View>

          {/* URL Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PASTE PRODUCT LINK</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="link" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://www.amazon.in/dp/..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleAnalyze}
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={() => setUrl('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={18} color={COLORS.bg} />
              <Text style={styles.analyzeBtnText}>Analyze Product</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or upload screenshot</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Screenshot Buttons */}
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handleImagePick} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={22} color={COLORS.accent} />
              <Text style={styles.uploadBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={handleCamera} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={22} color={COLORS.accent} />
              <Text style={styles.uploadBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Supported Platforms */}
          <View style={styles.platformSection}>
            <Text style={styles.sectionLabel}>SUPPORTED PLATFORMS</Text>
            <View style={styles.platformRow}>
              {PLATFORMS.map(p => (
                <View key={p.id} style={[styles.platformPill, { borderColor: p.color + '44' }]}>
                  <View style={[styles.platformDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.platformText, { color: p.color }]}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name={f.icon as any} size={16} color={COLORS.accent} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <LoadingOverlay step={loadingStep} />}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logoIcon: {
    width: 40, height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1, borderColor: COLORS.accentGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  logoSub: { fontSize: 11, color: COLORS.textSecondary },
  hero: { marginBottom: SPACING.xl },
  heroTitle: {
    fontSize: 28, fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 34, marginBottom: SPACING.sm,
  },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  section: { marginBottom: SPACING.lg },
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: { marginRight: 6 },
  input: {
    flex: 1, height: 48,
    fontSize: 13, color: COLORS.textPrimary,
  },
  clearBtn: { padding: 4 },
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    height: 50, gap: SPACING.sm,
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.bg },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.lg, gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  uploadRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  uploadBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    height: 72, gap: 6,
  },
  uploadBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.dangerDim,
    borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.danger + '44',
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },
  platformSection: { marginBottom: SPACING.lg },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    backgroundColor: COLORS.bgCard,
  },
  platformDot: { width: 6, height: 6, borderRadius: 3 },
  platformText: { fontSize: 11, fontWeight: '600' },
  features: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureText: { fontSize: 12, color: COLORS.textSecondary },
});
