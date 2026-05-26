import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeProduct, analyzeScreenshot, AnalysisResult } from '../utils/api';

const HISTORY_KEY = 'truecheck_history';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const runAnalysis = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const steps = [
      'Fetching product page...',
      'Analyzing seller credibility...',
      'Scanning reviews for fakes...',
      'Checking price anomalies...',
      'Running AI authenticity check...',
      'Generating report...',
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setLoadingStep(steps[stepIndex]);
    }, 3000);

    try {
      const data = await analyzeProduct(url);
      setResult(data);
      await saveToHistory(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep('');
    }
  }, []);

  const runImageAnalysis = useCallback(async (base64: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep('Reading screenshot...');

    const steps = [
      'Reading screenshot...',
      'Extracting product info...',
      'Analyzing seller & price...',
      'Checking review patterns...',
      'Running AI check...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setLoadingStep(steps[stepIndex]);
    }, 2500);

    try {
      const data = await analyzeScreenshot(base64);
      setResult(data);
      await saveToHistory(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Image analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep('');
    }
  }, []);

  const saveToHistory = async (data: AnalysisResult) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: AnalysisResult[] = raw ? JSON.parse(raw) : [];
      const updated = [data, ...history].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  return { loading, error, result, loadingStep, runAnalysis, runImageAnalysis, setResult };
}

export async function loadHistory(): Promise<AnalysisResult[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}