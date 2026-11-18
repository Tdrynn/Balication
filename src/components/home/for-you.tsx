import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cover } from '@/components/destination/cover';
import { useLanguage } from '@/context/language';
import { usePreferences } from '@/context/preferences';
import { useRemote } from '@/hooks/use-remote';
import { fetchDestinations } from '@/lib/destinations';
import { recommend, type Recommendation } from '@/lib/preference-categories';

import { HOME, SIDE } from './home-theme';

// Ukuran dan gaya sama dengan "Popular Destination" agar kedua bagian terlihat serasi
const IMAGE_SIZE = 96;

function Card({ item, onPress }: { item: Recommendation; onPress: () => void }) {
    const { t } = useLanguage();
    const { destination, matches } = item;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('card.viewDetailOf', { name: destination.name })}
            onPress={onPress}
            style={styles.card}
        >
            <Cover
                uri={destination.images[0]}
                kind={destination.kind}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                radius={24}
            />

            <Text style={styles.name} numberOfLines={1}>
                {destination.name}
            </Text>

            {destination.area ? (
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={HOME.primary} />
                    <Text style={styles.location} numberOfLines={1}>
                        {destination.area}
                    </Text>
                </View>
            ) : null}

            {/* Kategori pilihan pengguna yang cocok: alasan destinasi ini muncul di sini */}
            <View style={styles.locationRow}>
                <Ionicons name="sparkles" size={11} color={HOME.primary} />
                <Text style={styles.reason} numberOfLines={1}>
                    {t(matches[0].labelKey)}
                </Text>
            </View>
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

/** Bagian "Rekomendasi untuk Anda" di Home, berdasarkan preferensi yang dipilih pengguna. */
export function ForYou() {
    const router = useRouter();
    const { t } = useLanguage();
    const { categories } = usePreferences();
    const { data, loading, error, reload } = useRemote(fetchDestinations);

    if (categories.length === 0) return null;

    // Home hanya menampilkan beberapa teratas; daftar lengkap ada di "Show all"
    const items = recommend(data ?? [], categories, 8);

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('foryou.title')}</Text>
                <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.push('/recommendations')}
                >
                    <Text style={styles.edit}>{t('foryou.showAll')}</Text>
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
                    <Text style={styles.errorText}>
                        {__DEV__ && error ? `${t('common.loadError')} (${error})` : t('common.loadError')}
                    </Text>
                    <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
                        <Text style={styles.retry}>{t('common.retry')}</Text>
                    </Pressable>
                </View>
            )}

            {data && items.length === 0 && (
                <View style={styles.message}>
                    <Text style={styles.emptyText}>{t('foryou.empty')}</Text>
                </View>
            )}

            {data && items.length > 0 && (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.destination.id}
                    renderItem={({ item }) => (
                        <Card
                            item={item}
                            onPress={() =>
                                router.push({
                                    pathname: '/destination/[id]',
                                    params: { id: item.destination.id },
                                })
                            }
                        />
                    )}
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
    edit: {
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
    reason: {
        color: HOME.primary,
        fontSize: 11,
        fontWeight: '600',
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
        textAlign: 'center',
    },
    retry: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});