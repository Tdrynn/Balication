import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AiMessage,
  SuggestionChip,
  TypingIndicator,
  UserMessage,
  type ChatMessage,
} from '@/components/chat/chat-parts';
import { HOME, SIDE } from '@/components/home/home-theme';
import { useAuth } from '@/context/auth';
import { SUGGESTIONS, askAI } from '@/lib/chat-api';

const LOGO = require('@/assets/images/icon.png');
const ORNAMENT = require('@/assets/images/decoration.png');
const ORNAMENT_RATIO = 1.6;

const GREETING =
  "Hi! I'm your Balication AI.\nAsk me anything about Bali - from travel recommendations, activities, accommodation, to custom itineraries.\n\nHow can I help you today?";

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { account } = useAuth();
  const initial = (account?.name ?? 'U').trim().charAt(0).toUpperCase() || 'U';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 'greeting', role: 'ai', text: GREETING, time: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const counter = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Saat keyboard terbuka, navbar tersembunyi, jadi ruang bawah tidak perlu besar
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Tinggi navbar mengambang (lihat app-tabs.android.tsx): jarak 16 + tinggi 70, ditambah ruang napas.
  // Ubah angka 98 bila bar Anda berbeda.
  const bottomSpace = keyboardOpen ? 8 : insets.bottom + 98;

  const source = Image.resolveAssetSource(ORNAMENT);
  const sw = source?.width;
  const sh = source?.height;
  const ornamentRatio = sw && sh ? sw / sh : ORNAMENT_RATIO;

  const hasConversation = messages.some((m) => m.role === 'user');

  const push = (message: Omit<ChatMessage, 'id' | 'time'>) => {
    counter.current += 1;
    setMessages((prev) => [
      ...prev,
      { ...message, id: `m${counter.current}`, time: new Date() },
    ]);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;

    setInput('');
    push({ role: 'user', text });
    setBusy(true);

    try {
      const reply = await askAI(text);
      if (alive.current) push({ role: 'ai', text: reply.text, places: reply.places });
    } catch {
      if (alive.current) {
        push({
          role: 'ai',
          text: 'Sorry, I could not reach the assistant right now. Please try again in a moment.',
        });
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const canSend = input.trim().length > 0 && !busy;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Image
        source={ORNAMENT}
        resizeMode="cover"
        pointerEvents="none"
        style={[styles.ornament, { width, height: width / ornamentRatio }]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.brand}>Chatbot</Text>
        </View>

        {/* Percakapan */}
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) =>
              message.role === 'ai' ? (
                <AiMessage key={message.id} message={message} />
              ) : (
                <UserMessage key={message.id} message={message} initial={initial} />
              ),
            )}

            {busy ? <TypingIndicator /> : null}

            {/* Pertanyaan bawaan: tampil penuh sebelum percakapan dimulai */}
            {!hasConversation ? (
              <View style={styles.chipsWrap}>
                {SUGGESTIONS.slice(0, 4).map((item) => (
                  <SuggestionChip
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    onPress={() => send(item.label)}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* Pertanyaan bawaan setelah percakapan berjalan */}
        {hasConversation && !busy ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.chipStripScroll}
            contentContainerStyle={styles.chipStrip}
          >
            {SUGGESTIONS.map((item) => (
              <SuggestionChip
                key={item.label}
                label={item.label}
                icon={item.icon}
                onPress={() => send(item.label)}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Kolom input */}
        <View style={[styles.inputRow, { paddingBottom: bottomSpace }]}>
          <View style={styles.inputBox}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lampirkan gambar"
              hitSlop={8}
              // TODO: pilih gambar dengan expo-image-picker
              onPress={() => { }}
            >
              <Ionicons name="image-outline" size={24} color={HOME.primary} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor={HOME.muted}
              returnKeyType="send"
              multiline
              blurOnSubmit
              onSubmitEditing={() => send()}
              style={styles.input}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kirim"
            disabled={!canSend}
            onPress={() => send()}
            style={({ pressed }) => [
              styles.send,
              !canSend && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="send" size={22} color="#FFFFFF" style={styles.sendIcon} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME.bg,
  },
  flex: {
    flex: 1,
  },
  ornament: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SIDE,
    paddingBottom: 12,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brand: {
    color: HOME.title,
    fontSize: 22,
    fontWeight: '800',
  },
  chatArea: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: '65%',
    borderBottomWidth: 0,
    borderColor: HOME.border,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  chatContent: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SIDE,
    marginTop: 2,
  },
  chipStripScroll: {
    flexGrow: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  chipStrip: {
    gap: 8,
    paddingHorizontal: SIDE,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SIDE,
    paddingTop: 10,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#9BBFB9',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 96,
    paddingVertical: 10,
    color: HOME.title,
    fontSize: 14,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: HOME.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendIcon: {
    marginLeft: 2,
  },
});