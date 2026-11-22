import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { HOME } from '@/components/home/home-theme';
import { ProfileDialog } from '@/components/profile/profile-dialog';
import { useLanguage } from '@/context/language';

type Props = {
    visible: boolean;
    onClose: () => void;
    name: string;
    email: string;
    onSave: (name: string) => void;
};

const MAX_NAME = 40;

/** Dialog informasi akun: nama bisa diubah, email hanya ditampilkan. */
export function AccountDialog({ visible, onClose, name, email, onSave }: Props) {
    const { t } = useLanguage();
    const [draft, setDraft] = useState<string | null>(null);
    const value = draft ?? name;
    const trimmed = value.trim();

    const close = () => {
        setDraft(null);
        onClose();
    };

    return (
        <ProfileDialog
            visible={visible}
            onClose={close}
            icon="person"
            title={t('profile.account')}
            text={t('account.text')}
            confirmLabel={t('common.save')}
            confirmDisabled={trimmed.length === 0}
            onConfirm={() => {
                onSave(trimmed);
                close();
            }}
        >
            <View style={styles.field}>
                <Text style={styles.label}>{t('account.name')}</Text>
                <TextInput
                    value={value}
                    onChangeText={setDraft}
                    maxLength={MAX_NAME}
                    autoCapitalize="words"
                    returnKeyType="done"
                    placeholder={t('account.name')}
                    placeholderTextColor={HOME.muted}
                    style={styles.input}
                />
                {trimmed.length === 0 ? (
                    <Text style={styles.error}>{t('account.nameRequired')}</Text>
                ) : null}
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>{t('account.email')}</Text>
                <View style={[styles.input, styles.readonly]}>
                    <Text style={styles.readonlyText} numberOfLines={1}>
                        {email || '-'}
                    </Text>
                </View>
            </View>
        </ProfileDialog>
    );
}

const styles = StyleSheet.create({
    field: {
        gap: 6,
        marginBottom: 10,
    },
    label: {
        color: HOME.title,
        fontSize: 13,
        fontWeight: '700',
    },
    input: {
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        color: HOME.title,
        fontSize: 15,
    },
    readonly: {
        justifyContent: 'center',
        backgroundColor: '#F1F6F5',
    },
    readonlyText: {
        color: HOME.muted,
        fontSize: 15,
    },
    error: {
        color: HOME.error,
        fontSize: 12,
    },
});