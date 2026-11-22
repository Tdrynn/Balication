import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, AVATAR_PRESETS } from '@/components/profile/avatar';
import { ProfileDialog } from '@/components/profile/profile-dialog';
import { HOME } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';

type Props = {
    visible: boolean;
    onClose: () => void;
    name: string;
    /** id avatar yang sedang dipakai ('' = huruf pertama nama) */
    current: string;
    onSave: (avatarId: string) => void;
};

const TILE = 64;

/** Dialog pilih foto profil dari gambar bawaan aplikasi. */
export function AvatarDialog({ visible, onClose, name, current, onSave }: Props) {
    const { t } = useLanguage();
    // null = belum memilih apa pun di dialog ini; tampilkan pilihan yang sedang dipakai
    const [draft, setDraft] = useState<string | null>(null);
    const selected = draft ?? current;

    const close = () => {
        setDraft(null);
        onClose();
    };

    // '' mewakili "pakai huruf pertama nama"
    const options = ['', ...AVATAR_PRESETS.map((a) => a.id)];

    return (
        <ProfileDialog
            visible={visible}
            onClose={close}
            icon="person-circle"
            title={t('avatar.title')}
            text={t('avatar.text')}
            confirmLabel={t('common.save')}
            onConfirm={() => {
                onSave(selected);
                close();
            }}
        >
            <View style={styles.grid}>
                {options.map((id) => {
                    const on = selected === id;
                    return (
                        <Pressable
                            key={id || 'initial'}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            accessibilityLabel={id ? t('avatar.option', { name: id }) : t('avatar.initial')}
                            onPress={() => setDraft(id)}
                            style={[styles.tile, on && styles.tileOn]}
                        >
                            <Avatar avatarId={id} name={name} size={TILE - 12} />
                            {on ? (
                                <View style={styles.check}>
                                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </ProfileDialog>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    tile: {
        width: TILE,
        height: TILE,
        borderRadius: TILE / 2,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileOn: {
        borderColor: HOME.primary,
    },
    check: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: HOME.dark,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});