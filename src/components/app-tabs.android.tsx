import * as Haptics from 'expo-haptics';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  PanResponder,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLanguage } from '@/context/language';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const PALETTES = {
  dark: {
    glass: 'rgba(44, 44, 46, 0.62)',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
    topEdge: 'rgba(255, 255, 255, 0.35)',
    pill: 'rgba(255, 255, 255, 0.16)',
    pillBorder: 'rgba(255, 255, 255, 0.28)',
    pillLift: 'rgba(255, 255, 255, 0.10)',
    inactive: 'rgba(255, 255, 255, 0.68)',
    active: '#0A84FF',
  },
  light: {
    glass: 'rgba(250, 250, 252, 0.90)',
    glassBorder: 'rgba(255, 255, 255, 0.75)',
    topEdge: 'rgba(255, 255, 255, 0.95)',
    pill: 'rgba(120, 120, 128, 0.20)',
    pillBorder: 'rgba(120, 120, 128, 0.40)',
    pillLift: 'rgba(255, 255, 255, 0.35)',
    inactive: 'rgba(60, 60, 67, 0.72)',
    active: '#007AFF',
  },
};

const ICONS: Record<string, number> = {
  home: require('@/assets/images/tabIcons/home.png'),
  itinerary: require('@/assets/images/tabIcons/bookmark.png'),
  wishlist: require('@/assets/images/tabIcons/heart.png'),
  chatbot: require('@/assets/images/tabIcons/chatbox.png'),
  profile: require('@/assets/images/tabIcons/profile.png'),
};

const BAR_HEIGHT = 70;
const BAR_RADIUS = BAR_HEIGHT / 2;
const PAD = 5;
const LIFT_SCALE = 1.15;
const EASE = Easing.out(Easing.cubic);

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Kilau cahaya: putih di atas memudar ke transparan, dengan pantulan tipis di dasar. */
function Sheen({
  id,
  top,
  reach,
  bottom = 0,
}: {
  id: string;
  top: number;
  reach: number;
  bottom?: number;
}) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={top} />
          <Stop offset={reach} stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Isi satu tab (ikon + label) dengan satu warna. */
function TabContent({
  source,
  label,
  color,
}: {
  source?: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.content}>
      {source ? (
        <Image source={source} resizeMode="contain" style={[styles.icon, { tintColor: color }]} />
      ) : null}
      <Animated.Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </View>
  );
}

type TabItemProps = {
  index: number;
  width: number;
  x: Animated.Value; // posisi pill (translateX)
  lift: Animated.Value; // 0 = lepas, 1 = ditahan
  selected: boolean;
  label: string;
  source?: number;
  activeColor: string;
  inactiveColor: string;
  accessibilityLabel?: string;
  onAccessibilityTap: () => void;
};

function TabItem({
  index,
  width,
  x,
  lift,
  selected,
  label,
  source,
  activeColor,
  inactiveColor,
  accessibilityLabel,
  onAccessibilityTap,
}: TabItemProps) {
  // 1 saat pill tepat di atas tab ini, 0 saat berjarak satu tab atau lebih
  const proximity = x.interpolate({
    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const inactiveOpacity = proximity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // Ikon sedikit membesar di bawah pill, lalu tambahan "lensa" saat pill ditahan
  const baseScale = proximity.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const lensScale = Animated.multiply(proximity, lift).interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });

  return (
    <View
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onAccessibilityTap={onAccessibilityTap}
      style={[styles.item, { width }]}
    >
      <Animated.View style={{ transform: [{ scale: baseScale }, { scale: lensScale }] }}>
        {/* Lapisan abu (tidak aktif) */}
        <Animated.View style={{ opacity: inactiveOpacity }}>
          <TabContent source={source} label={label} color={inactiveColor} />
        </Animated.View>

        {/* Lapisan biru (aktif), muncul mengikuti pill */}
        <Animated.View style={[styles.overlay, { opacity: proximity }]}>
          <TabContent source={source} label={label} color={activeColor} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function GlassTabBar(props: TabBarProps) {
  const scheme = useColorScheme();
  const C = PALETTES['light'];
  const { state, descriptors } = props;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const barWidth = width * 0.92;
  const sideGap = (width - barWidth) / 2;
  const bottom = insets.bottom + 16;
  const count = state.routes.length;
  const innerWidth = barWidth - PAD * 2;
  const itemWidth = innerWidth / count;
  const maxX = (count - 1) * itemWidth;

  const [x] = useState(() => new Animated.Value(state.index * itemWidth));
  const [lift] = useState(() => new Animated.Value(0));

  const pillScale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, LIFT_SCALE],
  });

  const select = (index: number) => {
    const route = state.routes[index];
    if (!route || state.index === index) return;

    const nav = (props as unknown as {
      navigation?: {
        emit: (e: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean };
        navigate: (name: string, params?: object) => void;
      };
    }).navigation;

    if (nav) {
      const event = nav.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!event?.defaultPrevented) nav.navigate(route.name, route.params);
    } else {
      router.navigate(`/tabs/${route.name}` as Href); // cadangan
    }
  };

  const setLift = (toValue: 0 | 1) =>
    Animated.timing(lift, {
      toValue,
      duration: toValue ? 160 : 200,
      easing: EASE,
      useNativeDriver: true,
    }).start();

  const snapTo = (index: number) =>
    Animated.timing(x, {
      toValue: index * itemWidth,
      duration: 220,
      easing: EASE,
      useNativeDriver: true,
    }).start();

  useEffect(() => {
    snapTo(state.index);
  }, [state.index, itemWidth]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const latest = useRef({
    itemWidth,
    maxX,
    count,
    sideGap,
    select,
    snapTo,
    setLift,
    stateIndex: state.index,
  });
  latest.current = {
    itemWidth,
    maxX,
    count,
    sideGap,
    select,
    snapTo,
    setLift,
    stateIndex: state.index,
  };

  const drag = useRef({ moved: false, lastIndex: -1, lastX: 0 });

  const touchToLocalX = (pageX: number) => pageX - latest.current.sideGap - PAD;
  const indexAt = (localX: number) =>
    clamp(Math.floor(localX / latest.current.itemWidth), 0, latest.current.count - 1);

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (_e, g) => {
        const l = latest.current;
        const idx = indexAt(touchToLocalX(g.x0));
        drag.current = { moved: false, lastIndex: idx, lastX: g.x0 };
        l.setLift(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        l.snapTo(idx);
      },

      onPanResponderMove: (_e, g) => {
        const l = latest.current;
        drag.current.lastX = g.moveX;
        const localX = touchToLocalX(g.moveX);

        if (!drag.current.moved && Math.abs(g.dx) > 4) {
          drag.current.moved = true;
          x.stopAnimation();
        }

        if (drag.current.moved) {
          x.setValue(clamp(localX - l.itemWidth / 2, 0, l.maxX));
        }

        const idx = indexAt(localX);
        if (idx !== drag.current.lastIndex) {
          drag.current.lastIndex = idx;
          Haptics.selectionAsync().catch(() => { });
        }
      },

      onPanResponderRelease: () => {
        const l = latest.current;
        const idx = indexAt(touchToLocalX(drag.current.lastX));
        l.setLift(0);
        l.snapTo(idx);
        requestAnimationFrame(() => l.select(idx));
      },

      onPanResponderTerminate: () => {
        const l = latest.current;
        l.setLift(0);
        l.snapTo(l.stateIndex);
      },
    })
  );

  if (keyboardOpen) return null;

  return (
    <View style={[styles.bar, { left: sideGap, bottom, width: barWidth }]}>
      {/* Permukaan kaca bar */}
      <View
        pointerEvents="none"
        style={[styles.glass, { backgroundColor: C.glass, borderColor: C.glassBorder }]}
      >
        <Sheen id="barSheen" top={0.24} reach={0.55} bottom={0.06} />
        <View style={[styles.topEdge, { backgroundColor: C.topEdge }]} />
      </View>

      {/* Pill kaca */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          {
            width: itemWidth,
            backgroundColor: C.pill,
            borderColor: 'transparent',
            transform: [{ translateX: x }, { scale: pillScale }],
          },
        ]}
      >
        <Sheen id="pillSheen" top={0.4} reach={0.9} bottom={0.08} />

        {/* Efek kaca: hanya terlihat saat ditahan / digeser */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: lift }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.pillLift }]} />
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Lensa: terang di bagian atas, memudar ke bawah */}
              <RadialGradient id="lens" cx="50%" cy="22%" rx="85%" ry="95%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.16} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.04} />
              </RadialGradient>
              {/* Pantulan cahaya di dasar kapsul */}
              <LinearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity={0} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.26} />
              </LinearGradient>
              {/* Kilau diagonal tipis (refleksi permukaan kaca) */}
              <LinearGradient id="glint" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
                <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#lens)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#glint)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#floor)" />
          </Svg>
          {/* Rim: atas terang, bawah redup, seperti tepi kaca yang membiaskan cahaya */}
          <View style={styles.rim} />
          <View style={styles.pillTopEdge} />
        </Animated.View>
      </Animated.View>

      {/* Baris ikon: satu area sentuh untuk tap + tahan + geser */}
      <View style={styles.row} {...pan.panHandlers}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;

          return (
            <TabItem
              key={route.key}
              index={index}
              width={itemWidth}
              x={x}
              lift={lift}
              selected={state.index === index}
              label={label}
              source={ICONS[route.name]}
              activeColor={C.active}
              inactiveColor={C.inactive}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onAccessibilityTap={() => select(index)}
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
      screenOptions={{ headerShown: false, lazy: false }}
    >
      <Tabs.Screen name="home" options={{ title: t('tab.home') }} />
      <Tabs.Screen name="itinerary" options={{ title: t('tab.itinerary') }} />
      <Tabs.Screen name="wishlist" options={{ title: t('tab.wishlist') }} />
      <Tabs.Screen name="chatbot" options={{ title: t('tab.chatbot') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
  },
  glass: {
    ...StyleSheet.absoluteFill,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: BAR_RADIUS * 0.6,
    right: BAR_RADIUS * 0.6,
    height: 1,
  },
  pill: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    height: BAR_HEIGHT - PAD * 2,
    borderRadius: (BAR_HEIGHT - PAD * 2) / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderRadius: (BAR_HEIGHT - PAD * 2) / 2,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    borderRightColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomColor: 'rgba(120, 120, 128, 0.20)',
  },
  pillTopEdge: {
    position: 'absolute',
    top: 1,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 26,
    height: 26,
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
  },
});