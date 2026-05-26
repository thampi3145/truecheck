import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import HistoryItem from '../components/HistoryItem';
import { loadHistory, clearHistory } from '../hooks/useAnalysis';
import { AnalysisResult } from '../utils/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'genuine' | 'suspicious' | 'fake'>('all');

  useFocusEffect(useCallback(() => {
    loadHistory().then(setHistory);
  }, []));

  const handleClear = () => {
    Alert.alert('Clear History', 'Delete all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearHistory(); setHistory([]); } },
    ]);
  };

  const filtered = filter === 'all' ? history : history.filter(h => h.verdict === filter);

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'genuine', label: 'Genuine' },
    { key: 'suspicious', label: 'Suspicious' },
    { key: 'fake', label: 'Fake Risk' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Pills */}
      {history.length > 0 && (
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = f.key === 'all' ? history.length : history.filter(h => h.verdict === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>Products you analyze will appear here</Text>
          <TouchableOpacity
            style={styles.scanNowBtn}
            onPress={() => navigation.getParent()?.navigate('ScanTab')}
            activeOpacity={0.8}
          >
            <Ionicons name="scan" size={16} color={COLORS.bg} />
            <Text style={styles.scanNowText}>Scan a Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.checkedAt}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <HistoryItem
              item={item}
              onPress={() => navigation.navigate('HistoryResult', { result: item })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  clearBtn: { padding: 4 },
  filterRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentGlow,
  },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.accent, fontWeight: '600' },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xxl, gap: SPACING.sm,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  scanNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  scanNowText: { fontSize: 14, fontWeight: '700', color: COLORS.bg },
});
