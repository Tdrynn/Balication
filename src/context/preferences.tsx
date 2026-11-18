import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth';
import { MIN_CATEGORIES, findCategory } from '@/lib/preference-categories';

const STORAGE_KEY = 'preferences_v1';

/** { "email@contoh.com": ["beach", "nature", ...] }: tiap akun punya preferensinya sendiri. */
type Store = Record<string, string[]>;

type PreferencesContextValue = {
    /** false selama data tersimpan masih dibaca */
    loaded: boolean;
    /** true jika akun yang sedang aktif sudah memilih preferensi */
    done: boolean;
    /** id kategori pilihan akun yang sedang aktif */
    categories: string[];
    save: (ids: string[]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Harus berada di dalam AuthProvider (membutuhkan akun yang aktif). */
export function PreferencesProvider({ children }: { children: ReactNode }) {
    const { account } = useAuth();
    const email = account?.email?.trim().toLowerCase() ?? null;

    const [store, setStore] = useState<Store>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;

        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (!active || !raw) return;
                const parsed: unknown = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    setStore(parsed as Store);
                }
            })
            .catch(() => {
                // gagal membaca: anggap belum ada preferensi
            })
            .finally(() => {
                if (active) setLoaded(true);
            });

        return () => {
            active = false;
        };
    }, []);

    const categories = useMemo(() => {
        const saved = email ? store[email] : undefined;
        return Array.isArray(saved) ? saved.filter((id) => findCategory(id)) : [];
    }, [email, store]);

    const save = useCallback(
        (ids: string[]) => {
            if (!email) return;
            const next: Store = { ...store, [email]: ids };
            setStore(next);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
                // tidak fatal: pilihan hanya tidak diingat
            });
        },
        [email, store],
    );

    const value = useMemo(
        () => ({ loaded, done: categories.length >= MIN_CATEGORIES, categories, save }),
        [loaded, categories, save],
    );

    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error('usePreferences harus dipakai di dalam <PreferencesProvider>');
    return context;
}