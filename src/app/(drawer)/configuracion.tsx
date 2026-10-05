import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { resetAllData } from '@/db/reset';
import { useAppStore } from '@/hooks/useAppStore';
import { Spacing } from '@/theme';

export default function ConfiguracionScreen() {
  const { setActiveMonth, setActiveBudgetRuleId } = useAppStore();

  const confirmReset = () => {
    Alert.alert(
      'Borrar todos los datos',
      'Esto elimina TODAS tus deudas, movimientos, apartados, simulaciones, historial y reglas presupuestarias. La app quedará como recién instalada. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            const now = new Date();
            setActiveMonth(now.getFullYear(), now.getMonth() + 1);
            setActiveBudgetRuleId(null);
            Alert.alert('Listo', 'Todos los datos fueron eliminados. La app está como recién instalada.');
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <ThemedText type="title">Configuración</ThemedText>
      <Card style={{ gap: Spacing.one }}>
        <ThemedText type="heading">FinCheck</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tu salud financiera, en un vistazo. Aplicación 100% local — tus datos nunca salen de tu
          teléfono.
        </ThemedText>
      </Card>
      <Card style={{ gap: Spacing.one }}>
        <ThemedText type="caption" themeColor="textSecondary">
          Próximamente
        </ThemedText>
        <ThemedText type="small">Exportar / importar respaldo (JSON)</ThemedText>
        <ThemedText type="small">Bloqueo con PIN / biometría</ThemedText>
        <ThemedText type="small">Notificaciones de vencimiento</ThemedText>
      </Card>
      <Card style={{ gap: Spacing.three }}>
        <ThemedText type="heading" themeColor="critical">
          Zona de peligro
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Elimina todos tus datos y reinicia la app desde cero. Útil para empezar de nuevo.
        </ThemedText>
        <Button label="Borrar todos los datos" variant="destructive" onPress={confirmReset} />
      </Card>
    </ScreenContainer>
  );
}
