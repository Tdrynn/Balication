import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { HOME } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
    visible: boolean;
    onClose: () => void;
    icon: IconName;
    /** warna kotak ikon di atas dialog */
    iconColor?: string;
    title: string;
    text?: string;
    children?: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    confirmDisabled?: boolean;
};

/**
 * Dialog di tengah layar dengan desain yang sama seperti konfirmasi "Log out":
 * kotak ikon, judul, teks, lalu dua tombol (Batal dan aksi utama).
 */
export function ProfileDialog({
    visible,
    onClose,
    icon,
    iconColor = HOME.primary,
    title,
    text,
    children,
    confirmLabel,
    onConfirm,
    confirmDisabled,
}: Props) {
    const { t } = useLanguage();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <Pressable
                    accessibilityLabel={t('common.close')}
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={styles.dialog}>
                    <View style={[styles.icon, { backgroundColor: iconColor }]}>
                        <Ionicons name={icon} size={42} color="#FFFFFF" />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {text ? <Text style={styles.text}>{text}</Text> : null}

                    {children ? <View style={styles.content}>{children}</View> : null}

                    <View style={styles.buttons}>
                        <Pressable
                            accessibilityRole="button"
                            onPress={onClose}
                            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        >
                            <Text style={styles.buttonText}>{t('common.cancel')}</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            disabled={confirmDisabled}
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.button,
                                styles.buttonMain,
                                confirmDisabled && styles.disabled,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={[styles.buttonText, styles.buttonMainText]}>{confirmLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dialog: {
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 26,
        paddingBottom: 22,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
    },
    icon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        marginTop: 14,
        color: HOME.title,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
    },
    text: {
        marginTop: 8,
        color: HOME.muted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 19,
    },
    content: {
        alignSelf: 'stretch',
        marginTop: 18,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 22,
        alignSelf: 'stretch',
    },
    button: {
        flex: 1,
        height: 46,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HOME.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    buttonMain: {
        backgroundColor: HOME.primary,
        borderColor: HOME.primary,
    },
    buttonText: {
        color: HOME.title,
        fontSize: 16,
        fontWeight: '700',
    },
    buttonMainText: {
        color: '#FFFFFF',
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.75,
    },
});