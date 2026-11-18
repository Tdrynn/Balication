import { PreferencePicker } from '@/components/preferences/preference-picker';
import { useLanguage } from '@/context/language';
import { usePreferences } from '@/context/preferences';

/**
 * Halaman pertama setelah akun baru dibuat. Hanya bisa dibuka selama akun ini belum memilih
 * preferensi (diatur oleh Stack.Protected di _layout.tsx). Setelah disimpan, aplikasi pindah
 * sendiri ke halaman utama.
 */
export default function PreferencesScreen() {
    const { t } = useLanguage();
    const { save } = usePreferences();

    return <PreferencePicker initial={[]} submitLabel={t('pref.next')} onSubmit={save} />;
}