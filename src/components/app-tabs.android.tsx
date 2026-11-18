import * as Haptics from 'expo-haptics';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useLanguage } from '@/context/language';

// Tipe props tab bar diambil dari Tabs sendiri (tidak boleh impor @react-navigation/* di SDK 56+)
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const COLORS = {
  icon: '#FFFFFF',
  glass: 'rgba(21, 59, 59, 0.62)', // bar: kaca asap hijau tua
  glassBorder: 'rgba(255, 255, 255, 0.24)',
  pill: 'rgba(61, 147, 101, 0.58)', // indikator tab aktif: kaca hijau
  pillBorder: 'rgba(255, 255, 255, 0.42)',
};

const ICONS = {
  home: require('@/assets/images/tabIcons/home.png'),
  explore: require('@/assets/images/tabIcons/bookmark.png'),
  wishlist: require('@/assets/images/tabIcons/heart.png'),
  chatbot: require('@/assets/images/tabIcons/chatbox.png'),
  profile: require('@/assets/images/tabIcons/profile.png'),
};

const BAR_HEIGHT = 70;
const BAR_RADIUS = 26;
const PAD = 6;
const BORDER = 1;

function TabIcon({ source, focused }: { source: number; focused: boolean }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[styles.icon, { opacity: focused ? 1 : 0.75 }]}
    />
  );
}

/** Kilau cahaya di sisi atas permukaan kaca (putih memudar ke transparan). */
function Sheen({ id, strength, reach }: { id: string; strength: number; reach: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={strength} />
          <Stop offset={reach} stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

type TabItemProps = {
  width: number;
  focused: boolean;
  label: string;
  icon: ReactNode;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({
  width,
  focused,
  label,
  icon,
  accessibilityLabel,
  onPress,
  onLongPress,
}: TabItemProps) {
  const [focus] = useState(() => new Animated.Value(focused ? 1 : 0));
  const [press] = useState(() => new Animated.Value(1));

  // Ikon membesar dan sedikit naik saat tab aktif (pegas, seperti iOS)
  useEffect(() => {
    Animated.spring(focus, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 190,
      mass: 0.8,
    }).start();
  }, [focused, focus]);

  const pressTo = (toValue: number) =>
    Animated.spring(press, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 7,
    }).start();

  const iconScale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const iconLift = focus.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] });
  const labelOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => pressTo(0.88)}
      onPressOut={() => pressTo(1)}
      style={[styles.item, { width }]}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ scale: press }] }]}>
        <Animated.View style={{ transform: [{ scale: iconScale }, { translateY: iconLift }] }}>
          {icon}
        </Animated.View>
        <Animated.Text style={[styles.label, { opacity: labelOpacity }]} numberOfLines={1}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Bagian navigation yang dipakai tab bar. Tipe resmi BottomTabBarProps di beberapa versi
 * tidak memuat `navigation`, padahal objeknya ada saat dijalankan, jadi dibaca lewat tipe
 * sendiri. Sumbernya: props.navigation, atau navigation milik layar di descriptors.
 */
type TabNavigation = {
  // Keduanya opsional: di beberapa versi objeknya tidak memuat salah satunya
  emit?: (event: {
    type: 'tabPress' | 'tabLongPress';
    target: string;
    canPreventDefault?: boolean;
  }) => { defaultPrevented?: boolean } | undefined;
  navigate?: (name: string, params?: object) => void;
};

function getNavigation(props: TabBarProps, routeKey: string): TabNavigation | undefined {
  const loose = props as unknown as {
    navigation?: TabNavigation;
    descriptors: Record<string, { navigation?: TabNavigation }>;
  };
  return loose.navigation ?? loose.descriptors[routeKey]?.navigation;
}

function GlassTabBar(props: TabBarProps) {
  const { state, descriptors } = props;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const barWidth = width * 0.92;
  const sideGap = (width - barWidth) / 2;
  const bottom = insets.bottom + 16;

  const count = state.routes.length;
  const itemWidth = (barWidth - BORDER * 2 - PAD * 2) / count;

  const [x] = useState(() => new Animated.Value(state.index * itemWidth));
  const [stretchX] = useState(() => new Animated.Value(1));
  const [stretchY] = useState(() => new Animated.Value(1));
  const previousIndex = useRef(state.index);

  // Sembunyikan bar saat keyboard terbuka (pengganti tabBarHideOnKeyboard)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Indikator kaca meluncur ke tab baru, sedikit memanjang lalu kembali (efek "cairan")
  useEffect(() => {
    Animated.spring(x, {
      toValue: state.index * itemWidth,
      useNativeDriver: true,
      damping: 17,
      stiffness: 170,
      mass: 0.9,
    }).start();

    if (previousIndex.current !== state.index) {
      previousIndex.current = state.index;
      Haptics.selectionAsync().catch(() => {
        // perangkat tanpa haptic: abaikan
      });

      Animated.sequence([
        Animated.parallel([
          Animated.timing(stretchX, { toValue: 1.16, duration: 110, useNativeDriver: true }),
          Animated.timing(stretchY, { toValue: 0.93, duration: 110, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(stretchX, { toValue: 1, damping: 10, stiffness: 220, useNativeDriver: true }),
          Animated.spring(stretchY, { toValue: 1, damping: 10, stiffness: 220, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [state.index, itemWidth, x, stretchX, stretchY]);

  if (keyboardOpen) return null;

  return (
    <View style={[styles.bar, { left: sideGap, bottom, width: barWidth }]}>
      {/* Permukaan kaca: kilau atas + garis cahaya di tepi atas */}
      <Sheen id="barSheen" strength={0.22} reach={0.55} />
      <View pointerEvents="none" style={styles.topEdge} />

      {/* Indikator kaca untuk tab aktif */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          {
            width: itemWidth,
            transform: [{ translateX: x }, { scaleX: stretchX }, { scaleY: stretchY }],
          },
        ]}
      >
        <Sheen id="pillSheen" strength={0.38} reach={0.9} />
      </Animated.View>

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const navigation = getNavigation(props, route.key);

            // Beri tahu navigator bahwa tab ditekan (jika fungsinya tersedia)
            const event =
              typeof navigation?.emit === 'function'
                ? navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                : undefined;

            if (focused || event?.defaultPrevented) return;

            if (typeof navigation?.navigate === 'function') {
              navigation.navigate(route.name, route.params);
            } else {
              // Cadangan terakhir: pindah lewat router. Folder tab Anda bernama "tabs".
              router.navigate(`/tabs/${route.name}` as Href);
            }
          };

          const onLongPress = () => {
            const navigation = getNavigation(props, route.key);
            if (typeof navigation?.emit === 'function') {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            }
          };

          return (
            <TabItem
              key={route.key}
              width={itemWidth}
              focused={focused}
              label={label}
              icon={options.tabBarIcon?.({ focused, color: COLORS.icon, size: 26 })}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.home} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="itinerary"
        options={{
          title: t('tab.itinerary'),
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.explore} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: t('tab.wishlist'),
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.wishlist} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          title: t('tab.chatbot'),
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.chatbot} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: ({ focused }) => <TabIcon source={ICONS.profile} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    borderWidth: BORDER,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
    overflow: 'hidden',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pill: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    height: BAR_HEIGHT - BORDER * 2 - PAD * 2,
    borderRadius: BAR_RADIUS - PAD,
    borderWidth: 1,
    borderColor: COLORS.pillBorder,
    backgroundColor: COLORS.pill,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    padding: PAD,
  },
  item: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 26,
    height: 26,
    tintColor: COLORS.icon,
  },
  label: {
    marginTop: 3,
    color: COLORS.icon,
    fontSize: 11,
    fontWeight: '700',
  },
});