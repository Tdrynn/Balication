import { useRouter } from 'expo-router';

import { PreferencePicker } from '@/components/preferences/preference-picker';
import { useLanguage } from '@/context/language';
import { usePreferences } from '@/context/preferences';

/** Mengubah preferensi setelahnya (dibuka dari tombol "Edit" di Home). */
export default function EditPreferencesScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { categories, save } = usePreferences();

    return (
        <PreferencePicker
            initial={categories}
            submitLabel={t('pref.save')}
            onSubmit={(ids) => {
                save(ids);
                router.back();
            }}
            onCancel={() => router.back()}
        />
    );
}