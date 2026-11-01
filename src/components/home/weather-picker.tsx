import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { REGENCIES } from '@/lib/regencies';

import { HOME } from './home-theme';

type Props = {
    visible: boolean;
    selectedId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
};

export function RegencyPicker({ visible, selectedId, onSelect, onClose }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Ketuk area gelap untuk menutup */}
                <Pressable
                    accessibilityLabel="Tutup"
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Pilih kabupaten / kota</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {REGENCIES.map((regency) => {
                            const selected = regency.id === selectedId;
                            return (
                                <Pressable
                                    key={regency.id}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    onPress={() => {
                                        onSelect(regency.id);
                                        onClose();
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
        maxHeight: '75%',
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
    rowText: {
        color: HOME.body,
        fontSize: 16,
    },
    rowTextSelected: {
        color: HOME.title,
        fontWeight: '800',
    },
});