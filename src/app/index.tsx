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
import Svg, { Path } from 'react-native-svg';

import { useOnboarding } from '@/context/onboarding';

const COLORS = {
  bg: '#FFFFFF',
  title: '#0F3D3A',
  body: '#1E6B63',
  button: '#17403E',
  buttonText: '#FFFFFF',
  mint: '#A6E8DB',
};

const HERO = require('@/assets/images/hero.png');
const ILLUSTRATION = require('@/assets/images/illustration.png');

const WAVE_HEIGHT = 90;

export default function OnboardingScreen() {
  const { complete } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const heroHeight = height * 0.46;
  const illustrationHeight = height * 0.27;
  const cardHeight = 92 + insets.bottom;

  // Animasi
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

      <View style={{ height: heroHeight }}>
        <Image source={HERO} resizeMode="cover" style={StyleSheet.absoluteFill} />

        <Svg
          width={width}
          height={WAVE_HEIGHT}
          viewBox="0 0 400 90"
          preserveAspectRatio="none"
          style={styles.wave}
        >
          <Path
            d="M0 30 C60 6 110 54 190 44 C270 34 340 -6 400 8 L400 90 L0 90 z"
            fill={COLORS.mint}
          />
          <Path
            d="M0 46 C70 20 120 78 200 62 C280 46 330 4 400 24 L400 90 L0 90 Z"
            fill={COLORS.bg}
          />
        </Svg>
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>Discover Bali,{'\n'}Your Way.</Text>
        <Text style={styles.subtitle}>
          Discover destinations, activities, and experiences that suit your
          vacation style.
        </Text>
      </Animated.View>

      <Image
        source={ILLUSTRATION}
        resizeMode="cover"
        style={[
          styles.illustration,
          { width, height: illustrationHeight, bottom: cardHeight - 24 },
        ]}
      />

      <View style={[styles.card, { height: cardHeight }]}>
        <Pressable
          accessibilityRole="button"
          onPress={complete}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
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
  wave: {
    position: 'absolute',
    left: 0,
    bottom: -1,
  },
  textBlock: {
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 10,
  },
  title: {
    color: COLORS.title,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  illustration: {
    position: 'absolute',
    left: 0,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: 17,
    fontWeight: '600',
  },
});