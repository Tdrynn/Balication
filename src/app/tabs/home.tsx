import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, type ComponentProps } from 'react';
import {
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCarousel } from '@/components/home/hero-carousel';
import { HOME, SIDE } from '@/components/home/home-theme';
import { PopularDestinations } from '@/components/home/popular-destinations';
import { WeatherCard } from '@/components/home/weather-card';
import { useAuth } from '@/context/auth';
import { useRegency } from '@/hooks/use-regency';
import { useRemote } from '@/hooks/use-remote';
import { fetchPopularDestinations, fetchWeather } from '@/lib/api';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Logo aplikasi. Ganti jika file logo Anda ada di tempat lain.
const LOGO = require('@/assets/images/icon.png');

const CATEGORIES: { label: string; icon: IconName; color: string }[] = [
    { label: 'Destination', icon: 'map-outline', color: '#17403E' },
    { label: 'Activity', icon: 'walk-outline', color: '#2F8F8A' },
    { label: 'Accommodation', icon: 'home-outline', color: '#6F9FD0' },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { account } = useAuth();

    // Dua sumber data. Masing-masing punya status loading dan error sendiri.
    // Cuaca mengikuti kabupaten yang dipilih; berganti kabupaten = memuat ulang otomatis
    const { regency, auto, select, locate } = useRegency();
    const loadWeather = useCallback(
        (signal: AbortSignal) => fetchWeather(regency, signal),
        [regency],
    );
    const weather = useRemote(loadWeather);
    const destinations = useRemote(fetchPopularDestinations);

    const initial = (account?.name ?? 'B').trim().charAt(0).toUpperCase() || 'B';

    // Spinner tarik-untuk-muat hanya muncul saat memuat ulang (bukan saat pertama kali)
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
                {/* Header */}
                <View style={styles.header}>
                    <Image source={LOGO} resizeMode="contain" style={styles.logo} />
                    <Text style={styles.brand}>Balication</Text>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                </View>

                {/* Pencarian */}
                <View style={styles.search}>
                    <Ionicons name="search" size={18} color={HOME.muted} />
                    <TextInput
                        placeholder="find destinations, accommodation and activities..."
                        placeholderTextColor={HOME.muted}
                        returnKeyType="search"
                        // TODO: kirim kata kunci ke halaman Explore atau endpoint pencarian
                        onSubmitEditing={() => { }}
                        style={styles.searchInput}
                    />
                </View>

                {/* Carousel */}
                <HeroCarousel />

                {/* Rencanakan perjalanan */}
                <View style={styles.plan}>
                    <Text style={styles.planTitle}>Plan your travel</Text>
                    <Text style={styles.planSub}>
                        Let AI find the perfect destinations based your preferences.
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        // TODO: arahkan ke halaman Chat Bot
                        onPress={() => { }}
                        style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.planButtonText}>find some destinations for me</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                    </Pressable>
                </View>

                {/* Kategori */}
                <View style={styles.categories}>
                    {CATEGORIES.map((item) => (
                        <Pressable
                            key={item.label}
                            accessibilityRole="button"
                            // TODO: buka daftar sesuai kategori
                            onPress={() => { }}
                            style={({ pressed }) => [styles.category, pressed && styles.pressed]}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                                <Ionicons name={item.icon} size={30} color="#FFFFFF" />
                            </View>
                            <Text style={styles.categoryLabel}>{item.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Cuaca (Open-Meteo) */}
                <WeatherCard
                    weather={weather}
                    regency={regency}
                    auto={auto}
                    onSelect={select}
                    onLocate={locate}
                />

                {/* Destinasi populer (API Anda) */}
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
        gap: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: SIDE,
    },
    logo: {
        width: 38,
        height: 38,
        borderRadius: 10,
    },
    brand: {
        flex: 1,
        color: HOME.title,
        fontSize: 22,
        fontWeight: '800',
    },
    avatar: {
        width: 42,
        height: 42,
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
    searchInput: {
        flex: 1,
        height: '100%',
        color: HOME.title,
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