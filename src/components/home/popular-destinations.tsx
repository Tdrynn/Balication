import { Ionicons } from '@expo/vector-icons';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { Remote } from '@/hooks/use-remote';
import type { Destination } from '@/lib/api';

import { HOME, SIDE } from './home-theme';

const IMAGE_SIZE = 96;

function Card({ item }: { item: Destination }) {
    return (
        <Pressable
            accessibilityRole="button"
            // TODO: buka halaman detail destinasi, misalnya router.push(`/destination/${item.id}`)
            onPress={() => { }}
            style={styles.card}
        >
            {item.image ? (
                // Ukuran ditulis eksplisit agar gambar besar tidak tampil membesar
                <Image
                    source={{ uri: item.image }}
                    resizeMode="cover"
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 24 }}
                />
            ) : (
                <View style={[styles.imageFallback, { width: IMAGE_SIZE, height: IMAGE_SIZE }]}>
                    <Ionicons name="image-outline" size={28} color={HOME.muted} />
                </View>
            )}

            <Text style={styles.name} numberOfLines={1}>
                {item.name}
            </Text>

            {item.location ? (
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={HOME.primary} />
                    <Text style={styles.location} numberOfLines={1}>
                        {item.location}
                    </Text>
                </View>
            ) : null}
        </Pressable>
    );
}

function Skeleton() {
    return (
        <View style={styles.card}>
            <View style={[styles.imageFallback, { width: IMAGE_SIZE, height: IMAGE_SIZE }]} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: 50 }]} />
        </View>
    );
}

export function PopularDestinations({ destinations }: { destinations: Remote<Destination[]> }) {
    const { data, loading, error, reload } = destinations;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.heading}>Popular Destination</Text>
                <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    // TODO: buka daftar semua destinasi
                    onPress={() => { }}
                >
                    <Text style={styles.showAll}>Show all</Text>
                </Pressable>
            </View>

            {!data && loading && (
                <View style={styles.row}>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                </View>
            )}

            {!data && !loading && (
                <View style={styles.message}>
                    <Text style={styles.errorText}>{error ?? 'Data belum tersedia'}</Text>
                    <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
                        <Text style={styles.retry}>Coba lagi</Text>
                    </Pressable>
                </View>
            )}

            {data && data.length === 0 && (
                <View style={styles.message}>
                    <Text style={styles.emptyText}>Belum ada destinasi populer.</Text>
                </View>
            )}

            {data && data.length > 0 && (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <Card item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIDE,
    },
    heading: {
        color: HOME.title,
        fontSize: 18,
        fontWeight: '800',
    },
    showAll: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: SIDE,
    },
    card: {
        width: IMAGE_SIZE,
        gap: 4,
    },
    imageFallback: {
        borderRadius: 24,
        backgroundColor: '#D7ECE8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        color: HOME.title,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    location: {
        color: HOME.body,
        fontSize: 11,
        flexShrink: 1,
    },
    skeletonLine: {
        height: 10,
        width: 80,
        borderRadius: 5,
        backgroundColor: '#D7ECE8',
        marginTop: 4,
    },
    message: {
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SIDE,
        paddingVertical: 12,
    },
    errorText: {
        color: HOME.error,
        fontSize: 13,
        textAlign: 'center',
    },
    emptyText: {
        color: HOME.body,
        fontSize: 13,
    },
    retry: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});