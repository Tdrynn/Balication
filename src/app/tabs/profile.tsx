import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME, SIDE } from '@/components/home/home-theme';
import { AccountDialog } from '@/components/profile/account-dialog';
import { Avatar } from '@/components/profile/avatar';
import { AvatarDialog } from '@/components/profile/avatar-dialog';
import { LanguageDialog } from '@/components/profile/language-dialog';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/language';
import { LANGUAGES } from '@/lib/translations';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ORNAMENT = require('@/assets/images/decoration.png');
const ORNAMENT_RATIO = 1.6;

const DANGER = '#EF5B4F';
const DANGER_SOFT = '#FBD9D5';

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  danger?: boolean;
};

function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const tint = item.danger ? DANGER : HOME.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: item.danger ? DANGER_SOFT : '#CFE3DF' }]}>
        <Ionicons name={item.icon} size={22} color={tint} />
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
  const { account, signOut, updateAccount } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { t, language } = useLanguage();
  const router = useRouter();

  const currentLanguage = LANGUAGES.find((l) => l.code === language)?.label ?? '';
  const menu: MenuItem[] = [
    {
      key: 'account',
      title: t('profile.account'),
      subtitle: t('profile.account.sub'),
      icon: 'person',
    },
    {
      key: 'notifications',
      title: t('profile.notifications'),
      subtitle: t('profile.notifications.sub'),
      icon: 'notifications',
    },
    {
      key: 'chat',
      title: t('profile.chat'),
      subtitle: t('profile.chat.sub'),
      icon: 'chatbubble-ellipses',
    },
    {
      key: 'preferences',
      title: t('profile.preferences'),
      subtitle: t('profile.preferences.sub'),
      icon: 'compass',
    },
    {
      key: 'language',
      title: t('profile.language'),
      subtitle: currentLanguage,
      icon: 'language',
    },
    {
      key: 'logout',
      title: t('profile.logout'),
      subtitle: t('profile.logout.sub'),
      icon: 'log-out',
      danger: true,
    },
  ];

  const name = account?.name?.trim() || 'Traveler';
  const source = Image.resolveAssetSource(ORNAMENT);
  const sw = source?.width;
  const sh = source?.height;
  const ratio = sw && sh ? sw / sh : ORNAMENT_RATIO;

  const onMenu = (key: string) => {
    if (key === 'logout') {
      setConfirmOpen(true);
      return;
    }
    if (key === 'preferences') {
      router.push('/edit-preferences');
      return;
    }
    if (key === 'language') {
      setLanguageOpen(true);
      return;
    }
    if (key === 'account') {
      setAccountOpen(true);
      return;
    }
    // TODO: buka halaman Notifications dan Chat Preferences
  };

  const confirmLogout = async () => {
    setConfirmOpen(false);
    await signOut();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Ornamen latar, tidak bisa disentuh */}
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Avatar avatarId={account?.avatar} name={name} size={70} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('avatar.edit')}
                onPress={() => setAvatarOpen(true)}
                style={styles.editBadge}
              >
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.name}>{name}</Text>
            {account?.email ? <Text style={styles.email}>{account.email}</Text> : null}

            <View style={styles.menu}>
              {menu.map((item) => (
                <MenuRow key={item.key} item={item} onPress={() => onMenu(item.key)} />
              ))}
            </View>
          </View>

          <Text style={styles.platform}>
            Balication • PBL5D2
          </Text>
        </View>
      </ScrollView>

      {/* Konfirmasi keluar */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel={t('common.close')}
            style={StyleSheet.absoluteFill}
            onPress={() => setConfirmOpen(false)}
          />
          <View style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Ionicons name="log-out" size={46} color="#FFFFFF" />
            </View>
            <Text style={styles.dialogTitle}>{t('logout.title')}</Text>
            <Text style={styles.dialogText}>{t('logout.message')}</Text>

            <View style={styles.dialogButtons}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmOpen(false)}
                style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
              >
                <Text style={styles.dialogButtonText}>{t('common.cancel')}</Text>
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
                  {t('profile.logout')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dialog: bahasa, informasi akun, foto profil */}
      <LanguageDialog visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <AccountDialog
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
        name={account?.name ?? ''}
        email={account?.email ?? ''}
        onSave={(next) => updateAccount({ name: next })}
      />
      <AvatarDialog
        visible={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        name={name}
        current={account?.avatar ?? ''}
        onSave={(id) => updateAccount({ avatar: id })}
      />
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
    opacity: 0.35,
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
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#DCEAE7',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
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
  email: {
    color: HOME.muted,
    fontSize: 13,
    marginTop: 2,
  },
  menu: {
    alignSelf: 'stretch',
    gap: 8,
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
    marginTop: 8,
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