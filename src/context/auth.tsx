import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

const ACCOUNT_KEY = 'auth_account_v1';
const SESSION_KEY = 'auth_account_v1';

// Konteks
// false = user harus login lagi setiap relog aplikasi
// true = sesi disimpan, tidak perlu login lagi sampai user klik sign out

const KEEP_SIGNED_IN = false;

export type Account = { name: string; email: string };
export type AuthMode = 'login' | 'register';
export type AuthResult = { ok: true } | { ok: false; error: string };

type SignUpData = { name: string; email: string; password: string };
type SignInData = { email: string; password: string };

type AuthState = {
    // true setelah data dari database selesai dibaca
    loaded: boolean;
    // akun yang pernah di registrasi di perangkat ini
    account: Account | null;
    signedIn: boolean;
    // layar autentikasi yang sedang aktif
    mode: AuthMode;
    setMode: (mode: AuthMode) => void;
    signUp: (data: SignUpData) => Promise<AuthResult>;
    signIn: (data: SignInData) => Promise<AuthResult>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function parseAccount(raw: string | null): Account | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        if (typeof value?.name === 'string' && typeof value?.email === 'string') {
            return { name: value.name, email: value.email };
        }
    } catch {
        // data rusak: anggap belum ada akun
    }
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [loaded, setLoaded] = useState(false);
    const [account, setAccount] = useState<Account | null>(null);
    const [signedIn, setSignedIn] = useState(false);
    const [mode, setMode] = useState<AuthMode>('register');

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const [rawAccount, rawSession] = await Promise.all([
                    AsyncStorage.getItem(ACCOUNT_KEY),
                    AsyncStorage.getItem(SESSION_KEY),
                ]);
                if (!active) return;

                const saved = parseAccount(rawAccount);
                setAccount(saved);
                setMode(saved ? 'login' : 'register');
                setSignedIn(KEEP_SIGNED_IN && saved !== null && rawSession === 'true');
            } catch {
                // register
            } finally {
                if (active) setLoaded(true);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    // PENTING: dua fungsi di bawah ini masih contoh lokal tanpa server.
    // Ganti isinya dengan pemanggilan backend (Firebase, Supabase, atau API sendiri).

    const signUp = useCallback(async (data: SignUpData): Promise<AuthResult> => {
        // TODO: kirim name, email, password ke backend dan tunggu hasilnya.
        // Password sengaja TIDAK disimpan di perangkat.
        const saved: Account = { name: data.name, email: data.email };
        try {
            await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(saved));
            if (KEEP_SIGNED_IN) await AsyncStorage.setItem(SESSION_KEY, 'true');
        } catch {
            return { ok: false, error: 'Could not save your account. Please try again.' };
        }
        setAccount(saved);
        setSignedIn(true);
        return { ok: true };
    }, []);

    const signIn = useCallback(
        async (data: SignInData): Promise<AuthResult> => {
            // TODO: verifikasi email dan password ke backend.
            // Saat ini HANYA email yang dicocokkan; password belum diperiksa.
            if (!account) {
                return {
                    ok: false,
                    error: 'No account found on this devices. Please sign up first.',
                };
            }
            if (account.email.toLowerCase() !== data.email.trim().toLowerCase()) {
                return { ok: false, error: 'Email not found.' };
            }
            try {
                if (KEEP_SIGNED_IN) await AsyncStorage.setItem(SESSION_KEY, 'true');
            } catch {
                // tidak fatal
            }
            setSignedIn(true);
            return { ok: true };
        },
        [account],
    );

    const signOut = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(SESSION_KEY);
        } catch {
            // tidak fatal
        }
        setMode(account ? 'login' : 'register');
        setSignedIn(false);
    }, [account]);

    const value = useMemo(
        () => ({ loaded, account, signedIn, mode, setMode, signUp, signIn, signOut }),
        [loaded, account, signedIn, mode, signUp, signIn, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
    }
    return ctx;
}