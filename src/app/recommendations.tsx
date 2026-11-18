import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME, SIDE } from '@/components/home/home-theme';
import { ResultCard } from '@/components/search/result-card';
import { useLanguage } from '@/context/language';
import { usePreferences } from '@/context/preferences';
import { useRemote } from '@/hooks/use-remote';
import { fetchDestinations } from '@/lib/destinations';
import { findCategory, recommend } from '@/lib/preference-categories';
import { useWishlist } from '@/lib/wishlist-store';

/** Semua destinasi yang cocok dengan preferensi pengguna (dibuka dari "Show all" di Home). */
export default function RecommendationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useLanguage();
    const { categories } = usePreferences();
    const wishlist = useWishlist();
    const { data, loading, error, reload } = useRemote(fetchDestinations);

    const items = recommend(data ?? [], categories, Number.POSITIVE_INFINITY);

    const chips = (
        <View style={styles.header}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
            >
                {categories.map((id) => {
                    const category = findCategory(id);
                    return category ? (
                        <View key={id} style={styles.chip}>
                            <Text style={styles.chipText}>{t(category.labelKey)}</Text>
                        </View>
                    ) : null;
                })}
            </ScrollView>

            {data ? (
                <Text style={styles.count}>
                    {t(items.length === 1 ? 'wishlist.count.one' : 'wishlist.count.other', {
                        count: items.length,
                    })}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.back')}
                    hitSlop={10}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={26} color={HOME.title} />
                </Pressable>
                <Text style={styles.title} numberOfLines={1}>
                    {t('foryou.title')}
                </Text>
            </View>

            {!data && loading ? (
                <ActivityIndicator color={HOME.primary} style={styles.loader} />
            ) : !data ? (
                <View style={styles.state}>
                    <Text style={styles.errorText}>
                        {__DEV__ && error ? `${t('common.loadError')} (${error})` : t('common.loadError')}
                    </Text>
                    <Pressable onPress={reload} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.link}>{t('common.retry')}</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.destination.id}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={chips}
                    ListEmptyComponent={<Text style={styles.empty}>{t('foryou.empty')}</Text>}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <ResultCard
                                destination={item.destination}
                                wished={wishlist.has(item.destination.id)}
                                onPress={() =>
                                    router.push({
                                        pathname: '/destination/[id]',
                                        params: { id: item.destination.id },
                                    })
                                }
                                onToggleWish={() => wishlist.toggle(item.destination.id)}
                            />
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: HOME.bg,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SIDE,
        paddingBottom: 12,
    },
    title: {
        flex: 1,
        color: HOME.title,
        fontSize: 22,
        fontWeight: '800',
    },
    header: {
        gap: 12,
        paddingBottom: 14,
    },
    chips: {
        gap: 8,
        paddingHorizontal: SIDE,
    },
    chip: {
        paddingHorizontal: 14,
        height: 32,
        borderRadius: 999,
        backgroundColor: HOME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    count: {
        paddingHorizontal: SIDE,
        color: HOME.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    item: {
        paddingHorizontal: SIDE,
    },
    separator: {
        height: 12,
    },
    loader: {
        marginTop: 60,
    },
    state: {
        alignItems: 'center',
        gap: 10,
        paddingTop: 60,
        paddingHorizontal: 30,
    },
    errorText: {
        color: HOME.error,
        fontSize: 13,
        textAlign: 'center',
    },
    link: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    empty: {
        paddingHorizontal: SIDE + 10,
        paddingTop: 30,
        color: HOME.muted,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
    },
});