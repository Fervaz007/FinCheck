import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '@/db/client';
import migrations from '../../drizzle/migrations';
import { runReconciliation } from '@/services/recurring/reconciliation';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const [reconciled, setReconciled] = useState(false);

  useEffect(() => {
    if (!migrationsReady) return;
    (async () => {
      try {
        await runReconciliation(db, new Date());
      } finally {
        setReconciled(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, [migrationsReady]);

  if (migrationError) {
    throw migrationError;
  }

  if (!migrationsReady || !reconciled) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
      </Stack>
    </ThemeProvider>
  );
}
