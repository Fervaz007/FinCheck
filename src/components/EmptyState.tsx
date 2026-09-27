import { ThemedText } from './themed-text';
import { Card } from './Card';

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <ThemedText themeColor="textSecondary">{message}</ThemedText>
    </Card>
  );
}
