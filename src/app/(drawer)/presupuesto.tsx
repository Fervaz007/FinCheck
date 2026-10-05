import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { Spacing } from '@/theme';

export default function PresupuestoScreen() {
  const { rules, activate } = useBudgetRules();

  return (
    <ScreenContainer>
      <ThemedText type="title">Presupuesto</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Activa la regla que quieres seguir este mes. Puedes crear o editar reglas en "Reglas
        presupuestarias". El cumplimiento por sección se ve en Inicio.
      </ThemedText>

      {rules.length === 0 ? (
        <EmptyState message="Aún no has creado ninguna regla presupuestaria." />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {rules.map((rule) => (
            <Pressable key={rule.id} onPress={() => activate(rule.id)}>
              <Card style={{ gap: Spacing.two }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText type="heading" themeColor={rule.isActive ? 'primary' : 'text'}>
                    {rule.isActive ? '● ' : '○ '}
                    {rule.name}
                  </ThemedText>
                  {!rule.isActive && (
                    <ThemedText type="caption" themeColor="textSecondary">
                      Tocar para activar
                    </ThemedText>
                  )}
                </View>
                <View style={{ gap: Spacing.one }}>
                  {rule.allocations.map((a) => (
                    <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {a.label}
                        {a.isMonitored ? ' (monitoreado)' : ''}
                      </ThemedText>
                      <ThemedText type="small">{a.percentage}%</ThemedText>
                    </View>
                  ))}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
