import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/destination/cover';
import { HOME, SIDE } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import { useRemote } from '@/hooks/use-remote';
import { fetchDestinations, KINDS, shortPrice, type Destination, type Kind } from '@/lib/destinations';
import {
    buildItinerary,
    candidates,
    preselect,
    saveItinerary,
    setTripDraft,
    useTripDraft,
} from '@/lib/itinerary';
import type { TranslationKey } from '@/lib/translations';
import { useWishlist } from '@/lib/wishlist-store';

const KIND_KEYS: Record<Kind, TranslationKey> = {
    Destination: 'kind.destination',
    Activity: 'kind.activity',
    Accommodation: 'kind.accommodation',
};

const IMAGE_SIZE = 92;

/** Layar 2 dari 2: pilih destinasi (sudah tercentang otomatis) lalu buat itinerary. */
export default function TripRecommendationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useLanguage();
    const draft = useTripDraft();
    const wishlist = useWishlist();
    const { data, loading, error, reload } = useRemote(fetchDestinations);

    const [kind, setKind] = useState<Kind>('Destination');
    // null = belum ada perubahan dari pengguna, pakai pilihan otomatis
    const [picked, setPicked] = useState<string[] | null>(null);

    const list = data ? candidates(data, draft) : [];
    const selectedIds = picked ?? (data ? preselect(list, draft) : []);
    const shown = list.filter((d) => d.kind === kind);

    const toggle = (id: string) =>
        setPicked((current) => {
            const base = current ?? selectedIds;
            return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
        });

    const visitCount = list.filter(
        (d) => d.kind !== 'Accommodation' && selectedIds.includes(d.id),
    ).length;

    const generate = () => {
        const chosen = list.filter((d) => selectedIds.includes(d.id));
        setTripDraft({ selectedIds });
        saveItinerary(buildItinerary(chosen, { ...draft, selectedIds }));
        router.navigate('/tabs/itinerary' as Href);
    };

    const renderItem = ({ item }: { item: Destination }) => {
        const checked = selectedIds.includes(item.id);
        const wished = wishlist.has(item.id);
        return (
            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(item.id)}
                style={[styles.card, checked && styles.cardOn]}
            >
                <Cover
                    uri={item.images[0]}
                    kind={item.kind}
                    width={IMAGE_SIZE}
                    height={IMAGE_SIZE}
                    radius={16}
                />

                <View style={styles.body}>
                    <View style={styles.titleRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={wished ? t('card.removeWish') : t('card.addWish')}
                            hitSlop={8}
                            onPress={() => wishlist.toggle(item.id)}
                        >
                            <Ionicons
                                name={wished ? 'heart' : 'heart-outline'}
                                size={20}
                                color={wished ? '#E53935' : HOME.muted}
                            />
                        </Pressable>
                        <View style={[styles.box, checked && styles.boxOn]}>
                            {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Ionicons name="location" size={12} color={HOME.primary} />
                        <Text style={styles.area} numberOfLines={1}>
                            {item.area}
                        </Text>
                    </View>

                    <View style={styles.pill}>
                        <Text style={styles.pillText} numberOfLines={1}>
                            {item.category}
                        </Text>
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.row}>
                            <Ionicons name="star" size={12} color="#F0A93A" />
                            <Text style={styles.rating}>{item.rating.toFixed(1)}/5</Text>
                            <Text style={styles.price}>
                                · {item.price === 0 ? t('filter.price.free') : shortPrice(item.price)}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={() =>
                                router.push({ pathname: '/destination/[id]', params: { id: item.id } })
                            }
                            style={styles.row}
                        >
                            <Text style={styles.detail}>{t('trip.viewDetail')}</Text>
                            <Ionicons name="chevron-forward" size={14} color={HOME.title} />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        );
    };

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
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                        {t('trip.rec.title')}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {t('trip.rec.subtitle')}
                    </Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.kindScroll}
                contentContainerStyle={styles.kinds}
            >
                {KINDS.map((k) => {
                    const on = kind === k;
                    return (
                        <Pressable
                            key={k}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() => setKind(k)}
                            style={[styles.kind, on && styles.kindOn]}
                        >
                            <Text style={[styles.kindText, on && styles.kindTextOn]}>{t(KIND_KEYS[k])}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

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
                    data={shown}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    extraData={selectedIds}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={<Text style={styles.empty}>{t('trip.rec.empty')}</Text>}
                    contentContainerStyle={{
                        paddingHorizontal: SIDE,
                        paddingTop: 6,
                        paddingBottom: insets.bottom + 100,
                    }}
                />
            )}

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    accessibilityRole="button"
                    disabled={visitCount === 0}
                    onPress={generate}
                    style={({ pressed }) => [
                        styles.generate,
                        visitCount === 0 && styles.generateOff,
                        pressed && styles.pressed,
                    ]}
                >
                    <Text style={styles.generateText}>{t('trip.generate')}</Text>
                </Pressable>
            </View>
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
        color: HOME.title,
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        color: HOME.body,
        fontSize: 13,
    },
    kindScroll: {
        flexGrow: 0,
    },
    kinds: {
        gap: 8,
        paddingHorizontal: SIDE,
        paddingBottom: 10,
    },
    kind: {
        paddingHorizontal: 18,
        height: 36,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: HOME.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kindOn: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    kindText: {
        color: HOME.body,
        fontSize: 13,
        fontWeight: '600',
    },
    kindTextOn: {
        color: '#FFFFFF',
    },
    card: {
        flexDirection: 'row',
        gap: 12,
        padding: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: HOME.border,
        backgroundColor: HOME.card,
    },
    cardOn: {
        borderColor: HOME.primary,
    },
    body: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        flex: 1,
        color: HOME.title,
        fontSize: 15,
        fontWeight: '800',
    },
    box: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: HOME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxOn: {
        backgroundColor: HOME.primary,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    area: {
        flexShrink: 1,
        color: HOME.body,
        fontSize: 11,
    },
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: HOME.border,
        justifyContent: 'center',
    },
    pillText: {
        color: HOME.body,
        fontSize: 10,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    rating: {
        color: HOME.body,
        fontSize: 11,
    },
    price: {
        color: HOME.muted,
        fontSize: 11,
    },
    detail: {
        color: HOME.title,
        fontSize: 12,
        fontWeight: '600',
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
        paddingTop: 40,
        color: HOME.muted,
        fontSize: 13,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: SIDE,
        paddingTop: 10,
    },
    generate: {
        height: 54,
        borderRadius: 27,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateOff: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.85,
    },
    generateText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});