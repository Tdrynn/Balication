import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import type { Option } from '@/lib/destinations';

type Props = {
    visible: boolean;
    title: string;
    options: Option[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onClose: () => void;
};

/** Lembar pilihan dari bawah yang boleh memilih lebih dari satu (dipakai untuk wilayah tujuan). */
export function MultiSheet({ visible, title, options, selectedIds, onToggle, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel={t('common.close')}
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>{title}</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {options.map((option) => {
                            const selected = selectedIds.includes(option.id);
                            return (
                                <Pressable
                                    key={option.id}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: selected }}
                                    onPress={() => onToggle(option.id)}
                                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                                >
                                    <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                                        {option.label}
                                    </Text>
                                    <View style={[styles.box, selected && styles.boxOn]}>
                                        {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}>
                        <Text style={styles.doneText}>{t('common.done')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15,61,58,0.35)',
    },
    sheet: {
        maxHeight: '70%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: HOME.border,
        marginBottom: 12,
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
    },
    pressed: {
        opacity: 0.6,
    },
    rowText: {
        color: HOME.body,
        fontSize: 15,
    },
    rowTextSelected: {
        color: HOME.title,
        fontWeight: '700',
    },
    box: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: HOME.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxOn: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    done: {
        height: 48,
        borderRadius: 24,
        backgroundColor: HOME.dark,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    doneText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});