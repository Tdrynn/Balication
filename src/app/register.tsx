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

type Errors = {
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
};

export default function RegisterScreen() {
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
        if (!name.trim()) next.name = 'Please enter your name.';
        if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
        if (password.length < 8) next.password = 'Use at least 8 characters.';
        if (confirm !== password) next.confirm = 'Passwords do not match.';

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

        // Jika berhasil, layar berpindah otomatis (guard di _layout.tsx).
        if (!result.ok) {
            errorHaptic();
            setErrors({ form: result.error });
            setSubmitting(false);
        }
    };

    return (
        <AuthShell hero={require('@/assets/images/register-hero.png')}>
            <Heading
                title="Join the Journey"
                subtitle="Create an account to start planning your dream vacation in Bali"
            />

            <TextField
                icon="person"
                placeholder="Name"
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
                placeholder="Email"
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
                placeholder="Password"
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
                placeholder="Confirm Password"
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

            <PrimaryButton label="Sign Up" onPress={onSubmit} loading={submitting} />

            <SwitchLink
                prefix="Already have an Account?"
                action="Log in."
                onPress={() => setMode('login')}
            />
        </AuthShell>
    );
}