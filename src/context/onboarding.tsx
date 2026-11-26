import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

const STORAGE_KEY = 'onboarding_done_v3';

type OnboardingState = {
    loaded: boolean;
    done: boolean;
    complete: () => Promise<void>;
    reset: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: {children: ReactNode}) {
    const [loaded, setLoaded] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        let active = true;

        AsyncStorage.getItem(STORAGE_KEY).then((value) => {
            if (active) setDone(value === 'true');
        })
        .catch(() => {
            
        })
        .finally(() => {
            if (active) setLoaded(true);
        });

        return () => {
            active = false;
        };
    }, []);

    const complete = useCallback(async () => {
        setDone(true);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, 'true');
        } catch {

        }
    }, []);

    const reset = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
            
        }
        setDone(false);
    }, []);

    const value = useMemo(
        () => ({ loaded, done, complete, reset }),
        [loaded, done, complete, reset],
    );

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) {
        throw new Error('useOnboarding harus dipakai di dalam <OnboardingProvider>');
    }
    return ctx;
}