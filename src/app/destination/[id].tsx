import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/destination/cover';
import { HOME, SIDE } from '@/components/home/home-theme';
import { useRemote } from '@/hooks/use-remote';
import { fetchDestinations, formatCount, priceLabel } from '@/lib/destinations';
import { useWishlist } from '@/lib/wishlist-store';

const HERO_HEIGHT = 300;
const SHEET_OVERLAP = 30;

export default function DestinationDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const wishlist = useWishlist();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [slide, setSlide] = useState(0);
    const { data, loading, error, reload } = useRemote(fetchDestinations);
    const destination = data?.find((d) => d.id === id);

    const onScrollEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            setSlide(Math.round(event.nativeEvent.contentOffset.x / width));
        },
        [width],
    );

    const backButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={[styles.back, { top: insets.top + 8 }]}
        >
            <Ionicons name="chevron-back" size={24} color={HOME.title} />
        </Pressable>
    );

    if (!destination) {
        return (
            <View style={styles.state}>
                <StatusBar style="dark" />
                {loading && !data ? (
                    <ActivityIndicator color={HOME.primary} />
                ) : error && !data ? (
                    <>
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable onPress={reload} accessibilityRole="button" hitSlop={8}>
                            <Text style={styles.link}>Coba lagi</Text>
                        </Pressable>
                    </>
                ) : (
                    <Text style={styles.errorText}>Destinasi tidak ditemukan.</Text>
                )}
                {backButton}
            </View>
        );
    }

    const wished = wishlist.has(destination.id);
    const slides: (string | undefined)[] =
        destination.images.length > 0 ? destination.images : [undefined];

    const openMaps = () => {
        const place = encodeURIComponent(`${destination.name} ${destination.area}`);
        const hasCoords =
            destination.latitude !== undefined && destination.longitude !== undefined;
        const query = hasCoords ? `${destination.latitude},${destination.longitude}` : place;
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        });
    };

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Carousel gambar */}
                <View>
                    <FlatList
                        data={slides}
                        horizontal
                        pagingEnabled
                        bounces={false}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => String(index)}
                        onMomentumScrollEnd={onScrollEnd}
                        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                        renderItem={({ item }) => (
                            <Cover uri={item} kind={destination.kind} width={width} height={HERO_HEIGHT} />
                        )}
                    />

                    {slides.length > 1 ? (
                        <>
                            <View style={styles.dots} pointerEvents="none">
                                {slides.map((_, index) => (
                                    <View key={index} style={[styles.dot, index === slide && styles.dotActive]} />
                                ))}
                            </View>
                            <View style={styles.counter} pointerEvents="none">
                                <Text style={styles.counterText}>
                                    {slide + 1}/{slides.length}
                                </Text>
                            </View>
                        </>
                    ) : null}
                </View>

                {/* Lembar informasi */}
                <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.titleRow}>
                        <View style={styles.pin}>
                            <Ionicons name="location" size={26} color={HOME.primary} />
                        </View>
                        <View style={styles.titleText}>
                            <Text style={styles.name}>{destination.name}</Text>
                            <Text style={styles.area}>{destination.area || '-'}</Text>
                        </View>

                        <View style={styles.ratingBox}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                                hitSlop={10}
                                onPress={() => wishlist.toggle(destination.id)}
                            >
                                <Ionicons
                                    name={wished ? 'heart' : 'heart-outline'}
                                    size={24}
                                    color={wished ? '#E53935' : HOME.muted}
                                />
                            </Pressable>
                            <Ionicons name="star" size={20} color={HOME.dark} />
                            <Text style={styles.rating}>
                                {destination.rating.toFixed(1)}
                                {destination.reviews !== undefined ? (
                                    <Text style={styles.reviews}> ({formatCount(destination.reviews)})</Text>
                                ) : null}
                            </Text>
                        </View>
                    </View>

                    {destination.tags.length > 0 ? (
                        <View style={styles.tags}>
                            {destination.tags.map((tag) => (
                                <View key={tag} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {destination.description ? (
                        <>
                            <Text style={styles.heading}>Description</Text>
                            <Text style={styles.description}>{destination.description}</Text>
                        </>
                    ) : null}

                    <View style={styles.hoursRow}>
                        <View style={styles.clock}>
                            <Ionicons name="time" size={26} color="#FFFFFF" />
                        </View>
                        <View>
                            <Text style={styles.hoursLabel}>Open Hours:</Text>
                            <Text style={styles.hoursValue}>{destination.hours}</Text>
                        </View>
                    </View>

                    <View style={styles.spacer} />

                    {/* Tiket dan lokasi */}
                    <View style={styles.actions}>
                        <View style={styles.action}>
                            <Ionicons name="ticket" size={34} color={HOME.primary} />
                            <View style={styles.actionText}>
                                <Text style={styles.actionLabel}>Ticket</Text>
                                <Text style={styles.actionValue}>{priceLabel(destination)}</Text>
                            </View>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Buka di peta"
                            onPress={openMaps}
                            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                        >
                            <Ionicons name="map" size={34} color={HOME.primary} />
                            <View style={styles.actionText}>
                                <Text style={styles.actionLabel}>Location</Text>
                                <Text style={styles.actionValue}>See on Maps</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>

            {backButton}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
    },
    pressed: {
        opacity: 0.75,
    },
    state: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: HOME.bg,
    },
    errorText: {
        color: HOME.error,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    link: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    back: {
        position: 'absolute',
        left: SIDE,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dots: {
        position: 'absolute',
        bottom: SHEET_OVERLAP + 14,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
    },
    dotActive: {
        width: 20,
        backgroundColor: '#FFFFFF',
    },
    counter: {
        position: 'absolute',
        right: SIDE,
        bottom: SHEET_OVERLAP + 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    sheet: {
        flexGrow: 1,
        marginTop: -SHEET_OVERLAP,
        paddingHorizontal: 22,
        paddingTop: 22,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 28,
        backgroundColor: '#FFFFFF',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pin: {
        width: 28,
        alignItems: 'center',
    },
    titleText: {
        flex: 1,
    },
    name: {
        color: HOME.title,
        fontSize: 19,
        fontWeight: '800',
    },
    area: {
        color: HOME.body,
        fontSize: 12,
        marginTop: 1,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rating: {
        color: HOME.title,
        fontSize: 15,
        fontWeight: '800',
    },
    reviews: {
        color: HOME.muted,
        fontSize: 11,
        fontWeight: '400',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 18,
    },
    tag: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: HOME.primary,
    },
    tagText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    heading: {
        marginTop: 24,
        marginBottom: 8,
        color: HOME.primary,
        fontSize: 18,
        fontWeight: '800',
    },
    description: {
        color: HOME.body,
        fontSize: 13,
        lineHeight: 21,
    },
    hoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 22,
    },
    clock: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hoursLabel: {
        color: HOME.body,
        fontSize: 13,
    },
    hoursValue: {
        marginTop: 4,
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    spacer: {
        flex: 1,
        minHeight: 28,
    },
    actions: {
        flexDirection: 'row',
        gap: 14,
    },
    action: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#C9DAD6',
        backgroundColor: '#FFFFFF',
    },
    actionText: {
        flex: 1,
        alignItems: 'center',
    },
    actionLabel: {
        color: HOME.body,
        fontSize: 12,
    },
    actionValue: {
        marginTop: 3,
        color: HOME.primary,
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center',
    },
});