import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { HOME, SIDE } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import { errorHaptic } from '@/lib/feedback';
import {
    MIN_CATEGORIES,
    PREFERENCE_CATEGORIES,
    type PrefCategory,
} from '@/lib/preference-categories';

const LOGO = require('@/assets/images/icon.png');
const ORNAMENT = require('@/assets/images/decoration.png');
const ORNAMENT_RATIO = 1.6;

const GAP = 10;
const SELECTED = '#2F8F8A';

type TileProps = {
    category: PrefCategory;
    size: number;
    selected: boolean;
    onPress: () => void;
};

function Tile({ category, size, selected, onPress }: TileProps) {
    const { t } = useLanguage();
    const [scale] = useState(() => new Animated.Value(selected ? 0.96 : 1));

    useEffect(() => {
        Animated.spring(scale, {
            toValue: selected ? 0.96 : 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 230,
            mass: 0.7,
        }).start();
    }, [selected, scale]);

    const inner = size - 6;

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={t(category.labelKey)}
                onPress={onPress}
                style={[styles.tile, { width: size, height: size }, selected && styles.tileSelected]}
            >
                {category.image ? (
                    <Image
                        source={category.image}
                        resizeMode="cover"
                        style={{ width: inner, height: inner }}
                    />
                ) : (
                    <>
                        <Svg style={StyleSheet.absoluteFill}>
                            <Defs>
                                <LinearGradient id={`g-${category.id}`} x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor={category.colors[0]} />
                                    <Stop offset="1" stopColor={category.colors[1]} />
                                </LinearGradient>
                            </Defs>
                            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#g-${category.id})`} />
                        </Svg>
                    </>
                )}

                {/* Penggelap agar label terbaca; sedikit lebih pekat saat dipilih */}
                <View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: selected ? 'rgba(14, 50, 48, 0.28)' : 'rgba(0, 0, 0, 0.1)' },
                    ]}
                />

                <View style={[styles.labelPill, { maxWidth: inner - 12 }]} pointerEvents="none">
                    <Text style={styles.labelText} numberOfLines={2}>
                        {t(category.labelKey)}
                    </Text>
                </View>

                {selected ? (
                    <View style={styles.check} pointerEvents="none">
                        <Ionicons name="checkmark" size={16} color={SELECTED} />
                    </View>
                ) : null}
            </Pressable>
        </Animated.View>
    );
}

type Props = {
    /** pilihan awal (kosong untuk pertama kali, berisi saat mengubah) */
    initial: string[];
    submitLabel: string;
    onSubmit: (ids: string[]) => void;
    /** jika ada, tombol kembali ditampilkan (mode ubah preferensi) */
    onCancel?: () => void;
};

export function PreferencePicker({ initial, submitLabel, onSubmit, onCancel }: Props) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { t } = useLanguage();
    const [selected, setSelected] = useState<string[]>(initial);

    const size = Math.floor((width - SIDE * 2 - GAP * 2) / 3);
    const allSelected = selected.length === PREFERENCE_CATEGORIES.length;
    const enough = selected.length >= MIN_CATEGORIES;

    const source = Image.resolveAssetSource(ORNAMENT);
    const sw = source?.width;
    const sh = source?.height;
    const ornamentRatio = sw && sh ? sw / sh : ORNAMENT_RATIO;

    const toggle = (id: string) => {
        Haptics.selectionAsync().catch(() => {
            
        });
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        Haptics.selectionAsync().catch(() => { });
        setSelected(allSelected ? [] : PREFERENCE_CATEGORIES.map((c) => c.id));
    };

    const submit = () => {
        if (!enough) {
            errorHaptic();
            return;
        }
        onSubmit(selected);
    };

    const bottomSpace = insets.bottom + 16;

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <Image
                source={ORNAMENT}
                resizeMode="cover"
                pointerEvents="none"
                style={[styles.ornament, { width, height: width / ornamentRatio }]}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottomSpace + 130 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    {onCancel ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('common.back')}
                            hitSlop={10}
                            onPress={onCancel}
                            style={styles.back}
                        >
                            <Ionicons name="chevron-back" size={24} color={HOME.title} />
                        </Pressable>
                    ) : null}
                    <Image source={LOGO} resizeMode="contain" style={styles.logo} />
                    <Text style={styles.brand}>Balication</Text>
                </View>

                <Text style={styles.title}>{t('pref.title')}</Text>
                <Text style={styles.subtitle}>{t('pref.subtitle', { min: MIN_CATEGORIES })}</Text>

                {/* Pilih semua */}
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: allSelected }}
                    onPress={toggleAll}
                    style={styles.selectAll}
                >
                    <Text style={styles.selectAllText}>
                        {allSelected ? t('pref.clearAll') : t('pref.selectAll')}
                    </Text>
                    <View style={[styles.circle, allSelected && styles.circleOn]}>
                        {allSelected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                </Pressable>

                {/* Kartu kategori */}
                <View style={styles.grid}>
                    {PREFERENCE_CATEGORIES.map((category) => (
                        <Tile
                            key={category.id}
                            category={category}
                            size={size}
                            selected={selected.includes(category.id)}
                            onPress={() => toggle(category.id)}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Tombol bawah dengan latar memudar */}
            <View pointerEvents="box-none" style={[styles.bottom, { paddingBottom: bottomSpace }]}>
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={HOME.bg} stopOpacity={0} />
                            <Stop offset="0.45" stopColor={HOME.bg} stopOpacity={0.92} />
                            <Stop offset="1" stopColor={HOME.bg} stopOpacity={1} />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
                </Svg>

                <Text style={[styles.hint, enough && styles.hintOk]}>
                    {enough
                        ? t('pref.selected', { selected: selected.length })
                        : t('pref.hint', { min: MIN_CATEGORIES, selected: selected.length })}
                </Text>

                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !enough }}
                    onPress={submit}
                    style={({ pressed }) => [
                        styles.button,
                        !enough && styles.buttonDisabled,
                        pressed && styles.pressed,
                    ]}
                >
                    <Text style={styles.buttonText}>{submitLabel}</Text>
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
    ornament: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        opacity: 0.3,
    },
    pressed: {
        opacity: 0.85,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: SIDE,
        marginBottom: 14,
    },
    back: {
        marginLeft: -6,
    },
    logo: {
        width: 38,
        height: 38,
        borderRadius: 10,
    },
    brand: {
        color: HOME.title,
        fontSize: 22,
        fontWeight: '800',
    },
    title: {
        color: HOME.title,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        paddingHorizontal: SIDE,
    },
    subtitle: {
        marginTop: 6,
        color: HOME.primary,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: SIDE + 10,
    },
    selectAll: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        marginBottom: 10,
        marginRight: SIDE,
    },
    selectAllText: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    circle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: HOME.primary,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleOn: {
        backgroundColor: HOME.primary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        paddingHorizontal: SIDE,
    },
    tile: {
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'transparent',
        overflow: 'hidden',
        backgroundColor: '#C9DAD6',
    },
    tileSelected: {
        borderColor: SELECTED,
    },
    iconWrap: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 18,
    },
    labelPill: {
        position: 'absolute',
        left: 6,
        bottom: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    labelText: {
        color: HOME.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    check: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 40,
        paddingHorizontal: SIDE,
        gap: 8,
    },
    hint: {
        textAlign: 'center',
        color: HOME.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    hintOk: {
        color: HOME.primary,
    },
    button: {
        height: 54,
        borderRadius: 27,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.45,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});