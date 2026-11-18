import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { translations, type Language, type TranslationKey } from '@/lib/translations';

const STORAGE_KEY = 'language_v1';

function deviceLanguage(): Language {
    const code = getLocales()[0]?.languageCode;
    return code === 'id' || code === 'in' ? 'id' : 'en';
}

type Params = Record<string, string | number>;

type LanguageContextValue = {
    language: Language;
    /** false selama pilihan tersimpan masih dibaca */
    loaded: boolean;
    setLanguage: (language: Language) => void;
    /** t('profile.title')  atau  t('home.hello', { name: 'Antony' }) untuk teks "Halo, {name}" */
    t: (key: TranslationKey, params?: Params) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Awalnya bahasa HP. Pilihan pengguna (jika pernah memilih) menggantikannya setelah dibaca.
    const [language, setLanguageState] = useState<Language>(deviceLanguage);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;

        AsyncStorage.getItem(STORAGE_KEY)
            .then((saved) => {
                if (active && (saved === 'en' || saved === 'id')) setLanguageState(saved);

                AsyncStorage.getItem(STORAGE_KEY)
                    .then((saved) => {
                        console.log('[lang] device:', getLocales()[0]?.languageCode, '| saved:', saved);
                        if (active && (saved === 'en' || saved === 'id')) setLanguageState(saved);
                    })
            })
            .catch(() => {
                // gagal membaca: tetap memakai bahasa HP
            })
            .finally(() => {
                if (active) setLoaded(true);
            });

        return () => {
            active = false;
        };
    }, []);

    const setLanguage = useCallback((next: Language) => {
        setLanguageState(next);
        // Disimpan hanya saat pengguna memilih sendiri. Sebelum itu, bahasa selalu mengikuti HP.
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
            // tidak fatal: pilihan hanya tidak diingat
        });
    }, []);

    const t = useCallback(
        (key: TranslationKey, params?: Params) => {
            let text = translations[language][key] ?? translations.en[key] ?? key;
            if (params) {
                for (const [name, value] of Object.entries(params)) {
                    text = text.split(`{${name}}`).join(String(value));
                }
            }
            return text;
        },
        [language],
    );

    const value = useMemo(
        () => ({ language, loaded, setLanguage, t }),
        [language, loaded, setLanguage, t],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage harus dipakai di dalam <LanguageProvider>');
    return context;
}