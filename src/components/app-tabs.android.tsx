import { Tabs } from 'expo-router';
import { Image, Pressable, useWindowDimensions ,StyleSheet, type PressableProps } from 'react-native';

const COLORS = {
  card: '#153B3B',
  icon: '#FFFFFF',
  accentSoft: '#3D9365',
};

const ICONS = {
  home: require('@/assets/images/tabIcons/home.png'),
  explore: require('@/assets/images/tabIcons/bookmark.png'),
  wishlist: require('@/assets/images/tabIcons/heart.png'),
  chatbot: require('@/assets/images/tabIcons/chatbox.png'),
  profile: require('@/assets/images/tabIcons/profile.png'),
};

function TabIcon({ source, focused }: { source: number; focused: boolean }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[styles.icon, { opacity: focused ? 1 : 0.7 }]}
    />
  );
}

function TabButton({ style, ...rest }: PressableProps) {
  const focused = rest['aria-selected'] ?? rest.accessibilityState?.selected;

  return (
    <Pressable
      {...rest}
      style={[style as object, styles.tabButton, focused && styles.tabButtonActive]}
    />
  );
}

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const barWidth = width * 0.92;
  const sideGap = (width - barWidth) / 2;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => <TabButton {...props} />,

        tabBarStyle: {
          position: 'absolute',
          width: barWidth,
          marginHorizontal: sideGap,
          bottom: 70,
          height: 70,
          backgroundColor: COLORS.card,
          borderTopWidth: 0,
          borderRadius: 22,
          elevation: 8,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 6,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 3,
          color: COLORS.icon,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.home} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.explore} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.wishlist} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Chat Bot',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.chatbot} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.profile} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 26,
    height: 26,
    tintColor: COLORS.icon,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accentSoft,
  },
});
