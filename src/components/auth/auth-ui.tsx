import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
    type ImageSourcePropType,
    type TextInputProps,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type TextInputHandle = ComponentRef<typeof TextInput>;

export const COLORS = {
    bg: '#FFFFFF',
    title: '#0F3D3A',
    body: '#1E6B63',
    primary: '#2F7F73',
    button: '#17403E',
    border: '#C9D6D3',
    placeholder: '#5E8F88',
    muted: '#6F8F8A',
    error: '#C0392B',
};

const DECORATION = require('@/assets/images/decoration.png');

const DECORATION_SIZE = Image.resolveAssetSource(DECORATION);
const DECORATION_RATIO =
    DECORATION_SIZE && DECORATION_SIZE.height > 0
        ? DECORATION_SIZE.width / DECORATION_SIZE.height
        : 1.3;

const WAVE_HEIGHT = 60;

const HERO_FOCUS_Y = 0.5;
const HERO_ZOOM = 1;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthShell({
    hero,
    children,
}: {
    hero: ImageSourcePropType;
    children: ReactNode;
}) {
    const { width, height } = useWindowDimensions();
    const heroHeight = Math.max(190, height * 0.27);

    const heroSize = Image.resolveAssetSource(hero);
    const heroImgW = heroSize?.width || width;
    const heroImgH = heroSize?.height || heroHeight;
    const heroScale =
        Math.max(width / heroImgW, heroHeight / heroImgH) * HERO_ZOOM;
    const heroDrawW = heroImgW * heroScale;
    const heroDrawH = heroImgH * heroScale;
    const heroImageStyle = {
        position: 'absolute' as const,
        width: heroDrawW,
        height: heroDrawH,
        left: (width - heroDrawW) / 2,
        top: -(heroDrawH - heroHeight) * HERO_FOCUS_Y,
    };

    const decorationFullHeight = width / DECORATION_RATIO;
    const decorationHeight = Math.min(decorationFullHeight, height * 0.3);

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            <View style={[styles.decorationWrap, { height: decorationHeight }]}>
                <Image
                    source={DECORATION}
                    resizeMode="cover"
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width,
                        height: decorationFullHeight,
                    }}
                />
                <Svg
                    width={width}
                    height={decorationHeight * 0.5}
                    style={styles.decorationFade}
                >
                    <Defs>
                        <LinearGradient id="decorationFade" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={COLORS.bg} stopOpacity="1" />
                            <Stop offset="1" stopColor={COLORS.bg} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#decorationFade)" />
                </Svg>
            </View>

            <KeyboardAvoidingView style={styles.flex} behavior="padding">
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    <View style={[styles.hero, { height: heroHeight }]}>
                        <Image source={hero} resizeMode="stretch" style={heroImageStyle} />
                        <Svg
                            width={width + 4}
                            height={WAVE_HEIGHT}
                            viewBox="0 0 400 60"
                            preserveAspectRatio="none"
                            style={styles.wave}
                        >
                            <Path
                                d="M0 34 C70 6 130 54 210 40 C290 26 340 6 400 20 L400 60 L0 60 Z"
                                fill={COLORS.bg}
                            />
                        </Svg>
                    </View>

                    <View style={styles.body}>{children}</View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

export function Heading({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}

type TextFieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
    icon: 'person' | 'mail' | 'lock';
    /** true = kolom password dengan tombol mata */
    password?: boolean;
    error?: string;
    inputRef?: Ref<TextInputHandle>;
};

export function TextField({
    icon,
    password = false,
    error,
    inputRef,
    onFocus,
    onBlur,
    ...inputProps
}: TextFieldProps) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);

    return (
        <View style={styles.fieldWrap}>
            <View
                style={[
                    styles.field,
                    focused && styles.fieldFocused,
                    !!error && styles.fieldError,
                ]}
            >
                {icon === 'mail' ? (
                    <Ionicons name="mail-outline" size={26} color={COLORS.primary} />
                ) : (
                    <View style={styles.badge}>
                        <Ionicons
                            name={icon === 'person' ? 'person' : 'lock-closed'}
                            size={15}
                            color="#FFFFFF"
                        />
                    </View>
                )}

                <TextInput
                    ref={inputRef}
                    {...inputProps}
                    secureTextEntry={password && hidden}
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.input}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                />

                {password && (
                    <Pressable
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                        onPress={() => setHidden((h) => !h)}
                    >
                        <Ionicons
                            name={hidden ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={COLORS.muted}
                        />
                    </Pressable>
                )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

export function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return <Text style={styles.formError}>{message}</Text>;
}

export function PrimaryButton({
    label,
    onPress,
    loading = false,
}: {
    label: string;
    onPress: () => void;
    loading?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                (pressed || loading) && styles.buttonPressed,
            ]}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.buttonText}>{label}</Text>
            )}
        </Pressable>
    );
}

/** Teks "Already have an Account? Log in." */
export function SwitchLink({
    prefix,
    action,
    onPress,
}: {
    prefix: string;
    action: string;
    onPress: () => void;
}) {
    return (
        <Text style={styles.switchText}>
            {prefix}{' '}
            <Text style={styles.switchAction} onPress={onPress} suppressHighlighting>
                {action}
            </Text>
        </Text>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    decorationWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    decorationFade: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    hero: {
        alignSelf: 'stretch',
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        left: -2,
        bottom: -1,
    },
    body: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 48,
        gap: 16,
    },
    heading: {
        gap: 6,
        marginBottom: 4,
    },
    title: {
        color: COLORS.title,
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        color: COLORS.body,
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 300,
    },
    fieldWrap: {
        gap: 4,
    },
    field: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.bg,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    fieldFocused: {
        borderColor: COLORS.primary,
    },
    fieldError: {
        borderColor: COLORS.error,
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.title,
        fontSize: 15,
    },
    error: {
        color: COLORS.error,
        fontSize: 12,
        marginLeft: 4,
    },
    formError: {
        color: COLORS.error,
        fontSize: 13,
        textAlign: 'center',
    },
    button: {
        height: 54,
        borderRadius: 16,
        backgroundColor: COLORS.button,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    switchText: {
        color: COLORS.body,
        fontSize: 14,
        textAlign: 'center',
    },
    switchAction: {
        color: COLORS.title,
        fontWeight: '800',
    },
});