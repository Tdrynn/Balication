import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Image, View } from 'react-native';

import type { Kind } from '@/lib/destinations';

type IconName = ComponentProps<typeof Ionicons>['name'];

const FALLBACK: Record<Kind, { icon: IconName; color: string }> = {
    Destination: { icon: 'leaf', color: '#4E8F86' },
    Activity: { icon: 'walk', color: '#3A7C99' },
    Accommodation: { icon: 'bed', color: '#6A86B8' },
};

type Props = {
    uri?: string;
    kind: Kind;
    /** wajib angka: Image tanpa ukuran eksplisit akan tampil zoom */
    width: number;
    height: number;
    radius?: number;
};

/** Gambar destinasi; jika URL kosong atau gagal dimuat, tampil blok warna dengan ikon. */
export function Cover({ uri, kind, width, height, radius = 0 }: Props) {
    const [failed, setFailed] = useState(false);
    const box = { width, height, borderRadius: radius };

    if (uri && !failed) {
        return (
            <Image
                source={{ uri }}
                resizeMode="cover"
                onError={() => setFailed(true)}
                style={box}
            />
        );
    }

    const fallback = FALLBACK[kind];
    return (
        <View
            style={[
                box,
                { backgroundColor: fallback.color, alignItems: 'center', justifyContent: 'center' },
            ]}
        >
            <Ionicons name={fallback.icon} size={Math.min(width, height) * 0.4} color="#FFFFFF" />
        </View>
    );
}