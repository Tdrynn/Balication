import type { Regency } from '@/lib/regencies';
import type { TranslationKey } from '@/lib/translations';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * Nama kabupaten/kota sesuai bahasa aplikasi:
 * Indonesia "Kab. Badung" / "Kota Denpasar", Inggris "Badung Regency" / "Denpasar City".
 * Denpasar satu-satunya kota; yang lain kabupaten.
 */
export function regencyLabel(regency: Regency, t: Translate): string {
    return t(regency.id === 'denpasar' ? 'regency.city' : 'regency.regency', {
        name: regency.name,
    });
}