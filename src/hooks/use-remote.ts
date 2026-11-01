import { useCallback, useEffect, useState } from 'react';

export type Remote<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    /** muat ulang data */
    reload: () => void;
};

/**
 * Memuat data dari fungsi `loader` saat layar tampil, lengkap dengan status
 * loading dan error. `loader` harus fungsi tetap (didefinisikan di luar komponen).
 */
export function useRemote<T>(loader: (signal: AbortSignal) => Promise<T>): Remote<T> {
    const [state, setState] = useState<{
        data: T | null;
        loading: boolean;
        error: string | null;
    }>({ data: null, loading: true, error: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        // Loader berganti (misalnya kabupaten dipilih ulang): tampilkan status memuat lagi.
        setState((s) => (s.loading ? s : { ...s, loading: true, error: null }));

        loader(controller.signal)
            .then((data) => setState({ data, loading: false, error: null }))
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Terjadi kesalahan',
                }));
            });

        // Dibatalkan otomatis jika layar ditutup atau dimuat ulang
        return () => controller.abort();
    }, [loader, attempt]);

    const reload = useCallback(() => {
        setState((s) => ({ ...s, loading: true, error: null }));
        setAttempt((a) => a + 1);
    }, []);

    return { ...state, reload };
}