import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language';
import type { LocateResult } from '@/hooks/use-regency';
import type { Remote } from '@/hooks/use-remote';
import type { Weather } from '@/lib/api';
import { regencyLabel } from '@/lib/regency-label';
import type { Regency } from '@/lib/regencies';
import type { TranslationKey } from '@/lib/translations';

import { HOME, SIDE } from './home-theme';
import { RegencyPicker } from './regency-picker';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Kode cuaca WMO -> kunci terjemahan + ikon. Teksnya diterjemahkan saat ditampilkan. */
function describe(code: number): { labelKey: TranslationKey; icon: IconName } {
    if (code === 0) return { labelKey: 'weather.sunny', icon: 'sunny' };
    if (code <= 2) return { labelKey: 'weather.partlySunny', icon: 'partly-sunny' };
    if (code === 3) return { labelKey: 'weather.cloudy', icon: 'cloud' };
    if (code === 45 || code === 48) return { labelKey: 'weather.foggy', icon: 'cloudy' };
    if (code >= 51 && code <= 57) return { labelKey: 'weather.drizzle', icon: 'rainy' };
    if (code >= 61 && code <= 67) return { labelKey: 'weather.rain', icon: 'rainy' };
    if (code >= 80 && code <= 82) return { labelKey: 'weather.heavyRain', icon: 'rainy' };
    if (code >= 95) return { labelKey: 'weather.thunderstorm', icon: 'thunderstorm' };
    return { labelKey: 'weather.cloudy', icon: 'cloud' };
}

const show = (value: number, unit: string) =>
    Number.isFinite(value) ? `${Math.round(value)}${unit}` : '-';

function RegencyChip({
    name,
    auto,
    onPress,
}: {
    name: string;
    auto: boolean;
    onPress: () => void;
}) {
    const { t } = useLanguage();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('weather.changeLocation', { name })}
            hitSlop={6}
            onPress={onPress}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
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
    auto: boolean;
    onSelect: (id: string) => void;
    onLocate: () => Promise<LocateResult>;
};

export function WeatherCard({ weather, regency, auto, onSelect, onLocate }: Props) {
    const { t } = useLanguage();
    const [pickerOpen, setPickerOpen] = useState(false);
    const { data, loading, error, reload } = weather;

    const ready = data !== null && data.regencyId === regency.id;
    const placeName = regencyLabel(regency, t);

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

    if (!ready) {
        const message =
            __DEV__ && error
                ? `${t('weather.unavailable')} (${error})`
                : t('weather.unavailable');

        return (
            <>
                <View style={[styles.card, styles.center]}>
                    {loading ? (
                        <ActivityIndicator color={HOME.primary} />
                    ) : (
                        <>
                            <Text style={styles.errorText}>{message}</Text>
                            <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
                                <Text style={styles.retry}>{t('weather.retry')}</Text>
                            </Pressable>
                        </>
                    )}
                    <RegencyChip name={placeName} auto={auto} onPress={() => setPickerOpen(true)} />
                </View>
                {picker}
            </>
        );
    }

    const { labelKey, icon } = describe(data.code);
    const temperature = show(data.temperature, '°');
    const humidity = show(data.humidity, '%');
    const wind = Number.isFinite(data.windSpeed)
        ? t('weather.wind', { value: Math.round(data.windSpeed) })
        : '-';
    const updated = data.time.slice(11, 16);

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
                        <Text style={styles.title}>{t('weather.title')}</Text>
                        {updated ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {t('weather.updated', { time: updated })}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.summary}>
                        {t('weather.summary', {
                            label: t(labelKey),
                            temp: temperature,
                            humidity,
                        })}
                    </Text>

                    <View style={styles.metrics}>
                        <View style={styles.metric}>
                            <Ionicons name="water-outline" size={16} color={HOME.primary} />
                            <Text style={styles.metricText}>{humidity}</Text>
                        </View>
                        <View style={styles.metric}>
                            <Ionicons name="speedometer-outline" size={16} color={HOME.primary} />
                            <Text style={styles.metricText}>{wind}</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <RegencyChip name={placeName} auto={auto} onPress={() => setPickerOpen(true)} />
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
        fontSize: 14,
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
        fontSize: 10,
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