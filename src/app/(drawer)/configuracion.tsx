import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';

export default function ConfiguracionScreen() {
  return (
    <ScreenContainer>
      <ThemedText type="title">Configuración</ThemedText>
      <Card>
        <ThemedText type="smallBold">FinCheck</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tu salud financiera, en un vistazo. Aplicación 100% local — tus datos nunca salen de tu
          teléfono.
        </ThemedText>
      </Card>
      <Card>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Próximamente
        </ThemedText>
        <ThemedText type="small">Exportar / importar respaldo (JSON)</ThemedText>
        <ThemedText type="small">Bloqueo con PIN / biometría</ThemedText>
        <ThemedText type="small">Notificaciones de vencimiento</ThemedText>
      </Card>
    </ScreenContainer>
  );
}
