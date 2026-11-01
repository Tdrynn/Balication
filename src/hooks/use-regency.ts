import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import {
    DEFAULT_REGENCY_ID,
    REGENCIES,
    findRegency,
    findRegencyByText,
    nearestRegency,
    type Regency,
} from '@/lib/regencies';

const STORAGE_KEY = 'weather_regency_v1';
const AUTO = 'auto'; // nilai tersimpan jika pengguna memilih "Gunakan lokasi saya"
const MAX_DISTANCE_KM = 100; // lebih jauh dari ini dianggap di luar Bali

export type LocateResult = 'ok' | 'denied' | 'outside' | 'error';

type Detection =
    | { status: 'ok'; regencyId: string }
    | { status: Exclude<LocateResult, 'ok'> };

/**
 * Mencari kabupaten tempat pengguna berada.
 * askPermission = false: tidak memunculkan dialog izin (dipakai saat aplikasi dibuka).
 */
async function detectRegency(askPermission: boolean): Promise<Detection> {
    try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
            if (!askPermission) return { status: 'denied' };
            permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') return { status: 'denied' };
        }

        const position =
            (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
            (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        const { latitude, longitude } = position.coords;

        const nearest = nearestRegency(latitude, longitude);
        if (nearest.distanceKm > MAX_DISTANCE_KM) return { status: 'outside' };

        // Nama kabupaten dari alamat lebih akurat daripada jarak ke titik pusat
        // (contoh: Kuta masuk Badung, tetapi lebih dekat ke pusat Denpasar).
        let matched: Regency | undefined;
        try {
            const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
            matched = findRegencyByText(place?.subregion) ?? findRegencyByText(place?.city);
        } catch {
            // alamat tidak tersedia: pakai kabupaten terdekat
        }

        return { status: 'ok', regencyId: (matched ?? nearest.regency).id };
    } catch {
        return { status: 'error' };
    }
}

/** Kabupaten untuk cuaca: dipilih manual, atau otomatis mengikuti lokasi pengguna. */
export function useRegency(): {
    regency: Regency;
    /** true jika sedang mengikuti lokasi pengguna */
    auto: boolean;
    select: (id: string) => void;
    /** Meminta izin (jika perlu), lalu mengikuti lokasi pengguna */
    locate: () => Promise<LocateResult>;
} {
    const [mode, setMode] = useState<string>(DEFAULT_REGENCY_ID); // 'auto' atau id kabupaten
    const [detectedId, setDetectedId] = useState<string | null>(null);

    // Saat aplikasi dibuka: pulihkan pilihan terakhir
    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (!active || !saved) return;

                if (saved === AUTO) {
                    // Tanpa dialog izin; hanya jika izin sudah pernah diberikan
                    const result = await detectRegency(false);
                    if (!active) return;
                    if (result.status === 'ok') {
                        setDetectedId(result.regencyId);
                        setMode(AUTO);
                    }
                    // gagal: tetap memakai kabupaten bawaan
                } else if (findRegency(saved)) {
                    setMode(saved);
                }
            } catch {
                // gagal membaca: pakai kabupaten bawaan
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const select = useCallback((id: string) => {
        if (!findRegency(id)) return;
        setMode(id);
        AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
            // tidak fatal: pilihan hanya tidak diingat
        });
    }, []);

    const locate = useCallback(async (): Promise<LocateResult> => {
        const result = await detectRegency(true);
        if (result.status !== 'ok') return result.status;

        setDetectedId(result.regencyId);
        setMode(AUTO);
        AsyncStorage.setItem(STORAGE_KEY, AUTO).catch(() => {
            // tidak fatal
        });
        return 'ok';
    }, []);

    const auto = mode === AUTO;
    const id = auto ? (detectedId ?? DEFAULT_REGENCY_ID) : mode;

    return { regency: findRegency(id) ?? REGENCIES[0], auto, select, locate };
}