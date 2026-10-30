import { Stack } from 'expo-router';
import { useState } from 'react';

import AnimatedSplash from '@/components/animated-splash';
import { AuthProvider, useAuth } from '@/context/auth';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding';

function RootNavigator() {
  const onboarding = useOnboarding();
  const auth = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const ready = onboarding.loaded && auth.loaded;
  const needsAuth = onboarding.done && !auth.signedIn;

  return (
    <>
      {ready && (
        <Stack screenOptions={{ headerShown: false }}>
          {/* 1. Pemakaian pertama: onboarding */}
          <Stack.Protected guard={!onboarding.done}>
            <Stack.Screen name="index" />
          </Stack.Protected>

          {/* 2. Belum login: Register (belum punya akun) atau Login (sudah punya akun) */}
          <Stack.Protected guard={needsAuth && auth.mode === 'register'}>
            <Stack.Screen name="register" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={needsAuth && auth.mode === 'login'}>
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
          </Stack.Protected>

          {/* 3. Sudah login: aplikasi utama */}
          <Stack.Protected guard={onboarding.done && auth.signedIn}>
            <Stack.Screen name="tabs" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
      )}

      {showSplash && <AnimatedSplash onFinish={() => setShowSplash(false)} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </OnboardingProvider>
  );
}