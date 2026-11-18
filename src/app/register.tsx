import { useRef, useState, type ComponentRef } from 'react';
import { TextInput } from 'react-native';

import {
    AuthShell,
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
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
};

export default function RegisterScreen() {
    const { t } = useLanguage();
    const { signUp, setMode } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
    const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);

    const onSubmit = async () => {
        const next: Errors = {};
        if (!name.trim()) next.name = t('auth.error.name');
        if (!EMAIL_PATTERN.test(email.trim())) next.email = t('auth.error.email');
        if (password.length < 8) next.password = t('auth.error.password');
        if (confirm !== password) next.confirm = t('auth.error.confirm');

        setErrors(next);
        if (Object.keys(next).length > 0) {
            errorHaptic();
            return;
        }

        setSubmitting(true);
        const result = await signUp({
            name: name.trim(),
            email: email.trim(),
            password,
        });

        if (!result.ok) {
            errorHaptic();
            setErrors({ form: result.error });
            setSubmitting(false);
        }
    };

    return (
        <AuthShell hero={require('@/assets/images/register-hero.png')}>
            <Heading
                title={t('register.title')}
                subtitle={t('register.subtitle')}
            />

            <TextField
                icon="person"
                placeholder={t('auth.name')}
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField
                icon="mail"
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                inputRef={emailRef}
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
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TextField
                icon="lock"
                password
                placeholder={t('auth.confirm')}
                value={confirm}
                onChangeText={setConfirm}
                error={errors.confirm}
                inputRef={confirmRef}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
            />

            <FormError message={errors.form} />

            <PrimaryButton label={t('register.button')} onPress={onSubmit} loading={submitting} />

            <SwitchLink
                prefix={t('register.already')}
                action={t('register.login')}
                onPress={() => setMode('login')}
            />
        </AuthShell>
    );
}