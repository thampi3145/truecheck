import axios from 'axios';
import { API_BASE } from './theme';

export interface AnalysisResult {
  productName: string;
  platform: string;
  price: string;
  originalPrice?: string;
  seller: string;
  rating: number;
  reviewCount: number;
  authenticityScore: number;
  verdict: 'genuine' | 'suspicious' | 'fake';
  signals: Signal[];
  aiSummary: string;
  recommendation: string;
  imageUrl?: string;
  checkedAt: string;
}

export interface Signal {
  id: string;
  label: string;
  score: number;
  status: 'good' | 'warn' | 'bad';
  detail: string;
  icon: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const res = await axios.post(`${API_BASE}/analyze`, { url }, { timeout: 60000 });
  return res.data;
}

export async function analyzeScreenshot(base64Image: string): Promise<AnalysisResult> {
  const res = await axios.post(`${API_BASE}/analyze-image`, { image: base64Image }, { timeout: 60000 });
  return res.data;
}

export async function chatWithAI(messages: ChatMessage[], productContext?: AnalysisResult): Promise<string> {
  const res = await axios.post(`${API_BASE}/chat`, { messages, productContext }, { timeout: 30000 });
  return res.data.reply;
}

export function detectPlatform(url: string): string {
  if (url.includes('amazon.in') || url.includes('amzn.in')) return 'Amazon India';
  if (url.includes('flipkart.com')) return 'Flipkart';
  if (url.includes('myntra.com')) return 'Myntra';
  if (url.includes('ajio.com')) return 'Ajio';
  return 'Unknown';
}

export function getVerdictColor(verdict: string, colors: any) {
  if (verdict === 'genuine') return colors.success;
  if (verdict === 'suspicious') return colors.warning;
  return colors.danger;
}

export function getScoreColor(score: number, colors: any) {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.danger;
}
