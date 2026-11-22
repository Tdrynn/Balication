import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { HOME } from '@/components/home/home-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type AvatarPreset = {
    id: string;
    /**
     * Foto bawaan (opsional). Letakkan file di assets/images/avatars/ lalu isi, contoh:
     *   image: require('@/assets/images/avatars/penari.png'),
     * Tanpa foto, avatar memakai ikon di atas warna latar.
     */
    image?: ImageSourcePropType;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
    { id: '1', image: require('@/assets/images/avatar/Male.png') },
    { id: '2', image: require('@/assets/images/avatar/Female.png') },
    { id: '3', image: require('@/assets/images/avatar/Male1.png') },
    { id: '4', image: require('@/assets/images/avatar/Female1.png') },
    { id: '5', image: require('@/assets/images/avatar/User1.png') },
];

export const findAvatar = (id?: string | null) => AVATAR_PRESETS.find((a) => a.id === id);

type Props = {
    avatarId?: string | null;
    name?: string;
    size: number;
};

export function Avatar({ avatarId, name, size }: Props) {
    const preset = findAvatar(avatarId);
    const box = { width: size, height: size, borderRadius: size / 2 };

    if (preset?.image) {
        return <Image source={preset.image} resizeMode="cover" style={box} />;
    }

    if (preset) {
        return (
            <View style={[box, styles.center]}>
                <MaterialCommunityIcons size={size * 0.52} color="#FFFFFF" />
            </View>
        );
    }

    const initial = (name ?? 'B').trim().charAt(0).toUpperCase() || 'B';
    return (
        <View style={[box, styles.center, { backgroundColor: HOME.primary }]}>
            <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
});