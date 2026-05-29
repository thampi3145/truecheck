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
  url?: string;
}

export interface Signal {
  id: string;
  label: string;
  score: number;
  status: 'good' | 'warn' | 'bad';
  detail: string;
  icon: string;
}

export interface SearchResult {
  productName: string;
  platform: string;
  price: string;
  priceNum: number;
  priceDeviation?: number;
  priceLabel?: string;
  isSuspiciousPrice?: boolean;
  rating: number;
  reviewCount: number;
  url: string;
  buyUrl: string;
  imageUrl?: string;
  seller: string;
  authenticityScore?: number;
  verdict?: string;
  aiSummary?: string;
  recommendation?: string;
  reviewSuspicions?: string[];
  hasReviewWarnings?: boolean;
  description?: string;
  signals?: Signal[];
}

export interface SmartSearchResponse {
  query: string;
  category: string;
  categoryInfo: CategoryInfo;
  platformsSearched: string[];
  totalResults: number;
  results: SearchResult[];
  bestDeal: SearchResult | null;
  summary: SearchSummary;
  priceRange: { min: number; max: number; avg: number };
  checkedAt: string;
  fromCache?: boolean;
}

export interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  hint: string;
}

export interface SearchSummary {
  totalResults: number;
  category: string;
  priceSpread: string;
  bestPlatform: string;
  bestPrice: string;
  fakeRiskCount: number;
  tip: string;
}

export interface Platform {
  id: string;
  name: string;
  domain: string;
  color: string;
  category: string;
  enabled: boolean;
  builtIn: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Analyze single product by URL ───────────────────────────────────────────
export async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const res = await axios.post(`${API_BASE}/analyze`, { url }, { timeout: 60000 });
  return res.data;
}

// ─── Analyze screenshot ───────────────────────────────────────────────────────
export async function analyzeScreenshot(base64Image: string): Promise<AnalysisResult> {
  const res = await axios.post(`${API_BASE}/analyze-image`, { image: base64Image }, { timeout: 60000 });
  return res.data;
}

// ─── Smart search across platforms ───────────────────────────────────────────
export async function smartSearch(
  query: string,
  category?: string
): Promise<SmartSearchResponse> {
  const res = await axios.post(
    `${API_BASE}/search`,
    { query, category },
    { timeout: 120000 }
  );
  return res.data;
}

// ─── Chat with AI ─────────────────────────────────────────────────────────────
export async function chatWithAI(
  messages: ChatMessage[],
  productContext?: any
): Promise<string> {
  const res = await axios.post(`${API_BASE}/chat`, { messages, productContext }, { timeout: 30000 });
  return res.data.reply;
}

// ─── Get all platforms ────────────────────────────────────────────────────────
export async function getAllPlatforms(): Promise<Record<string, Platform[]>> {
  const res = await axios.get(`${API_BASE}/platforms`);
  return res.data;
}

// ─── Add custom platform ──────────────────────────────────────────────────────
export async function addPlatform(data: {
  name: string;
  domain: string;
  category: string;
  searchUrl?: string;
  color?: string;
}): Promise<Platform> {
  const res = await axios.post(`${API_BASE}/platforms/add`, data, { timeout: 30000 });
  return res.data.platform;
}

// ─── Test a domain ────────────────────────────────────────────────────────────
export async function testDomain(domain: string): Promise<{
  success: boolean;
  resultsFound: number;
  sample: any[];
  error?: string;
}> {
  const res = await axios.post(`${API_BASE}/platforms/test`, { domain }, { timeout: 30000 });
  return res.data;
}

// ─── Toggle platform ──────────────────────────────────────────────────────────
export async function togglePlatform(id: string, enabled: boolean): Promise<void> {
  await axios.post(`${API_BASE}/platforms/toggle`, { id, enabled });
}

// ─── Get categories ───────────────────────────────────────────────────────────
export async function getCategories(): Promise<CategoryInfo[]> {
  const res = await axios.get(`${API_BASE}/categories`);
  return res.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function detectPlatform(url: string): string {
  if (url.includes('amazon.in') || url.includes('amzn.in')) return 'Amazon India';
  if (url.includes('flipkart.com')) return 'Flipkart';
  if (url.includes('myntra.com')) return 'Myntra';
  if (url.includes('ajio.com')) return 'Ajio';
  return 'Unknown';
}

export function getScoreColor(score: number, colors: any) {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.danger;
}
