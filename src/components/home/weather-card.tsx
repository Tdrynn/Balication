import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocateResult } from '@/hooks/use-regency';
import type { Remote } from '@/hooks/use-remote';
import type { Weather } from '@/lib/api';
import type { Regency } from '@/lib/regencies';

import { HOME, SIDE } from './home-theme';
import { RegencyPicker } from './regency-picker';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Kode cuaca WMO (dari Open-Meteo) -> teks Indonesia + ikon. */
function describe(code: number): { label: string; icon: IconName } {
    if (code === 0) return { label: 'Cerah', icon: 'sunny' };
    if (code <= 2) return { label: 'Cerah berawan', icon: 'partly-sunny' };
    if (code === 3) return { label: 'Berawan', icon: 'cloud' };
    if (code === 45 || code === 48) return { label: 'Berkabut', icon: 'cloudy' };
    if (code >= 51 && code <= 57) return { label: 'Gerimis', icon: 'rainy' };
    if (code >= 61 && code <= 67) return { label: 'Hujan', icon: 'rainy' };
    if (code >= 80 && code <= 82) return { label: 'Hujan deras', icon: 'rainy' };
    if (code >= 95) return { label: 'Badai petir', icon: 'thunderstorm' };
    return { label: 'Berawan', icon: 'cloud' };
}

const show = (value: number, unit: string) =>
    Number.isFinite(value) ? `${Math.round(value)}${unit}` : '-';

/** Tombol kecil untuk mengganti kabupaten. */
function RegencyChip({
    name,
    auto,
    onPress,
}: {
    name: string;
    auto: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ganti lokasi cuaca, sekarang ${name}`}
            hitSlop={6}
            onPress={onPress}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
            {/* Ikon panah = mengikuti lokasi pengguna, pin = dipilih manual */}
            <Ionicons name={auto ? 'navigate' : 'location'} size={13} color={HOME.primary} />
            <Text style={styles.chipText} numberOfLines={1}>
                {name}
            </Text>
            <Ionicons name="chevron-down" size={13} color={HOME.primary} />
        </Pressable>
    );
}

type Props = {
    weather: Remote<Weather>;
    regency: Regency;
    /** true jika cuaca mengikuti lokasi pengguna */
    auto: boolean;
    onSelect: (id: string) => void;
    onLocate: () => Promise<LocateResult>;
};

export function WeatherCard({ weather, regency, auto, onSelect, onLocate }: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const { data, loading, error, reload } = weather;

    // Data yang tampil harus milik kabupaten yang sedang dipilih
    const ready = data !== null && data.regencyId === regency.id;

    const picker = (
        <RegencyPicker
            visible={pickerOpen}
            selectedId={regency.id}
            auto={auto}
            onSelect={onSelect}
            onLocate={onLocate}
            onClose={() => setPickerOpen(false)}
        />
    );

    // Belum ada data untuk kabupaten ini: memuat atau gagal
    if (!ready) {
        return (
            <>
                <View style={[styles.card, styles.center]}>
                    {loading ? (
                        <ActivityIndicator color={HOME.primary} />
                    ) : (
                        <>
                            <Text style={styles.errorText}>{error ?? 'Cuaca belum tersedia'}</Text>
                            <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
                                <Text style={styles.retry}>Coba lagi</Text>
                            </Pressable>
                        </>
                    )}
                    <RegencyChip name={regency.label} auto={auto} onPress={() => setPickerOpen(true)} />
                </View>
                {picker}
            </>
        );
    }

    const { label, icon } = describe(data.code);
    const temperature = show(data.temperature, '°');
    const updated = data.time.slice(11, 16); // "HH:mm"

    return (
        <>
            <View style={styles.card}>
                <View style={styles.box}>
                    <Ionicons name={icon} size={24} color="#FFFFFF" />
                    <Text style={styles.boxTemp}>{temperature}</Text>
                    <Text style={styles.boxPlace} numberOfLines={1}>
                        {regency.name}
                    </Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Cuaca hari ini</Text>
                        {updated ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Update {updated}</Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.summary}>
                        {label} • {temperature} • {show(data.humidity, '%')} kelembapan
                    </Text>

                    <View style={styles.metrics}>
                        <View style={styles.metric}>
                            <Ionicons name="water-outline" size={16} color={HOME.primary} />
                            <Text style={styles.metricText}>{show(data.humidity, '%')}</Text>
                        </View>
                        <View style={styles.metric}>
                            <Ionicons name="speedometer-outline" size={16} color={HOME.primary} />
                            <Text style={styles.metricText}>{show(data.windSpeed, ' km/jam')}</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <RegencyChip name={regency.label} auto={auto} onPress={() => setPickerOpen(true)} />
                        {/* Atribusi wajib sesuai lisensi Open-Meteo (CC BY 4.0) */}
                        <Text style={styles.credit}>Open-Meteo.com</Text>
                    </View>
                </View>
            </View>
            {picker}
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        gap: 14,
        marginHorizontal: SIDE,
        padding: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    center: {
        minHeight: 110,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
    },
    box: {
        width: 86,
        borderRadius: 16,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 2,
    },
    boxTemp: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
    },
    boxPlace: {
        color: '#CFE7E3',
        fontSize: 12,
    },
    info: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        color: HOME.title,
        fontSize: 15,
        fontWeight: '800',
        flexShrink: 1,
    },
    badge: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: HOME.border,
    },
    badgeText: {
        color: HOME.body,
        fontSize: 11,
        fontWeight: '600',
    },
    summary: {
        color: HOME.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    metrics: {
        flexDirection: 'row',
        gap: 16,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricText: {
        color: HOME.body,
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: '#FFFFFF',
    },
    chipText: {
        color: HOME.primary,
        fontSize: 12,
        fontWeight: '700',
        flexShrink: 1,
    },
    pressed: {
        opacity: 0.7,
    },
    credit: {
        color: HOME.muted,
        fontSize: 10,
    },
    errorText: {
        color: HOME.error,
        fontSize: 13,
        textAlign: 'center',
    },
    retry: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});