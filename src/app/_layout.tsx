import { Stack } from 'expo-router';
import { useState } from 'react';
import { useFonts } from 'expo-font';
import { BRAND_FONTS } from '@/components/brand-name';

import AnimatedSplash from '@/components/animated-splash';
import { AuthProvider, useAuth } from '@/context/auth';
import { LanguageProvider, useLanguage } from '@/context/language';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding';
import { PreferencesProvider, usePreferences } from '@/context/preferences';

function RootNavigator() {
  const onboarding = useOnboarding();
  const auth = useAuth();
  const preferences = usePreferences();
  const language = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts(BRAND_FONTS);

  const ready = onboarding.loaded && auth.loaded && preferences.loaded && language.loaded && fontsLoaded;
  const needsAuth = onboarding.done && !auth.signedIn;
  const signedIn = onboarding.done && auth.signedIn;

  return (
    <>
      {ready && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!onboarding.done}>
            <Stack.Screen name="index" />
          </Stack.Protected>

          <Stack.Protected guard={needsAuth && auth.mode === 'register'}>
            <Stack.Screen name="register" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={needsAuth && auth.mode === 'login'}>
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
          </Stack.Protected>

          {/* Sudah masuk, tetapi akun ini belum memilih preferensi: tampil sekali */}
          <Stack.Protected guard={signedIn && !preferences.done}>
            <Stack.Screen name="preferences" options={{ animation: 'fade' }} />
          </Stack.Protected>

          {/* Aplikasi utama */}
          <Stack.Protected guard={signedIn && preferences.done}>
            <Stack.Screen name="tabs" options={{ animation: 'fade' }} />
            <Stack.Screen name="search" />
            <Stack.Screen name="destination/[id]" />
            <Stack.Screen name="edit-preferences" />
          </Stack.Protected>
        </Stack>
      )}

      {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <OnboardingProvider>
        <AuthProvider>
          <PreferencesProvider>
            <RootNavigator />
          </PreferencesProvider>
        </AuthProvider>
      </OnboardingProvider>
    </LanguageProvider>
  );
}