import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME } from '@/components/home/home-theme';
import { ProfileDialog } from '@/components/profile/profile-dialog';
import { useLanguage } from '@/context/language';
import { LANGUAGES, type Language } from '@/lib/translations';

type Props = {
    visible: boolean;
    onClose: () => void;
};

/** Dialog pilih bahasa aplikasi; bahasa baru berlaku setelah menekan Simpan. */
export function LanguageDialog({ visible, onClose }: Props) {
    const { t, language, setLanguage } = useLanguage();
    const [draft, setDraft] = useState<Language | null>(null);
    const selected = draft ?? language;

    const close = () => {
        setDraft(null);
        onClose();
    };

    return (
        <ProfileDialog
            visible={visible}
            onClose={close}
            icon="language"
            title={t('language.sheetTitle')}
            text={t('language.dialogText')}
            confirmLabel={t('common.save')}
            onConfirm={() => {
                setLanguage(selected);
                close();
            }}
        >
            <View style={styles.list}>
                {LANGUAGES.map((item) => {
                    const on = selected === item.code;
                    return (
                        <Pressable
                            key={item.code}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: on }}
                            onPress={() => setDraft(item.code)}
                            style={[styles.row, on && styles.rowOn]}
                        >
                            <Text style={[styles.rowText, on && styles.rowTextOn]}>{item.label}</Text>
                            <View style={[styles.radio, on && styles.radioOn]}>
                                {on ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </ProfileDialog>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: '#FFFFFF',
    },
    rowOn: {
        borderColor: HOME.primary,
        backgroundColor: '#EAF7F5',
    },
    rowText: {
        color: HOME.body,
        fontSize: 15,
    },
    rowTextOn: {
        color: HOME.title,
        fontWeight: '800',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: HOME.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOn: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
});