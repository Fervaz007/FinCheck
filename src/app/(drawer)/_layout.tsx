import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

function drawerIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );
}

export default function DrawerLayout() {
  const theme = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundElement },
        headerTintColor: theme.text,
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveBackgroundColor: theme.backgroundSelected,
        drawerStyle: { backgroundColor: theme.background },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: 'Inicio', drawerIcon: drawerIcon('home-outline') }}
      />
      <Drawer.Screen
        name="movimientos"
        options={{ title: 'Movimientos', drawerIcon: drawerIcon('swap-horizontal-outline') }}
      />
      <Drawer.Screen
        name="deudas"
        options={{ title: 'Deudas', drawerIcon: drawerIcon('card-outline') }}
      />
      <Drawer.Screen
        name="apartados"
        options={{ title: 'Apartados', drawerIcon: drawerIcon('flag-outline') }}
      />
      <Drawer.Screen
        name="presupuesto"
        options={{ title: 'Presupuesto', drawerIcon: drawerIcon('pie-chart-outline') }}
      />
      <Drawer.Screen
        name="simulador"
        options={{ title: 'Simulador', drawerIcon: drawerIcon('calculator-outline') }}
      />
      <Drawer.Screen
        name="reglas-presupuestarias"
        options={{ title: 'Reglas presupuestarias', drawerIcon: drawerIcon('options-outline') }}
      />
      <Drawer.Screen
        name="historial"
        options={{ title: 'Historial mensual', drawerIcon: drawerIcon('time-outline') }}
      />
      <Drawer.Screen
        name="configuracion"
        options={{ title: 'Configuración', drawerIcon: drawerIcon('settings-outline') }}
      />
    </Drawer>
  );
}
