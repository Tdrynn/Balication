import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME, SIDE } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';

/** Panggil tepat sebelum mengubah state buka/tutup agar perubahan tinggi tampil halus. */
export function animateLayout() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

type Props = {
    open: boolean;
    onToggle: () => void;
    /** jumlah filter yang sedang aktif; ditampilkan sebagai lencana saat filter disembunyikan */
    activeCount: number;
    /** isi di sisi kanan, contoh: jumlah hasil atau tombol reset */
    trailing?: ReactNode;
};

/** Baris tombol "Filter" yang menampilkan atau menyembunyikan panel filter. */
export function FilterToggle({ open, onToggle, activeCount, trailing }: Props) {
    const { t } = useLanguage();

    return (
        <View style={styles.row}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={open ? t('filter.hide') : t('filter.show')}
                onPress={onToggle}
                style={({ pressed }) => [
                    styles.toggle,
                    activeCount > 0 && styles.toggleActive,
                    pressed && styles.pressed,
                ]}
            >
                <Ionicons
                    name="options-outline"
                    size={16}
                    color={activeCount > 0 ? '#FFFFFF' : HOME.primary}
                />
                <Text style={[styles.text, activeCount > 0 && styles.textActive]}>
                    {t('filter.filter')}
                </Text>
                {activeCount > 0 ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{activeCount}</Text>
                    </View>
                ) : null}
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={activeCount > 0 ? '#FFFFFF' : HOME.primary}
                />
            </Pressable>

            <View style={styles.trailing}>{trailing}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: SIDE,
    },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#BBD2CE',
        backgroundColor: '#FFFFFF',
    },
    toggleActive: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    pressed: {
        opacity: 0.75,
    },
    text: {
        color: HOME.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    textActive: {
        color: '#FFFFFF',
    },
    badge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: HOME.primary,
        fontSize: 11,
        fontWeight: '800',
    },
    trailing: {
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
