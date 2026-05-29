import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllPlatforms, addPlatform, togglePlatform, testDomain } from '../utils/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const CATEGORIES = ['products', 'hotels', 'flights', 'food', 'jobs'];

const CATEGORY_LABELS: Record<string, string> = {
  products: 'Products',
  hotels: 'Hotels',
  flights: 'Flights',
  food: 'Food',
  jobs: 'Jobs',
};

export default function PlatformsScreen({ navigation }: any) {
  const [platforms, setPlatforms] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add domain form
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newSearchUrl, setNewSearchUrl] = useState('');
  const [newCategory, setNewCategory] = useState('products');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await getAllPlatforms();
      setPlatforms(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load platforms. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await togglePlatform(id, enabled);
      await loadPlatforms();
    } catch {
      Alert.alert('Error', 'Could not toggle platform.');
    }
  };

  const handleTest = async () => {
    if (!newDomain.trim()) { Alert.alert('Enter a domain'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testDomain(newDomain.trim());
      setTestResult(result);
      if (result.success) {
        Alert.alert('Success!', `Found ${result.resultsFound} results on ${newDomain}`);
      } else {
        Alert.alert('No results', `Could not find listings on ${newDomain}. Try a different domain.`);
      }
    } catch {
      Alert.alert('Error', 'Test failed. Check the domain.');
    } finally {
      setTesting(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newDomain.trim()) {
      Alert.alert('Required', 'Please enter a name and domain.');
      return;
    }
    setAdding(true);
    try {
      await addPlatform({
        name: newName.trim(),
        domain: newDomain.trim(),
        category: newCategory,
        searchUrl: newSearchUrl.trim() || undefined,
      });
      setNewName('');
      setNewDomain('');
      setNewSearchUrl('');
      setTestResult(null);
      setShowAddForm(false);
      await loadPlatforms();
      Alert.alert('Added!', `${newName} added to ${CATEGORY_LABELS[newCategory]}`);
    } catch {
      Alert.alert('Error', 'Could not add platform.');
    } finally {
      setAdding(false);
    }
  };

  const currentPlatforms = platforms[activeTab] || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Platforms</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons
            name={showAddForm ? 'close' : 'add-circle-outline'}
            size={22}
            color={COLORS.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, activeTab === cat && styles.tabActive]}
            onPress={() => setActiveTab(cat)}
          >
            <Text style={[styles.tabText, activeTab === cat && styles.tabTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Add Domain Form */}
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addTitle}>Add Custom Platform</Text>

            <Text style={styles.fieldLabel}>Platform name</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Meesho"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>Domain</Text>
            <TextInput
              style={styles.textInput}
              value={newDomain}
              onChangeText={setNewDomain}
              placeholder="e.g. meesho.com"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.fieldLabel}>Search URL (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={newSearchUrl}
              onChangeText={setNewSearchUrl}
              placeholder="https://meesho.com/search?q={q}"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catPill, newCategory === cat && styles.catPillActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.catPillText, newCategory === cat && styles.catPillTextActive]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Test Result */}
            {testResult && (
              <View style={[styles.testResult, {
                backgroundColor: testResult.success ? COLORS.successDim : COLORS.dangerDim
              }]}>
                <Ionicons
                  name={testResult.success ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={testResult.success ? COLORS.success : COLORS.danger}
                />
                <Text style={{ fontSize: 12, color: testResult.success ? COLORS.success : COLORS.danger }}>
                  {testResult.success
                    ? `Found ${testResult.resultsFound} results — ready to add`
                    : 'No results found on this domain'}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.formBtns}>
              <TouchableOpacity
                style={[styles.testBtn, testing && { opacity: 0.5 }]}
                onPress={handleTest}
                disabled={testing}
              >
                {testing
                  ? <ActivityIndicator size="small" color={COLORS.accent} />
                  : <Ionicons name="flask-outline" size={16} color={COLORS.accent} />
                }
                <Text style={styles.testBtnText}>Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addBtn, adding && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="add" size={16} color="#fff" />
                }
                <Text style={styles.addBtnText}>Add Platform</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Platform List */}
        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : currentPlatforms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No platforms in this category</Text>
            <TouchableOpacity onPress={() => setShowAddForm(true)}>
              <Text style={{ color: COLORS.accent, fontSize: 13, marginTop: 8 }}>Add one →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentPlatforms.map((p: any) => (
            <View key={p.id} style={styles.platformCard}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformDot, { backgroundColor: p.color || COLORS.accent }]} />
                <View>
                  <View style={styles.platformNameRow}>
                    <Text style={styles.platformName}>{p.name}</Text>
                    {!p.builtIn && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>custom</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.platformDomain}>{p.domain}</Text>
                </View>
              </View>
              <Switch
                value={p.enabled !== false}
                onValueChange={(val) => handleToggle(p.id, val)}
                trackColor={{ false: COLORS.border, true: COLORS.accent + '88' }}
                thumbColor={p.enabled !== false ? COLORS.accent : COLORS.textMuted}
              />
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  tabScroll: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, flexGrow: 0 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.bgCard,
  },
  tabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.bg, fontWeight: '700' },
  scroll: { padding: SPACING.md },
  addForm: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  textInput: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 0.5,
    borderColor: COLORS.border, padding: 10, fontSize: 13,
    color: COLORS.textPrimary, marginBottom: SPACING.sm,
  },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  catPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catPillText: { fontSize: 12, color: COLORS.textSecondary },
  catPillTextActive: { color: COLORS.bg, fontWeight: '600' },
  testResult: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 8, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  formBtns: { flexDirection: 'row', gap: 8 },
  testBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.accent, borderRadius: RADIUS.md, padding: 10, gap: 6,
  },
  testBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  addBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, padding: 10, gap: 6,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.bg },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
  platformCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  platformLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  platformDot: { width: 10, height: 10, borderRadius: 5 },
  platformNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  platformName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  customBadge: {
    backgroundColor: COLORS.warningDim, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: RADIUS.full,
  },
  customBadgeText: { fontSize: 9, fontWeight: '600', color: COLORS.warning },
  platformDomain: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
});
