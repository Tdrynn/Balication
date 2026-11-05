import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME, SIDE } from '@/components/home/home-theme';
import { useAuth } from '@/context/auth';

const ORNAMENT = require('@/assets/images/decoration.png');
const ORNAMENT_RATIO = 1.6;

const DANGER = '#EF5B4F';
const DANGER_SOFT = '#FBD9D5';

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: ImageSourcePropType;
  danger?: boolean;
};

const MENU: MenuItem[] = [
  {
    key: 'account',
    title: 'Account Information',
    subtitle: 'View and edit your personal information',
    icon: require('@/assets/images/tabIcons/profile.png'),
  },
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Manage your notifications setting',
    icon: require('@/assets/images/tabIcons/bell.png'),
  },
  {
    key: 'chat',
    title: 'Chat Preferences',
    subtitle: 'Customize your AI assistant',
    icon: require('@/assets/images/tabIcons/chatbox.png'),
  },
  {
    key: 'logout',
    title: 'Log out',
    subtitle: 'Sign out from your account',
    icon: require('@/assets/images/tabIcons/logout.png'),
    danger: true,
  },
];

function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const tint = item.danger ? DANGER : HOME.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: item.danger ? DANGER_SOFT : '#CFE3DF' }]}>
        <Image source={item.icon} style={{ width: 22, height: 22, tintColor: tint }} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={HOME.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { account, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = account?.name?.trim() || 'Traveler';
  const initial = name.charAt(0).toUpperCase();

  const source = Image.resolveAssetSource(ORNAMENT);
  const sw = source?.width;
  const sh = source?.height;
  const ratio = sw && sh ? sw / sh : ORNAMENT_RATIO;

  const onMenu = (key: string) => {
    if (key === 'logout') {
      setConfirmOpen(true);
      return;
    }
    // TODO: buka halaman Account Information, Notifications, dan Chat Preferences
  };

  const confirmLogout = async () => {
    setConfirmOpen(false);
    await signOut();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Image
        source={ORNAMENT}
        resizeMode="cover"
        pointerEvents="none"
        style={[styles.ornament, { width, height: width / ratio }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}

        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: 130,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil & Setting</Text>
        </View>

        <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ubah foto profil"
              onPress={() => {}}
              style={styles.editBadge}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.name}>{name}</Text>

          <View style={styles.menu}>
            {MENU.map((item) => (
              <MenuRow key={item.key} item={item} onPress={() => onMenu(item.key)} />
            ))}
          </View>
        </View>

        <Text style={styles.platform}>
          Balication • version 1.0.0 • Made with <Ionicons name="heart" />
        </Text>
        </View>
      </ScrollView>

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Tutup"
            style={StyleSheet.absoluteFill}
            onPress={() => setConfirmOpen(false)}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Image source={require('@/assets/images/tabIcons/logout.png')} style={{ width: 46, height: 46, tintColor: '#FFFFFF' }} />
            </View>
            <Text style={styles.dialogTitle}>Log out?</Text>
            <Text style={styles.dialogText}>Are you sure you want to log out of your account?</Text>

            <View style={styles.dialogButtons}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmOpen(false)}
                style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
              >
                <Text style={styles.dialogButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmLogout}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.dialogButtonDanger,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.dialogButtonText, styles.dialogButtonDangerText]}>
                  Log out
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME.bg,
  },
  ornament: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SIDE,
    marginBottom: 14,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  headerTitle: {
    color: HOME.title,
    fontSize: 22,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: SIDE,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: HOME.border,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  avatarWrap: {
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: HOME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#DCEAE7',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  editBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 35,
    height: 35,
    borderRadius: 30,
    backgroundColor: HOME.dark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: HOME.title,
    fontSize: 22,
    fontWeight: '800',
  },
  menu: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HOME.border,
    backgroundColor: '#FFFFFF',
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    color: HOME.title,
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    color: HOME.muted,
    fontSize: 11,
  },
  platform: {
    marginTop: 18,
    textAlign: 'center',
    color: HOME.muted,
    fontSize: 11,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dialog: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  dialogIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    marginTop: 14,
    color: HOME.title,
    fontSize: 28,
    fontWeight: '800',
  },
  dialogText: {
    marginTop: 8,
    color: HOME.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    alignSelf: 'stretch',
  },
  dialogButton: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HOME.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dialogButtonDanger: {
    backgroundColor: DANGER,
    borderColor: DANGER,
  },
  dialogButtonText: {
    color: HOME.title,
    fontSize: 16,
    fontWeight: '700',
  },
  dialogButtonDangerText: {
    color: '#FFFFFF',
  },
});