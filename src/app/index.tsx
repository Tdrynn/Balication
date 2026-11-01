import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnboarding } from '@/context/onboarding';

const COLORS = {
  bg: '#FFFFFF',
  title: '#0F3D3A',
  body: '#1E6B63',
  button: '#17403E',
  buttonText: '#FFFFFF',
};

const HERO = require('@/assets/images/onboarding/hero.png');
const ILLUSTRATION = require('@/assets/images/onboarding/illustration.png');

const CARD_OVERLAP = 24;

function ratioOf(source: number, fallback: number) {
  const size = Image.resolveAssetSource(source);
  const w = size?.width;
  const h = size?.height;
  return w && h ? w / h : fallback;
}

const ILLUSTRATION_ANCHOR: 'top' | 'bottom' = 'top';

const HERO_RATIO = ratioOf(HERO, 1);
const ILLUSTRATION_RATIO = ratioOf(ILLUSTRATION, 1.7);

export default function OnboardingScreen() {
  const { complete } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const compact = height < 720;

  const heroHeight = Math.min(width / HERO_RATIO, height * 0.5);
  const cardHeight = 92 + insets.bottom;
  const illustrationHeight = width / ILLUSTRATION_RATIO;

  const [enter] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const textStyle = {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.hero, { height: heroHeight }]}>
        <Image
          source={HERO}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width,
            height: width / HERO_RATIO,
          }}
        />
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          Discover Bali,{'\n'}Your Way.
        </Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          Discover destinations, activities, and {'\n'}experiences that suit your
          vacation style.
        </Text>
      </Animated.View>

      <View style={styles.illustrationArea}>
        <Image
          source={ILLUSTRATION}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            left: 0,
            ...(ILLUSTRATION_ANCHOR === 'top' ? { top: 0 } : { bottom: 0 }),
            width,
            height: illustrationHeight,
          }}
        />
      </View>

      <View style={[styles.card, { height: cardHeight }]}>
        <Pressable
          accessibilityRole="button"
          onPress={complete}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Get Started </Text>
            <Ionicons
              name={'arrow-forward'}
              size={21}
              color={COLORS.buttonText}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  hero: {
    overflow: 'hidden',
    flexShrink: 1,
    maxHeight: 350,
    opacity: 0.95,
  },
  textBlock: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 10,
  },
  title: {
    color: COLORS.title,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 33,
  },
  subtitle: {
    color: COLORS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  illustrationArea: {
    flex: 1,
    overflow: 'hidden',
    opacity: 0.7,
  },
  card: {
    marginTop: -CARD_OVERLAP,
    zIndex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: 20,
    fontWeight: '700',
  },
});