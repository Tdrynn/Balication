import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LocateResult } from '@/hooks/use-regency';
import { REGENCIES } from '@/lib/regencies';

import { HOME } from './home-theme';

type Props = {
    visible: boolean;
    selectedId: string;
    /** true jika cuaca sedang mengikuti lokasi pengguna */
    auto: boolean;
    onSelect: (id: string) => void;
    onLocate: () => Promise<LocateResult>;
    onClose: () => void;
};

const MESSAGES: Record<Exclude<LocateResult, 'ok'>, string> = {
    denied: 'Izin lokasi ditolak. Aktifkan di pengaturan, atau pilih kabupaten secara manual.',
    outside: 'Anda sedang berada di luar Bali. Pilih kabupaten secara manual.',
    error: 'Lokasi tidak bisa dibaca. Pastikan GPS aktif lalu coba lagi.',
};

export function RegencyPicker({ visible, selectedId, auto, onSelect, onLocate, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const close = () => {
        setMessage(null);
        onClose();
    };

    const handleLocate = async () => {
        setBusy(true);
        setMessage(null);
        const result = await onLocate();
        setBusy(false);

        if (result === 'ok') {
            close();
        } else {
            setMessage(MESSAGES[result]);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={close}
        >
            <View style={styles.overlay}>
                {/* Ketuk area gelap untuk menutup */}
                <Pressable
                    accessibilityLabel="Tutup"
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Pilih kabupaten / kota</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Ikuti lokasi pengguna */}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: auto, busy }}
                            disabled={busy}
                            onPress={handleLocate}
                            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                        >
                            <View style={styles.locateLabel}>
                                <Ionicons name="navigate" size={18} color={HOME.primary} />
                                <Text style={[styles.rowText, auto && styles.rowTextSelected]}>
                                    Gunakan lokasi saya
                                </Text>
                            </View>
                            {busy ? (
                                <ActivityIndicator color={HOME.primary} />
                            ) : (
                                auto && <Ionicons name="checkmark" size={20} color={HOME.primary} />
                            )}
                        </Pressable>
                        {message ? <Text style={styles.message}>{message}</Text> : null}

                        {/* Pilih manual */}
                        {REGENCIES.map((regency) => {
                            const selected = !auto && regency.id === selectedId;
                            return (
                                <Pressable
                                    key={regency.id}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    onPress={() => {
                                        onSelect(regency.id);
                                        close();
                                    }}
                                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                                >
                                    <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                                        {regency.label}
                                    </Text>
                                    {selected && <Ionicons name="checkmark" size={20} color={HOME.primary} />}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    sheet: {
        maxHeight: '80%',
        backgroundColor: HOME.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: HOME.border,
        marginBottom: 14,
    },
    title: {
        color: HOME.title,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: HOME.border,
    },
    rowPressed: {
        opacity: 0.6,
    },
    locateLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowText: {
        color: HOME.body,
        fontSize: 16,
    },
    rowTextSelected: {
        color: HOME.title,
        fontWeight: '800',
    },
    message: {
        color: HOME.error,
        fontSize: 13,
        lineHeight: 18,
        paddingVertical: 8,
    },
});