import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME, SIDE } from '@/components/home/home-theme';
import { MultiSheet } from '@/components/itinerary/multi-sheet';
import { OptionSheet } from '@/components/search/option-sheet';
import { useLanguage } from '@/context/language';
import { usePreferences } from '@/context/preferences';
import { errorHaptic } from '@/lib/feedback';
import {
    BUDGET_OPTIONS,
    DURATION_OPTIONS,
    TRAVELER_OPTIONS,
    setTripDraft,
    useTripDraft,
} from '@/lib/itinerary';
import { PREFERENCE_CATEGORIES } from '@/lib/preference-categories';
import { REGENCIES } from '@/lib/regencies';
import { regencyLabel } from '@/lib/regency-label';

export default function TripPreferencesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useLanguage();
    const saved = usePreferences();
    const draft = useTripDraft();

    const [categories, setCategories] = useState<string[]>(
        draft.categories.length > 0 ? draft.categories : saved.categories,
    );
    const [regencyIds, setRegencyIds] = useState<string[]>(draft.regencyIds);
    const [budgetId, setBudgetId] = useState(draft.budgetId);
    const [days, setDays] = useState(draft.days);
    const [travelers, setTravelers] = useState(draft.travelers);
    const [sheet, setSheet] = useState<'location' | 'duration' | 'travelers' | null>(null);
    const [showError, setShowError] = useState(false);

    const toggle = <T,>(list: T[], item: T) =>
        list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

    const ready = categories.length > 0 && days > 0 && travelers > 0;

    const locationText =
        regencyIds.length === 0
            ? t('trip.location.placeholder')
            : REGENCIES.filter((r) => regencyIds.includes(r.id))
                .map((r) => r.name)
                .join(', ');

    const durationOptions = DURATION_OPTIONS.map((n) => ({
        id: String(n),
        label: t(n === 1 ? 'trip.day.one' : 'trip.day.other', { count: n }),
    }));
    const travelerOptions = TRAVELER_OPTIONS.map((n) => ({
        id: String(n),
        label: t(n === 1 ? 'trip.person.one' : 'trip.person.other', { count: n }),
    }));

    const next = () => {
        if (!ready) {
            errorHaptic();
            setShowError(true);
            return;
        }
        setTripDraft({ categories, regencyIds, budgetId, days, travelers, selectedIds: [] });
        router.push('/trip-recommendations');
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 110,
                }}
            >
                <View style={styles.top}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('common.back')}
                        hitSlop={10}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={26} color={HOME.title} />
                    </Pressable>
                    <Text style={styles.title}>{t('trip.title')}</Text>
                </View>
                <Text style={styles.subtitle}>{t('trip.subtitle')}</Text>

                {/* Kategori */}
                <Text style={styles.label}>{t('trip.categories')}</Text>
                <View style={styles.chips}>
                    {PREFERENCE_CATEGORIES.map((c) => {
                        const on = categories.includes(c.id);
                        return (
                            <Pressable
                                key={c.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                onPress={() => setCategories((list) => toggle(list, c.id))}
                                style={[styles.chip, on && styles.chipOn]}
                            >
                                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(c.labelKey)}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                {showError && categories.length === 0 ? (
                    <Text style={styles.error}>{t('trip.error.categories')}</Text>
                ) : null}

                {/* Lokasi */}
                <Text style={styles.label}>{t('trip.location')}</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => setSheet('location')}
                    style={styles.field}
                >
                    <Text
                        style={[styles.fieldText, regencyIds.length === 0 && styles.placeholder]}
                        numberOfLines={1}
                    >
                        {locationText}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={HOME.body} />
                </Pressable>

                {/* Anggaran */}
                <Text style={styles.label}>{t('trip.budget')}</Text>
                <View style={styles.chips}>
                    {BUDGET_OPTIONS.map((b) => {
                        const on = budgetId === b.id;
                        return (
                            <Pressable
                                key={b.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                onPress={() => setBudgetId(b.id)}
                                style={[styles.chip, on && styles.chipOn]}
                            >
                                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(b.labelKey)}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Durasi */}
                <Text style={styles.label}>{t('trip.duration')}</Text>
                <Pressable accessibilityRole="button" onPress={() => setSheet('duration')} style={styles.field}>
                    <Text style={[styles.fieldText, days === 0 && styles.placeholder]}>
                        {days === 0
                            ? t('trip.duration.placeholder')
                            : t(days === 1 ? 'trip.day.one' : 'trip.day.other', { count: days })}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={HOME.body} />
                </Pressable>
                {showError && days === 0 ? <Text style={styles.error}>{t('trip.error.required')}</Text> : null}

                {/* Jumlah wisatawan */}
                <Text style={styles.label}>{t('trip.travelers')}</Text>
                <Pressable accessibilityRole="button" onPress={() => setSheet('travelers')} style={styles.field}>
                    <Text style={[styles.fieldText, travelers === 0 && styles.placeholder]}>
                        {travelers === 0
                            ? t('trip.travelers.placeholder')
                            : t(travelers === 1 ? 'trip.person.one' : 'trip.person.other', { count: travelers })}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={HOME.body} />
                </Pressable>
                {showError && travelers === 0 ? (
                    <Text style={styles.error}>{t('trip.error.required')}</Text>
                ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    accessibilityRole="button"
                    onPress={next}
                    style={({ pressed }) => [styles.next, !ready && styles.nextOff, pressed && styles.pressed]}
                >
                    <Text style={styles.nextText}>{t('trip.next')}</Text>
                </Pressable>
            </View>

            <MultiSheet
                visible={sheet === 'location'}
                title={t('trip.location')}
                options={REGENCIES.map((r) => ({ id: r.id, label: regencyLabel(r, t) }))}
                selectedIds={regencyIds}
                onToggle={(id) => setRegencyIds((list) => toggle(list, id))}
                onClose={() => setSheet(null)}
            />
            <OptionSheet
                visible={sheet === 'duration'}
                title={t('trip.duration')}
                options={durationOptions}
                selectedId={String(days)}
                onSelect={(id) => setDays(Number(id))}
                onClose={() => setSheet(null)}
            />
            <OptionSheet
                visible={sheet === 'travelers'}
                title={t('trip.travelers')}
                options={travelerOptions}
                selectedId={String(travelers)}
                onSelect={(id) => setTravelers(Number(id))}
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
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SIDE,
    },
    title: {
        flex: 1,
        color: HOME.title,
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        paddingHorizontal: SIDE + 4,
        marginTop: 4,
        color: HOME.body,
        fontSize: 14,
        lineHeight: 20,
    },
    label: {
        paddingHorizontal: SIDE,
        marginTop: 22,
        marginBottom: 10,
        color: HOME.title,
        fontSize: 16,
        fontWeight: '800',
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: SIDE,
    },
    chip: {
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: HOME.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOn: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    chipText: {
        color: HOME.body,
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextOn: {
        color: '#FFFFFF',
    },
    field: {
        marginHorizontal: SIDE,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: HOME.card,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    fieldText: {
        flex: 1,
        color: HOME.title,
        fontSize: 14,
    },
    placeholder: {
        color: HOME.muted,
    },
    error: {
        paddingHorizontal: SIDE + 4,
        marginTop: 6,
        color: HOME.error,
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: SIDE,
        paddingTop: 10,
        backgroundColor: HOME.bg,
    },
    next: {
        height: 54,
        borderRadius: 27,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextOff: {
        opacity: 0.55,
    },
    pressed: {
        opacity: 0.85,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});