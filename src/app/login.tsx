import { useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';

import {
    AuthShell,
    COLORS,
    EMAIL_PATTERN,
    FormError,
    Heading,
    PrimaryButton,
    SwitchLink,
    TextField,
} from '@/components/auth/auth-ui';
import { useAuth } from '@/context/auth';
import { errorHaptic } from '@/lib/feedback';
import { useLanguage } from '@/context/language';

type Errors = {
    email?: string;
    password?: string;
    form?: string;
};

export default function LoginScreen() {
    const { t } = useLanguage();
    const { signIn, setMode } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

    const onSubmit = async () => {
        const next: Errors = {};
        if (!EMAIL_PATTERN.test(email.trim())) next.email = t('auth.error.email');
        if (!password) next.password = t('auth.error.empty');

        setErrors(next);
        if (Object.keys(next).length > 0) {
            errorHaptic();
            return;
        }

        setSubmitting(true);
        const result = await signIn({ email: email.trim(), password });

        if (!result.ok) {
            errorHaptic();
            setErrors({ form: result.error });
            setSubmitting(false);
        }
    };

    return (
        <AuthShell hero={require('@/assets/images/login-hero.png')}>
            <Heading
                title={t('login.title')}
                subtitle={t('login.subtitle')}
            />

            <TextField
                icon="mail"
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
                icon="lock"
                password
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                inputRef={passwordRef}
                autoCapitalize="none"
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
            />

            <View style={styles.forgotRow}>
                <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    onPress={() =>
                        // TODO: arahkan ke alur reset password Anda.
                        Alert.alert('Forgot Password', 'Reset password belum dihubungkan.')
                    }
                >
                    <Text style={styles.forgotText}>{t('login.forgot')}</Text>
                </Pressable>
            </View>

            <FormError message={errors.form} />

            <PrimaryButton label={t('login.login')} onPress={onSubmit} loading={submitting} />

            <SwitchLink
                prefix={t('login.dont')}
                action={t('login.sign')}
                onPress={() => setMode('register')}
            />
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    forgotRow: {
        alignItems: 'flex-end',
    },
    forgotText: {
        color: COLORS.title,
        fontSize: 14,
        fontWeight: '800',
    },
});