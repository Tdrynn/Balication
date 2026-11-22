import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterToggle, animateLayout } from '@/components/search/filter-toggle';
import { OptionSheet } from '@/components/search/option-sheet';
import { ResultCard } from '@/components/search/result-card';
import { HOME, SIDE } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import { useRemote } from '@/hooks/use-remote';
import {
    KINDS,
    PRICE_OPTIONS,
    RATING_OPTIONS,
    fetchDestinations,
    type Kind,
    type Option,
} from '@/lib/destinations';
import { REGENCIES } from '@/lib/regencies';
import { regencyLabel } from '@/lib/regency-label';
import type { TranslationKey } from '@/lib/translations';
import { useWishlist } from '@/lib/wishlist-store';

type KindFilter = 'All' | Kind;
type SheetName = 'category' | 'location' | 'price' | 'rating' | null;

const ANY = 'any';
const KIND_CHIPS: KindFilter[] = ['All', ...KINDS];
const KIND_KEYS: Record<KindFilter, TranslationKey> = {
    All: 'filter.all',
    Destination: 'kind.destination',
    Activity: 'kind.activity',
    Accommodation: 'kind.accommodation',
};

function FilterPill({
    label,
    active,
    icon,
    onPress,
}: {
    label: string;
    active: boolean;
    icon?: 'options-outline';
    onPress: () => void;
}) {
    const color = active ? '#FFFFFF' : HOME.primary;
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
        >
            {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
            <Text style={[styles.pillText, { color }]} numberOfLines={1}>
                {label}
            </Text>
            {icon ? null : <Ionicons name="chevron-down" size={14} color={color} />}
        </Pressable>
    );
}

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useLanguage();
    const wishlist = useWishlist();
    const params = useLocalSearchParams<{ type?: string }>();

    const [query, setQuery] = useState('');
    const [kind, setKind] = useState<KindFilter>(
        KIND_CHIPS.find((k) => k === params.type) ?? 'All',
    );
    const [category, setCategory] = useState(ANY);
    const [regencyId, setRegencyId] = useState(ANY);
    const [priceId, setPriceId] = useState(ANY);
    const [ratingId, setRatingId] = useState(ANY);
    const [sheet, setSheet] = useState<SheetName>(null);
    // Panel filter disembunyikan dulu supaya layar tidak ramai; lencana menunjukkan filter aktif
    const [filtersOpen, setFiltersOpen] = useState(false);

    const destinations = useRemote(fetchDestinations);
    const all = destinations.data ?? [];

    // Pilihan kategori diambil dari data yang ada
    const categoryOptions: Option[] = [
        { id: ANY, label: t('filter.anyCategory') },
        ...[...new Set(all.map((d) => d.category))].map((c) => ({ id: c, label: c })),
    ];
    const locationOptions: Option[] = [
        { id: ANY, label: t('filter.allLocations') },
        ...REGENCIES.map((r) => ({ id: r.id, label: regencyLabel(r, t) })),
    ];
    const priceOptions: Option[] = PRICE_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }));
    const ratingOptions: Option[] = RATING_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }));

    const labelOf = (options: Option[], id: string, fallback: string) =>
        id === ANY ? fallback : (options.find((o) => o.id === id)?.label ?? fallback);

    // Saring data
    const text = query.trim().toLowerCase();
    const price = PRICE_OPTIONS.find((o) => o.id === priceId) ?? PRICE_OPTIONS[0];
    const minRating = RATING_OPTIONS.find((o) => o.id === ratingId)?.min ?? 0;

    const results = all.filter((d) => {
        if (kind !== 'All' && d.kind !== kind) return false;
        if (category !== ANY && d.category !== category) return false;
        if (regencyId !== ANY && d.regencyId !== regencyId) return false;
        if (!price.test(d.price)) return false;
        if (d.rating < minRating) return false;
        if (!text) return true;
        return [d.name, d.area, d.category, d.description, ...d.tags]
            .join(' ')
            .toLowerCase()
            .includes(text);
    });

    const activeCount = [
        kind !== 'All',
        category !== ANY,
        regencyId !== ANY,
        priceId !== ANY,
        ratingId !== ANY,
    ].filter(Boolean).length;
    const filtersActive = activeCount > 0;

    const toggleFilters = () => {
        animateLayout();
        setFiltersOpen((open) => !open);
    };

    const reset = () => {
        setKind('All');
        setCategory(ANY);
        setRegencyId(ANY);
        setPriceId(ANY);
        setRatingId(ANY);
    };

    const sheetProps: Record<
        Exclude<SheetName, null>,
        { title: string; options: Option[]; selectedId: string; onSelect: (id: string) => void }
    > = {
        category: {
            title: t('filter.category'),
            options: categoryOptions,
            selectedId: category,
            onSelect: setCategory,
        },
        location: {
            title: t('filter.location'),
            options: locationOptions,
            selectedId: regencyId,
            onSelect: setRegencyId,
        },
        price: {
            title: t('filter.priceRange'),
            options: priceOptions,
            selectedId: priceId,
            onSelect: setPriceId,
        },
        rating: {
            title: t('filter.rating'),
            options: ratingOptions,
            selectedId: ratingId,
            onSelect: setRatingId,
        },
    };
    const activeSheet = sheet ? sheetProps[sheet] : null;

    const open = (id: string) =>
        router.push({ pathname: '/destination/[id]', params: { id } });

    const header = (
        <Text style={styles.count}>
            {t(results.length === 1 ? 'search.count.one' : 'search.count.other', { count: results.length })}
        </Text>
    );

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            {/* Bagian atas: judul, kolom cari, filter */}
            <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
                <View style={styles.titleRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('common.back')}
                        hitSlop={10}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={28} color={HOME.title} />
                    </Pressable>
                    <Text style={styles.title}>{t('search.title')}</Text>
                </View>

                <View style={styles.search}>
                    <Ionicons name="search" size={20} color={HOME.primary} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={!params.type}
                        placeholder={t('home.search.placeholder')}
                        placeholderTextColor={HOME.muted}
                        returnKeyType="search"
                        autoCorrect={false}
                        style={styles.searchInput}
                    />
                    {query ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('search.clear')}
                            hitSlop={10}
                            onPress={() => setQuery('')}
                        >
                            <Ionicons name="close-circle" size={18} color={HOME.muted} />
                        </Pressable>
                    ) : null}
                </View>

                {/* Tombol Filter: menampilkan / menyembunyikan panel di bawahnya */}
                <FilterToggle
                    open={filtersOpen}
                    onToggle={toggleFilters}
                    activeCount={activeCount}
                    trailing={
                        filtersActive ? (
                            <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
                                <Text style={styles.link}>{t('filter.reset')}</Text>
                            </Pressable>
                        ) : null
                    }
                />

                {filtersOpen ? (
                    <>
                        {/* Jenis */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.row}
                        >
                            {KIND_CHIPS.map((item) => {
                                const selected = item === kind;
                                return (
                                    <Pressable
                                        key={item}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected }}
                                        onPress={() => setKind(item)}
                                        style={[styles.kind, selected && styles.kindActive]}
                                    >
                                        <Text style={[styles.kindText, selected && styles.kindTextActive]}>
                                            {t(KIND_KEYS[item])}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {/* Filter */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.row}
                        >
                            <FilterPill
                                label={labelOf(categoryOptions, category, t('filter.category'))}
                                active={category !== ANY}
                                onPress={() => setSheet('category')}
                            />
                            <FilterPill
                                label={labelOf(locationOptions, regencyId, t('filter.location'))}
                                active={regencyId !== ANY}
                                onPress={() => setSheet('location')}
                            />
                            <FilterPill
                                label={labelOf(priceOptions, priceId, t('filter.priceRange'))}
                                active={priceId !== ANY}
                                onPress={() => setSheet('price')}
                            />
                            <FilterPill
                                label={labelOf(ratingOptions, ratingId, t('filter.rating'))}
                                active={ratingId !== ANY}
                                onPress={() => setSheet('rating')}
                            />
                        </ScrollView>
                    </>
                ) : null}
            </View>

            {/* Hasil */}
            {destinations.loading && !destinations.data ? (
                <View style={styles.state}>
                    <ActivityIndicator color={HOME.primary} />
                </View>
            ) : destinations.error && !destinations.data ? (
                <View style={styles.state}>
                    <Text style={styles.errorText}>
                        {__DEV__ ? `${t('common.loadError')} (${destinations.error})` : t('common.loadError')}
                    </Text>
                    <Pressable onPress={destinations.reload} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.link}>{t('common.retry')}</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.countRow}>
                            {header}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={40} color={HOME.muted} />
                            <Text style={styles.emptyTitle}>{t('search.empty.title')}</Text>
                            <Text style={styles.emptyText}>{t('search.empty.text')}</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
                    renderItem={({ item }) => (
                        <ResultCard
                            destination={item}
                            wished={wishlist.has(item.id)}
                            onPress={() => open(item.id)}
                            onToggleWish={() => wishlist.toggle(item.id)}
                        />
                    )}
                />
            )}

            <OptionSheet
                visible={activeSheet !== null}
                title={activeSheet?.title ?? ''}
                options={activeSheet?.options ?? []}
                selectedId={activeSheet?.selectedId ?? ANY}
                onSelect={activeSheet?.onSelect ?? (() => { })}
                onClose={() => setSheet(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: HOME.bg,
    },
    pressed: {
        opacity: 0.75,
    },
    top: {
        gap: 14,
        paddingBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SIDE - 6,
    },
    title: {
        color: HOME.title,
        fontSize: 24,
        fontWeight: '800',
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: SIDE,
        paddingHorizontal: 14,
        height: 52,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#BBD2CE',
        backgroundColor: '#FFFFFF',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: HOME.title,
        fontSize: 14,
    },
    row: {
        gap: 8,
        paddingHorizontal: SIDE,
    },
    kind: {
        paddingHorizontal: 18,
        height: 38,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#BBD2CE',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    kindActive: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    kindText: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    kindTextActive: {
        color: '#FFFFFF',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 38,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#BBD2CE',
        backgroundColor: '#FFFFFF',
    },
    pillActive: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
        maxWidth: 140,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    count: {
        color: HOME.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    link: {
        color: HOME.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: SIDE,
        paddingTop: 4,
    },
    separator: {
        height: 12,
    },
    state: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingBottom: 80,
    },
    errorText: {
        color: HOME.error,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    empty: {
        alignItems: 'center',
        gap: 6,
        paddingTop: 60,
    },
    emptyTitle: {
        color: HOME.title,
        fontSize: 16,
        fontWeight: '800',
    },
    emptyText: {
        color: HOME.muted,
        fontSize: 13,
        textAlign: 'center',
    },
});
