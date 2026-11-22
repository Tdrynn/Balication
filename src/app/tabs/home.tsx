import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BrandName } from '@/components/brand-name';
import { useLanguage } from '@/context/language';
import type { TranslationKey } from '@/lib/translations';
import { useCallback, type ComponentProps } from 'react';
import {
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCarousel } from '@/components/home/hero-carousel';
import { HOME, SIDE } from '@/components/home/home-theme';
import { PopularDestinations } from '@/components/home/popular-destinations';
import { ForYou } from '@/components/home/for-you';
import { WeatherCard } from '@/components/home/weather-card';
import { useAuth } from '@/context/auth';
import { useRegency } from '@/hooks/use-regency';
import { useRemote } from '@/hooks/use-remote';
import { fetchPopularDestinations, fetchWeather } from '@/lib/api';
import { Avatar } from '@/components/profile/avatar';

type IconName = ComponentProps<typeof Ionicons>['name'];

const LOGO = require('@/assets/images/icon.png');

const CATEGORIES: { type: string; labelKey: TranslationKey; icon: IconName; color: string }[] = [
    { type: 'Destination', labelKey: 'kind.destination', icon: 'map-outline', color: '#17403E' },
    { type: 'Activity', labelKey: 'kind.activity', icon: 'walk-outline', color: '#2F8F8A' },
    { type: 'Accommodation', labelKey: 'kind.accommodation', icon: 'home-outline', color: '#6F9FD0' },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { account } = useAuth();
    const { t } = useLanguage();

    const { regency, auto, select, locate } = useRegency();
    const loadWeather = useCallback(
        (signal: AbortSignal) => fetchWeather(regency, signal),
        [regency],
    );
    const weather = useRemote(loadWeather);
    const destinations = useRemote(fetchPopularDestinations);

    const initial = (account?.name ?? 'B').trim().charAt(0).toUpperCase() || 'B';

    const refreshing =
        (weather.loading && weather.data?.regencyId === regency.id) ||
        (destinations.loading && destinations.data !== null);

    const onRefresh = () => {
        weather.reload();
        destinations.reload();
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={HOME.primary}
                        colors={[HOME.primary]}
                    />
                }
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + 12, paddingBottom: 130 },
                ]}
            >
                {/* Header logo, brand, dan profile */}
                <View style={styles.header}>
                    <Image source={LOGO} resizeMode="contain" style={styles.logo} />
                    <View style={styles.brandWrap}>
                        <BrandName scale={0.6} />
                    </View>
                    <View style={styles.avatar}>
                        <Avatar avatarId={account?.avatar} size={38} />
                    </View>
                </View>

                {/* Kotak pencarian */}
                <Pressable
                    accessibilityRole="search"
                    accessibilityLabel={t('home.search.a11y')}
                    onPress={() => router.push('/search')}
                    style={({ pressed }) => [styles.search, pressed && styles.pressed]}
                >
                    <Ionicons name="search" size={18} color={HOME.muted} />
                    <Text style={styles.searchText} numberOfLines={1}>
                        {t('home.search.placeholder')}
                    </Text>
                </Pressable>

                {/* Carousel gambar */}
                <HeroCarousel />

                {/* Travel plan */}
                <View style={styles.plan}>
                    <Text style={styles.planTitle}>{t('home.plan.title')}</Text>
                    <Text style={styles.planSub}>
                        {t('home.plan.sub')}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        // TODO: arahkan ke halaman Chat Bot
                        onPress={() => { }}
                        style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.planButtonText}>{t('home.plan.button')}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                    </Pressable>
                </View>

                {/* Kategori */}
                <View style={styles.categories}>
                    {CATEGORIES.map((item) => (
                        <Pressable
                            key={item.type}
                            accessibilityRole="button"
                            onPress={() => router.push({ pathname: '/search', params: { type: item.type } })}
                            style={({ pressed }) => [styles.category, pressed && styles.pressed]}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                                <Ionicons name={item.icon} size={30} color="#FFFFFF" />
                            </View>
                            <Text style={styles.categoryLabel}>{t(item.labelKey)}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Cuaca */}
                <WeatherCard
                    weather={weather}
                    regency={regency}
                    auto={auto}
                    onSelect={select}
                    onLocate={locate}
                />

                {/* Rekomendasi berdasarkan preferensi pengguna */}
                <ForYou />

                {/* Rekomendasi wisata populer */}
                <PopularDestinations destinations={destinations} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: HOME.bg,
    },
    content: {
        gap: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: SIDE,
    },
    logo: {
        width: 38,
        height: 38,
        borderRadius: 10,
    },
    brandWrap: {
        flex: 1,
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 21,
        backgroundColor: HOME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: SIDE,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 16,
        backgroundColor: HOME.card,
        borderWidth: 1,
        borderColor: HOME.border,
    },
    searchText: {
        flex: 1,
        color: HOME.muted,
        fontSize: 13,
    },
    plan: {
        marginHorizontal: SIDE,
        padding: 12,
        gap: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    planTitle: {
        color: HOME.title,
        fontSize: 15,
        fontWeight: '800',
    },
    planSub: {
        color: HOME.muted,
        fontSize: 11,
    },
    planButton: {
        marginTop: 6,
        height: 40,
        borderRadius: 14,
        backgroundColor: HOME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    planButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    categories: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: SIDE,
    },
    category: {
        alignItems: 'center',
        gap: 8,
    },
    categoryIcon: {
        width: 66,
        height: 66,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryLabel: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    pressed: {
        opacity: 0.8,
    },
});