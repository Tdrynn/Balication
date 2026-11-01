/**
 * Semua pemanggilan jaringan ada di file ini.
 * Kalau bentuk data API Anda berbeda, cukup ubah fungsi toDestination() di bawah.
 */
import type { Regency } from '@/lib/regencies';

// Alamat dasar API Anda, dibaca dari file .env (EXPO_PUBLIC_API_URL=http://10.0.2.2:3000)
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** Jalur endpoint destinasi populer di API Anda. Sesuaikan. */
const POPULAR_PATH = '/destinations/popular';

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** GET JSON dengan pesan error yang mudah dipahami. */
async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
    let res: Response;
    try {
        res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    } catch (e) {
        if (signal.aborted) throw e; // dibatalkan sengaja, biarkan hook yang menangani
        throw new Error('Tidak bisa terhubung. Periksa internet atau alamat server.');
    }
    if (!res.ok) throw new Error(`Server mengembalikan status ${res.status}`);
    return res.json();
}

/* ------------------------------------------------------------------ */
/* CUACA (Open-Meteo: gratis, tanpa API key)                           */
/* ------------------------------------------------------------------ */

export type Weather = {
    temperature: number; // °C
    humidity: number; // %
    windSpeed: number; // km/jam
    code: number; // kode cuaca WMO
    time: string; // "2026-11-01T12:15" (zona waktu Makassar)
    regencyId: string; // kabupaten pemilik data ini
};

// Koordinat tiap kabupaten ada di src/lib/regencies.ts
function weatherUrl(regency: Regency): string {
    return (
        'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${regency.latitude}&longitude=${regency.longitude}` +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&timezone=Asia%2FMakassar'
    );
}

export async function fetchWeather(regency: Regency, signal: AbortSignal): Promise<Weather> {
    const json = await getJson(weatherUrl(regency), signal);
    const current = isRecord(json) && isRecord(json.current) ? json.current : null;

    if (!current || typeof current.temperature_2m !== 'number') {
        throw new Error('Format data cuaca tidak dikenali');
    }

    return {
        temperature: current.temperature_2m,
        humidity: Number(current.relative_humidity_2m),
        windSpeed: Number(current.wind_speed_10m),
        code: Number(current.weather_code),
        time: String(current.time ?? ''),
        regencyId: regency.id,
    };
}

/* ------------------------------------------------------------------ */
/* DESTINASI POPULER (API Anda)                                        */
/* ------------------------------------------------------------------ */

export type Destination = {
    id: string;
    name: string;
    location: string;
    image: string | null;
};

/** Ambil nilai teks pertama yang ada dari daftar nama field. */
function text(raw: Raw, keys: string[]): string | null {
    for (const key of keys) {
        const value = raw[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (typeof value === 'number') return String(value);
    }
    return null;
}

function firstImage(raw: Raw): string | null {
    const list = raw.images ?? raw.photos ?? raw.gallery;
    if (!Array.isArray(list) || list.length === 0) return null;
    const first: unknown = list[0];
    if (typeof first === 'string') return first;
    if (isRecord(first)) return text(first, ['url', 'src', 'image', 'path']);
    return null;
}

/** Jika API mengirim alamat relatif (/uploads/a.jpg), tambahkan alamat server. */
function toAbsolute(url: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * >>> UBAH DI SINI jika nama field API Anda berbeda. <<<
 * Satu item dari API -> satu Destination yang dipakai tampilan.
 */
function toDestination(raw: Raw, index: number): Destination {
    const location =
        text(raw, ['location', 'city', 'regency', 'kabupaten', 'address', 'lokasi']) ??
        (isRecord(raw.location) ? text(raw.location, ['name', 'city', 'regency']) : null) ??
        '';

    return {
        id: text(raw, ['id', '_id', 'uuid', 'slug']) ?? String(index),
        name: text(raw, ['name', 'title', 'nama']) ?? 'Tanpa nama',
        location,
        image: toAbsolute(
            text(raw, ['image', 'image_url', 'imageUrl', 'thumbnail', 'photo', 'cover']) ??
            firstImage(raw),
        ),
    };
}

export async function fetchPopularDestinations(signal: AbortSignal): Promise<Destination[]> {
    if (!API_URL) {
        throw new Error('EXPO_PUBLIC_API_URL belum diatur di file .env');
    }

    const json = await getJson(`${API_URL}${POPULAR_PATH}`, signal);

    // Mendukung dua bentuk: [ ... ]  atau  { "data": [ ... ] }
    const list: unknown[] = Array.isArray(json)
        ? json
        : isRecord(json) && Array.isArray(json.data)
            ? json.data
            : [];

    return list.filter(isRecord).map(toDestination);
}