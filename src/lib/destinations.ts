import { API_URL } from '@/lib/api';
import { findRegencyByText } from '@/lib/regencies';
import type { TranslationKey } from '@/lib/translations';

export type Kind = 'Destination' | 'Activity' | 'Accommodation';
export const KINDS: Kind[] = ['Destination', 'Activity', 'Accommodation'];

export type Destination = {
    id: string;
    name: string;
    kind: Kind;
    /** contoh: Beach, Water Park, Temples & Culture */
    category: string;
    /** teks lokasi singkat, contoh: "Kuta, Badung" */
    area: string;
    /** id kabupaten (lihat src/lib/regencies.ts), dipakai untuk filter Location */
    regencyId?: string;
    rating: number;
    reviews?: number;
    /** harga dalam rupiah; 0 = gratis */
    price: number;
    priceUnit: 'person' | 'night';
    hours: string;
    description: string;
    tags: string[];
    /** URL gambar untuk carousel; boleh kosong */
    images: string[];
    latitude?: number;
    longitude?: number;
};

/**
 * true  = memakai DATA CONTOH di bawah (untuk mencoba tampilan).
 * false = mengambil dari backend Anda lewat fetchRemote().
 */
const USE_MOCK = true;

/** Endpoint daftar semua destinasi di backend Anda. Ubah sesuai API tim. */
const DESTINATIONS_PATH = '/destinations';

// ---------------------------------------------------------------------------
// DATA CONTOH: rating dan nama mengikuti mockup, selebihnya hanya contoh.
// Isi `images` dengan URL gambar agar carousel menampilkan foto.
// ---------------------------------------------------------------------------
const MOCK_BASE: Destination[] = [
    {
        id: 'waterboom',
        name: 'Waterboom Bali',
        kind: 'Destination',
        category: 'Water Park',
        area: 'Kuta, Badung',
        regencyId: 'badung',
        rating: 4.7,
        reviews: 3120,
        price: 450000,
        priceUnit: 'person',
        hours: '09.00 - 18.00',
        description:
            'A large water park with slides, pools, and a relaxed beachside atmosphere. A good choice for families and groups.',
        tags: ['Water Park', 'Family'],
        images: [],
        latitude: -8.7276,
        longitude: 115.1707,
    },
    {
        id: 'bali-zoo',
        name: 'Bali Zoo',
        kind: 'Destination',
        category: 'Zoo & Wildlife',
        area: 'Gianyar',
        regencyId: 'gianyar',
        rating: 4.5,
        reviews: 2210,
        price: 400000,
        priceUnit: 'person',
        hours: '09.00 - 17.00',
        description:
            'A wildlife park where you can see animals up close, join feeding sessions, and enjoy shaded walking paths.',
        tags: ['Zoo & Wildlife', 'Family'],
        images: [],
        latitude: -8.5985,
        longitude: 115.2589,
    },
    {
        id: 'kelingking',
        name: 'Kelingking Beach',
        kind: 'Destination',
        category: 'Beach',
        area: 'Nusa Penida, Klungkung',
        regencyId: 'klungkung',
        rating: 4.6,
        reviews: 4180,
        price: 0,
        priceUnit: 'person',
        hours: '24 Hours',
        description:
            'A dramatic cliff and beach on the southwest coast of Nusa Penida, famous for its T-Rex shaped headland and ocean views.',
        tags: ['Beach', 'Nature'],
        images: [],
        latitude: -8.7502,
        longitude: 115.4747,
    },
    {
        id: 'monkey-forest',
        name: 'Monkey Forest',
        kind: 'Destination',
        category: 'Zoo & Wildlife',
        area: 'Ubud, Gianyar',
        regencyId: 'gianyar',
        rating: 4.2,
        reviews: 9020,
        price: 100000,
        priceUnit: 'person',
        hours: '09.00 - 18.00',
        description:
            'A sacred forest sanctuary in the heart of Ubud, home to long-tailed macaques, old temples, and shady stone paths.',
        tags: ['Zoo & Wildlife', 'Nature'],
        images: [],
        latitude: -8.5188,
        longitude: 115.2589,
    },
    {
        id: 'tanah-lot',
        name: 'Tanah Lot',
        kind: 'Destination',
        category: 'Temples & Culture',
        area: 'Tabanan',
        regencyId: 'tabanan',
        rating: 4.2,
        reviews: 7340,
        price: 75000,
        priceUnit: 'person',
        hours: '07.00 - 19.00',
        description:
            'A sea temple on a rock formation just off the coast, best visited at sunset when the sky turns orange.',
        tags: ['Temples & Culture', 'Sunset'],
        images: [],
        latitude: -8.6212,
        longitude: 115.0868,
    },
    {
        id: 'seminyak-beach',
        name: 'Seminyak Beach',
        kind: 'Destination',
        category: 'Beach',
        area: 'Seminyak, Kuta, Badung Regency',
        regencyId: 'badung',
        rating: 4.5,
        reviews: 5253,
        price: 0,
        priceUnit: 'person',
        hours: '24 Hours',
        description:
            "Seminyak Beach is one of Bali's popular beaches, known for its wide stretch of white sand, vibrant atmosphere, and stunning sunset views. It is a hub for entertainment and lifestyle, surrounded by luxury resorts, cafes, and high-end beach clubs. Beyond sunbathing and surfing during the day, the beach comes alive at night with vibrant beachfront dining and nightlife.",
        tags: ['Beach', 'Nature'],
        images: [],
        latitude: -8.6913,
        longitude: 115.1585,
    },
    {
        id: 'tegallalang',
        name: 'Tegallalang Rice Terrace',
        kind: 'Destination',
        category: 'Nature',
        area: 'Tegallalang, Gianyar',
        regencyId: 'gianyar',
        rating: 4.6,
        reviews: 6100,
        price: 25000,
        priceUnit: 'person',
        hours: '08.00 - 18.00',
        description:
            'Layered green rice terraces north of Ubud with walking paths, swings, and cafes overlooking the valley.',
        tags: ['Nature', 'Photography'],
        images: [],
        latitude: -8.4312,
        longitude: 115.2792,
    },
    {
        id: 'batur-trek',
        name: 'Mount Batur Sunrise Trek',
        kind: 'Activity',
        category: 'Hiking',
        area: 'Kintamani, Bangli',
        regencyId: 'bangli',
        rating: 4.8,
        reviews: 2780,
        price: 600000,
        priceUnit: 'person',
        hours: '02.00 - 10.00',
        description:
            'A guided early-morning hike up an active volcano to watch the sunrise above the clouds, usually with breakfast at the top.',
        tags: ['Hiking', 'Sunrise'],
        images: [],
        latitude: -8.2421,
        longitude: 115.3753,
    },
    {
        id: 'villa-canggu',
        name: 'Villa Contoh Canggu',
        kind: 'Accommodation',
        category: 'Villa',
        area: 'Canggu, Badung',
        regencyId: 'badung',
        rating: 4.6,
        reviews: 410,
        price: 1200000,
        priceUnit: 'night',
        hours: 'Check-in 14.00',
        description:
            'Sample listing: a private villa with a pool, close to cafes and surf beaches. Replace this with real data from your API.',
        tags: ['Villa', 'Pool'],
        images: [],
        latitude: -8.6478,
        longitude: 115.1385,
    },
];

/**
 * Foto PLACEHOLDER (acak, dari picsum.photos) supaya carousel di halaman detail
 * langsung terlihat saat mencoba. Bukan foto tempat aslinya: ganti dengan foto
 * sendiri / dari API. Butuh internet; jika gagal dimuat, tampil blok warna.
 */
const demoImages = (seed: string) =>
    [1, 2, 3].map((n) => `https://picsum.photos/seed/${seed}-${n}/1080/720`);

const MOCK: Destination[] = MOCK_BASE.map((d) => ({
    ...d,
    images: d.images.length > 0 ? d.images : demoImages(d.id),
}));

// ---------------------------------------------------------------------------
// Normalisasi respons backend (bentuk JSON belum pasti, jadi dibuat toleran)
// ---------------------------------------------------------------------------
const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;

const num = (v: unknown): number | undefined => {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

function normalize(raw: unknown, index: number): Destination | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;

    const name = str(r.name) ?? str(r.title);
    if (!name) return null;

    const categoryField = r.category;
    const category =
        str(categoryField) ??
        (categoryField && typeof categoryField === 'object'
            ? str((categoryField as Record<string, unknown>).name)
            : undefined) ??
        'Destination';

    const kindText = (str(r.kind) ?? str(r.type) ?? '').toLowerCase();
    const kind = KINDS.find((k) => k.toLowerCase() === kindText) ?? 'Destination';

    const area = str(r.area) ?? str(r.location) ?? str(r.regency) ?? '';
    const images = Array.isArray(r.images)
        ? r.images.filter((x): x is string => typeof x === 'string')
        : [];
    const single = str(r.image) ?? str(r.imageUrl) ?? str(r.thumbnail);
    if (images.length === 0 && single) images.push(single);

    const tags = Array.isArray(r.tags)
        ? r.tags.filter((x): x is string => typeof x === 'string')
        : [category];

    return {
        id: String(r.id ?? r._id ?? index),
        name,
        kind,
        category,
        area,
        regencyId: findRegencyByText(str(r.regency) ?? area)?.id,
        rating: num(r.rating) ?? 0,
        reviews: num(r.reviews) ?? num(r.reviewCount),
        price: num(r.price) ?? 0,
        priceUnit: r.priceUnit === 'night' ? 'night' : 'person',
        hours: str(r.hours) ?? str(r.openHours) ?? '-',
        description: str(r.description) ?? '',
        tags,
        images,
        latitude: num(r.latitude) ?? num(r.lat),
        longitude: num(r.longitude) ?? num(r.lng) ?? num(r.lon),
    };
}

async function fetchRemote(signal?: AbortSignal): Promise<Destination[]> {
    const response = await fetch(`${API_URL}${DESTINATIONS_PATH}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json: unknown = await response.json();
    const list = Array.isArray(json)
        ? json
        : Array.isArray((json as { data?: unknown }).data)
            ? (json as { data: unknown[] }).data
            : [];
    return list.map(normalize).filter((d): d is Destination => d !== null);
}

// Cache singkat: halaman search dan detail memakai data yang sama
let cache: { at: number; data: Destination[] } | null = null;
const CACHE_MS = 60_000;

export async function fetchDestinations(signal?: AbortSignal): Promise<Destination[]> {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

    let data: Destination[];
    if (USE_MOCK) {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        data = MOCK;
    } else {
        data = await fetchRemote(signal);
    }

    cache = { at: Date.now(), data };
    return data;
}

// ---------------------------------------------------------------------------
// Pilihan filter
// ---------------------------------------------------------------------------
export type Option = { id: string; label: string };

// `label` (Inggris) tetap ada untuk halaman yang belum diterjemahkan;
// `labelKey` dipakai halaman yang sudah mengikuti bahasa aplikasi.
export const PRICE_OPTIONS: (Option & {
    labelKey: TranslationKey;
    test: (price: number) => boolean;
})[] = [
        { id: 'any', label: 'Any price', labelKey: 'filter.price.any', test: () => true },
        { id: 'free', label: 'Free', labelKey: 'filter.price.free', test: (p) => p === 0 },
        {
            id: 'low',
            label: 'Under IDR 100K',
            labelKey: 'filter.price.low',
            test: (p) => p > 0 && p < 100_000,
        },
        {
            id: 'mid',
            label: 'IDR 100K - 300K',
            labelKey: 'filter.price.mid',
            test: (p) => p >= 100_000 && p <= 300_000,
        },
        { id: 'high', label: 'Above IDR 300K', labelKey: 'filter.price.high', test: (p) => p > 300_000 },
    ];

export const RATING_OPTIONS: (Option & { labelKey: TranslationKey; min: number })[] = [
    { id: 'any', label: 'Any rating', labelKey: 'filter.rating.any', min: 0 },
    { id: '4', label: '4.0 and up', labelKey: 'filter.rating.4', min: 4 },
    { id: '4.5', label: '4.5 and up', labelKey: 'filter.rating.45', min: 4.5 },
];

// ---------------------------------------------------------------------------
// Tampilan harga
// ---------------------------------------------------------------------------
/** 0 -> "IDR 0", 150000 -> "IDR 150K", 1200000 -> "IDR 1.2M" */
export function shortPrice(price: number): string {
    if (price >= 1_000_000) return `IDR ${+(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `IDR ${+(price / 1_000).toFixed(0)}K`;
    return `IDR ${price}`;
}

export function priceLabel(d: Destination): string {
    return `${shortPrice(d.price)} /${d.priceUnit}`;
}

/** 5253 -> "5,253" */
export function formatCount(value: number): string {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}