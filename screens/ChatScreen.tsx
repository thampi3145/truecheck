import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { chatWithAI, ChatMessage, AnalysisResult } from '../utils/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Is this a safe purchase?',
  'What are the red flags?',
  'How to verify authenticity?',
  'Should I buy from this seller?',
];

export default function ChatScreen({ route }: any) {
  const productContext: AnalysisResult | undefined = route.params?.productContext;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    const welcome: Message = {
      id: '0',
      role: 'assistant',
      content: productContext
        ? `Hi! I've analyzed **${productContext.productName}** and it scored **${productContext.authenticityScore}/100**. Ask me anything about this product or product safety in general.`
        : `Hi! I'm your product authenticity assistant. Paste a product link on the Scan tab, then come back here to ask questions. Or ask me anything about spotting fake products online!`,
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, [productContext]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || thinking) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const history: ChatMessage[] = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await chatWithAI([...history, { role: 'user', content }], productContext);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't get a response. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setThinking(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={12} color={COLORS.accent} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiDot} />
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>
              {productContext ? `Analyzing: ${productContext.productName.substring(0, 30)}...` : 'Product authenticity expert'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMessages([])} style={styles.clearBtn}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            thinking ? (
              <View style={styles.thinkingRow}>
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                </View>
                <View style={styles.thinkingBubble}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.thinkingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickPill} onPress={() => sendMessage(q)} activeOpacity={0.7}>
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this product..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || thinking) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || thinking}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color={input.trim() && !thinking ? COLORS.bg : COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 10, color: COLORS.textSecondary, maxWidth: 220 },
  clearBtn: { padding: 4 },
  msgList: { padding: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.accentDim,
    borderWidth: 0.5, borderColor: COLORS.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
  bubbleTextUser: { color: COLORS.bg },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, marginTop: 4 },
  thinkingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    padding: SPACING.sm + 2,
  },
  thinkingText: { fontSize: 12, color: COLORS.textSecondary },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  quickPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  quickText: { fontSize: 12, color: COLORS.textSecondary },
  inputArea: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 0.5, borderColor: COLORS.border,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  input: {
    flex: 1, fontSize: 14, color: COLORS.textPrimary,
    maxHeight: 100, paddingVertical: 4,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: COLORS.bgCardAlt },
});
