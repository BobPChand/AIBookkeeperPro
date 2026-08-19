import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AIService, ChatMessage } from '../services/AIService';
import { read_entities } from '../utils/entityApi';

const SUGGESTED_QUESTIONS = [
  'How much did I spend on marketing last month?',
  'What are my top 3 expense categories?',
  'Am I on track for quarterly taxes?',
  "Which receipts haven't been categorized?",
];

interface AIChatAssistantProps {
  compact?: boolean;
  onExpand?: () => void;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ compact = false, onExpand }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        "Hello! I'm your AI Bookkeeper Concierge. Ask me anything about your expenses, quarterly taxes, top categories, or receipt categorization!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const txs = await read_entities('Transaction', { limit: 200 });
        setTransactions(txs || []);
      } catch (e) {
        console.warn('Failed to load transactions for AIChatAssistant:', e);
      }
    })();
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const responseText = await AIService.chat(query, [...messages, userMsg], transactions);
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I had trouble processing that question. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.compactTitle}>Concierge AI Assistant</Text>
              <Text style={styles.compactSubtitle}>Ask questions in natural language</Text>
            </View>
          </View>
          {onExpand && (
            <TouchableOpacity style={styles.expandButton} onPress={onExpand}>
              <Text style={styles.expandText}>Open Chat</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.compactChipsContainer}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chipButton}
              onPress={() => {
                if (onExpand) onExpand();
                handleSend(q);
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.accent} />
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.fullContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <View style={styles.aiBadgeLarge}>
          <Ionicons name="sparkles" size={20} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderTitle}>Concierge AI Assistant</Text>
          <Text style={styles.chatHeaderSubtitle}>GPT-4o Powered • Real-time Bookkeeping Guidance</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {!isUser && (
                <View style={styles.assistantAvatar}>
                  <Ionicons name="sparkles" size={12} color={Colors.white} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={isUser ? styles.userText : styles.assistantText}>
                  {msg.content}
                </Text>
                <Text style={isUser ? styles.userTime : styles.assistantTime}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="sparkles" size={12} color={Colors.white} />
            </View>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.typingText}>Concierge AI is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested chips above input */}
      <View style={styles.suggestionsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <TouchableOpacity key={idx} style={styles.smallChip} onPress={() => handleSend(q)}>
              <Text style={styles.smallChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question about your finances..."
          placeholderTextColor={Colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justify: 'center',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  compactSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  compactChipsContainer: {
    flexDirection: 'row',
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  aiBadgeLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    flexDirection: 'row',
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 20,
  },
  assistantText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  userTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  assistantTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsWrapper: {
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  smallChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutralLight,
  },
});

export default AIChatAssistant;
