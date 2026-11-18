import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Daftar wishlist (id destinasi) yang dibagi ke semua layar.
 * Halaman search dan detail memakai hook yang sama, jadi ikon hati selalu sinkron.
 * Tersimpan di AsyncStorage; tab Wishlist bisa memakai `useWishlist().ids` juga.
 */
const KEY = 'wishlist_v1';

let ids: string[] = [];
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

async function load() {
    if (loaded) return;
    loaded = true;
    try {
        const raw = await AsyncStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
            const saved = parsed.filter((x): x is string => typeof x === 'string');
            ids = [...new Set([...saved, ...ids])];
            emit();
        }
    } catch {
        // gagal membaca: mulai dari daftar kosong
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    load();
    return () => {
        listeners.delete(listener);
    };
}

const getSnapshot = () => ids;

export function toggleWishlist(id: string) {
    ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    emit();
    AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {
        // tidak fatal: perubahan hanya tidak diingat
    });
}

export function useWishlist() {
    const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return {
        ids: list,
        has: (id: string) => list.includes(id),
        toggle: toggleWishlist,
    };
}