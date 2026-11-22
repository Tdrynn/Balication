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

import { useLanguage } from '@/context/language';
import type { LocateResult } from '@/hooks/use-regency';
import { REGENCIES } from '@/lib/regencies';
import { regencyLabel } from '@/lib/regency-label';
import type { TranslationKey } from '@/lib/translations';

import { HOME } from './home-theme';

type Props = {
    visible: boolean;
    selectedId: string;
    auto: boolean;
    onSelect: (id: string) => void;
    onLocate: () => Promise<LocateResult>;
    onClose: () => void;
};

const MESSAGE_KEYS: Record<Exclude<LocateResult, 'ok'>, TranslationKey> = {
    denied: 'picker.denied',
    outside: 'picker.outside',
    error: 'picker.error',
};

export function RegencyPicker({ visible, selectedId, auto, onSelect, onLocate, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const [busy, setBusy] = useState(false);
    const [messageKey, setMessageKey] = useState<TranslationKey | null>(null);

    const close = () => {
        setMessageKey(null);
        onClose();
    };

    const handleLocate = async () => {
        setBusy(true);
        setMessageKey(null);
        const result = await onLocate();
        setBusy(false);

        if (result === 'ok') {
            close();
        } else {
            setMessageKey(MESSAGE_KEYS[result]);
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
                    accessibilityLabel={t('common.close')}
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>{t('picker.title')}</Text>

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
                                    {t('picker.useMyLocation')}
                                </Text>
                            </View>
                            {busy ? (
                                <ActivityIndicator color={HOME.primary} />
                            ) : (
                                auto && <Ionicons name="checkmark" size={20} color={HOME.primary} />
                            )}
                        </Pressable>
                        {messageKey ? <Text style={styles.message}>{t(messageKey)}</Text> : null}

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
                                        {regencyLabel(regency, t)}
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