export type Regency = {
    id: string;
    /** nama pendek untuk tampilan ringkas */
    name: string;
    /** nama lengkap untuk daftar pilihan */
    label: string;
    latitude: number;
    longitude: number;
};

/**
 * Delapan kabupaten dan satu kota di Bali.
 * Koordinat adalah PERKIRAAN pusat kota/ibu kota tiap wilayah. Data cuaca diambil per titik,
 * jadi ubah latitude/longitude jika ingin titik yang lebih tepat.
 *
 * Contoh: untuk kawasan wisata selatan Badung (Kuta, Seminyak, Uluwatu),
 * pakai sekitar latitude -8.72 dan longitude 115.17.
 */
export const REGENCIES: Regency[] = [
    { id: 'badung', name: 'Badung', label: 'Kab. Badung', latitude: -8.5476, longitude: 115.1769 },
    { id: 'bangli', name: 'Bangli', label: 'Kab. Bangli', latitude: -8.4542, longitude: 115.3542 },
    { id: 'buleleng', name: 'Buleleng', label: 'Kab. Buleleng', latitude: -8.112, longitude: 115.0882 },
    { id: 'denpasar', name: 'Denpasar', label: 'Kota Denpasar', latitude: -8.65, longitude: 115.2167 },
    { id: 'gianyar', name: 'Gianyar', label: 'Kab. Gianyar', latitude: -8.5426, longitude: 115.325 },
    { id: 'jembrana', name: 'Jembrana', label: 'Kab. Jembrana', latitude: -8.3566, longitude: 114.6197 },
    { id: 'karangasem', name: 'Karangasem', label: 'Kab. Karangasem', latitude: -8.45, longitude: 115.6167 },
    { id: 'klungkung', name: 'Klungkung', label: 'Kab. Klungkung', latitude: -8.5278, longitude: 115.4036 },
    { id: 'tabanan', name: 'Tabanan', label: 'Kab. Tabanan', latitude: -8.5376, longitude: 115.1246 },
];

/** Kabupaten yang dipakai sebelum pengguna memilih. */
export const DEFAULT_REGENCY_ID = 'denpasar';

export function findRegency(id: string): Regency | undefined {
    return REGENCIES.find((r) => r.id === id);
}

/** Cari kabupaten dari teks alamat, misalnya "Kabupaten Badung" atau "Kota Denpasar". */
export function findRegencyByText(text?: string | null): Regency | undefined {
    if (!text) return undefined;
    const lower = text.toLowerCase();
    return REGENCIES.find((r) => lower.includes(r.name.toLowerCase()));
}

/** Kabupaten dengan titik pusat terdekat dari sebuah koordinat (rumus haversine). */
export function nearestRegency(
    latitude: number,
    longitude: number,
): { regency: Regency; distanceKm: number } {
    const toRad = (degrees: number) => (degrees * Math.PI) / 180;

    let best = { regency: REGENCIES[0], distanceKm: Infinity };
    for (const regency of REGENCIES) {
        const dLat = toRad(regency.latitude - latitude);
        const dLon = toRad(regency.longitude - longitude);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(latitude)) * Math.cos(toRad(regency.latitude)) * Math.sin(dLon / 2) ** 2;
        const distanceKm = 2 * 6371 * Math.asin(Math.sqrt(a));
        if (distanceKm < best.distanceKm) best = { regency, distanceKm };
    }
    return best;
}