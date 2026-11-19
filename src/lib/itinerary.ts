import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { findRegencyByText } from '@/lib/regencies';
import { matchedCategories } from '@/lib/preference-categories';
import type { Destination } from '@/lib/destinations';
import type { TranslationKey } from '@/lib/translations';

// ---------------------------------------------------------------------------
// Pilihan formulir "Travel Preferences"
// ---------------------------------------------------------------------------

export type BudgetOption = {
    id: string;
    labelKey: TranslationKey;
    /** batas atas total biaya per orang untuk seluruh perjalanan (rupiah) */
    max: number;
};

export const BUDGET_OPTIONS: BudgetOption[] = [
    { id: 'b1', labelKey: 'trip.budget.1', max: 1_000_000 },
    { id: 'b2', labelKey: 'trip.budget.2', max: 3_000_000 },
    { id: 'b3', labelKey: 'trip.budget.3', max: 5_000_000 },
    { id: 'b4', labelKey: 'trip.budget.4', max: Number.POSITIVE_INFINITY },
];

export const DURATION_OPTIONS = [1, 2, 3, 4, 5, 7];
export const TRAVELER_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

/** Hasil formulir + pilihan destinasi; dibagi antar layar selama pengguna menyusun rencana. */
export type TripDraft = {
    /** id kategori preferensi (lihat preference-categories.ts) */
    categories: string[];
    /** id kabupaten; kosong = semua wilayah */
    regencyIds: string[];
    budgetId: string;
    days: number;
    travelers: number;
    /** id destinasi yang dicentang di layar rekomendasi */
    selectedIds: string[];
};

const EMPTY_DRAFT: TripDraft = {
    categories: [],
    regencyIds: [],
    budgetId: 'b2',
    days: 0,
    travelers: 0,
    selectedIds: [],
};

// ---------------------------------------------------------------------------
// Penyimpanan kecil yang bisa dipakai banyak layar (draft + itinerary jadi)
// ---------------------------------------------------------------------------

function createStore<T>(initial: T, storageKey?: string) {
    let value = initial;
    let loaded = !storageKey;
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((l) => l());

    async function load() {
        if (loaded || !storageKey) return;
        loaded = true;
        try {
            const raw = await AsyncStorage.getItem(storageKey);
            if (raw) {
                value = JSON.parse(raw) as T;
                emit();
            }
        } catch {
            // gagal membaca: mulai kosong
        }
    }

    return {
        get: () => value,
        set(next: T) {
            value = next;
            emit();
            if (storageKey) {
                AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {
                    // tidak fatal
                });
            }
        },
        use(): T {
            return useSyncExternalStore(
                (listener) => {
                    listeners.add(listener);
                    load();
                    return () => {
                        listeners.delete(listener);
                    };
                },
                () => value,
                () => value,
            );
        },
    };
}

const draftStore = createStore<TripDraft>(EMPTY_DRAFT);
export const useTripDraft = () => draftStore.use();
export const getTripDraft = () => draftStore.get();
export const setTripDraft = (patch: Partial<TripDraft>) =>
    draftStore.set({ ...draftStore.get(), ...patch });
export const resetTripDraft = () => draftStore.set(EMPTY_DRAFT);

// ---------------------------------------------------------------------------
// Itinerary jadi
// ---------------------------------------------------------------------------

export type Stop = {
    destination: Destination;
    /** menit sejak 00.00 */
    start: number;
    /** durasi kunjungan dalam menit */
    duration: number;
};

export type Day = {
    /** nama kawasan, contoh "Seminyak & Kuta" */
    title: string;
    stops: Stop[];
};

export type Itinerary = {
    createdAt: number;
    travelers: number;
    days: Day[];
    stay?: Destination;
    /** perkiraan total biaya semua orang (rupiah) */
    totalCost: number;
    /** total jam kunjungan */
    totalHours: number;
};

const itineraryStore = createStore<Itinerary | null>(null, 'itinerary_v1');
export const useItinerary = () => itineraryStore.use();
export const saveItinerary = (value: Itinerary | null) => itineraryStore.set(value);

// ---------------------------------------------------------------------------
// Logika rekomendasi dan penyusunan jadwal
// ---------------------------------------------------------------------------

/** Biaya perkiraan satu destinasi untuk seluruh perjalanan. */
export function stopCost(d: Destination, travelers: number, nights: number): number {
    return d.priceUnit === 'night' ? d.price * Math.max(1, nights) : d.price * travelers;
}

/**
 * Daftar destinasi untuk layar rekomendasi: cocok dengan kategori pilihan dan wilayah.
 * Jika tidak ada yang cocok sama sekali, tampilkan semua supaya layar tidak kosong.
 */
export function candidates(all: Destination[], draft: TripDraft): Destination[] {
    const inRegion = (d: Destination) => {
        if (draft.regencyIds.length === 0) return true;
        const id = d.regencyId ?? findRegencyByText(d.area)?.id;
        return id ? draft.regencyIds.includes(id) : false;
    };
    const byRegion = all.filter(inRegion);
    const byCategory = byRegion.filter((d) => matchedCategories(d, draft.categories).length > 0);
    const pool = byCategory.length > 0 ? byCategory : byRegion.length > 0 ? byRegion : all;
    return [...pool].sort((a, b) => b.rating - a.rating);
}

/**
 * Pilihan awal yang sudah dicentang: destinasi dan aktivitas berating tertinggi sampai
 * anggaran habis, ditambah satu penginapan yang masih muat.
 */
export function preselect(list: Destination[], draft: TripDraft): string[] {
    const budget = BUDGET_OPTIONS.find((b) => b.id === draft.budgetId)?.max ?? Infinity;
    const nights = Math.max(1, draft.days - 1);
    const travelers = Math.max(1, draft.travelers);
    const maxStops = Math.max(2, draft.days * 3);
    const chosen: string[] = [];
    let spentPerPerson = 0;
    let stops = 0;
    let stay = false;

    for (const d of list) {
        const perPerson = stopCost(d, travelers, nights) / travelers;
        if (spentPerPerson + perPerson > budget) continue;
        if (d.kind === 'Accommodation') {
            if (stay) continue;
            stay = true;
        } else {
            if (stops >= maxStops) continue;
            stops += 1;
        }
        spentPerPerson += perPerson;
        chosen.push(d.id);
    }
    return chosen;
}

const DAY_START = 9 * 60;
const TRAVEL_GAP = 45;
const STOP_MINUTES: Record<Destination['kind'], number> = {
    Destination: 120,
    Activity: 180,
    Accommodation: 0,
};

/** "Seminyak, Kuta, Badung Regency" -> "Seminyak" */
const placeName = (area: string) => area.split(',')[0]?.trim() || area;

/** Susun jadwal harian dari destinasi yang dicentang. */
export function buildItinerary(selected: Destination[], draft: TripDraft): Itinerary {
    const days = Math.max(1, draft.days);
    const travelers = Math.max(1, draft.travelers);
    const stay = selected.find((d) => d.kind === 'Accommodation');
    const visits = selected.filter((d) => d.kind !== 'Accommodation');

    // Kelompokkan yang berdekatan: urutkan menurut wilayah lalu lintang, supaya satu hari
    // tidak bolak-balik antar kabupaten.
    const ordered = [...visits].sort((a, b) => {
        const ra = a.regencyId ?? '';
        const rb = b.regencyId ?? '';
        return ra.localeCompare(rb) || (b.latitude ?? 0) - (a.latitude ?? 0);
    });

    // Bagi rata: 7 tempat / 3 hari -> 3, 2, 2
    const perDay = Array.from({ length: days }, (_, i) =>
        Math.floor(ordered.length / days) + (i < ordered.length % days ? 1 : 0),
    );

    let cursor = 0;
    const result: Day[] = [];
    for (const count of perDay) {
        const slice = ordered.slice(cursor, cursor + count);
        cursor += count;
        if (slice.length === 0) continue;

        let time = DAY_START;
        const stops: Stop[] = slice.map((destination) => {
            const duration = STOP_MINUTES[destination.kind];
            const stop = { destination, start: time, duration };
            time += duration + TRAVEL_GAP;
            return stop;
        });

        const places = [...new Set(slice.map((d) => placeName(d.area)))].slice(0, 2);
        result.push({ title: places.join(' & '), stops });
    }

    const nights = Math.max(1, days - 1);
    const totalCost = selected.reduce((sum, d) => sum + stopCost(d, travelers, nights), 0);
    const totalHours = Math.round(
        result.reduce((sum, day) => sum + day.stops.reduce((s, x) => s + x.duration, 0), 0) / 60,
    );

    return { createdAt: Date.now(), travelers, days: result, stay, totalCost, totalHours };
}

/** 540 -> "9:00 AM" (en) atau "09.00" (id) */
export function formatClock(minutes: number, language: 'en' | 'id'): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const mm = String(m).padStart(2, '0');
    if (language === 'id') return `${String(h).padStart(2, '0')}.${mm}`;
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${suffix}`;
}