## Why

FinCheck no existe todavía: no hay forma de registrar ingresos, egresos y deudas de forma separada, de aplicar una regla de presupuesto configurable, de ver una salud financiera calculada (no arbitraria), ni de simular el impacto de una nueva deuda antes de adquirirla. Esta propuesta construye el núcleo funcional de la app — 100% offline, sin backend — necesario para que sea útil desde el primer uso real.

## What Changes

- Nuevo proyecto Expo + TypeScript + expo-router, con `expo-sqlite` + Drizzle ORM como capa de persistencia, preparado para build vía Dev Client + EAS (sin depender de Android Studio).
- Modelo de datos normalizado: cuentas con saldo real, categorías configurables, ingresos, egresos, deudas con historial de pagos, reglas de presupuesto configurables (con validación de suma = 100%), límite de endeudamiento independiente de la regla de presupuesto, transacciones recurrentes, y resúmenes mensuales cacheados con snapshot de la configuración vigente en cada mes.
- Motor de recurrencias y reconciliación al abrir la app: reconstruye de forma idempotente y transaccional todos los ingresos/egresos/pagos de deuda que debieron ocurrir mientras la app estuvo cerrada (días o semanas), sin depender de ejecución en segundo plano.
- Ciclo de vida explícito para pagos de deuda: `scheduled` → `vencido` (derivado) → `confirmed`. Ningún pago se resta del saldo real ni del saldo pendiente de la deuda hasta que el usuario lo confirme manualmente.
- Proyección de saldo futuro de solo lectura (saldo real vs. saldo proyectado), separada del proceso de reconciliación que sí persiste datos.
- Cálculo de salud financiera basado en reglas configurables (no estados arbitrarios): porcentaje a deudas, a necesidades, a ahorro, disponible mensual, y cumplimiento de la regla de presupuesto activa.
- Dashboard principal (dark, estilo fintech) con resumen del mes, indicador de salud financiera, y navegación inferior (Inicio, Movimientos, Deudas, Presupuesto, Más).
- Simulador general de nuevas compras/deudas (no limitado a autos): compara "situación actual" vs. "con nueva compra" en montos y porcentajes, contra el límite de endeudamiento configurado.
- Historial mensual navegable basado en `monthly_summaries`.

**Fuera de alcance de este cambio** (quedan para cambios futuros, según el plan de fases original): metas de ahorro, gráficas, notificaciones locales de recordatorio, backup/restore, y seguridad biométrica/PIN. El motor de recurrencias sí se incluye aquí porque los campos de frecuencia son parte del modelo de datos desde el día uno de ingresos/egresos/deudas.

## Capabilities

### New Capabilities
- `accounts`: cuentas reales (efectivo, banco, tarjeta) con saldo derivado de su ledger de movimientos.
- `categories`: categorías de ingreso/egreso configurables (crear/editar/eliminar), con asignación a un grupo de presupuesto.
- `income`: registro de ingresos únicos y recurrentes (descripción, categoría, monto, fecha, frecuencia, notas).
- `expenses`: registro de egresos únicos y recurrentes (descripción, categoría, monto, fecha, frecuencia, método de pago, notas).
- `debts`: gestión de deudas/obligaciones y su historial de pagos, con estado `scheduled`/`confirmed` y "vencido" derivado.
- `budget-rules`: reglas de presupuesto configurables o personalizadas (ej. 50/30/20, 40/40/20), con validación de que la suma de porcentajes sea 100%.
- `debt-limit`: configuración independiente del porcentaje máximo de ingresos destinado a deudas, y cálculo de capacidad disponible para nueva deuda.
- `recurring-transactions`: definición de recurrencias (diaria/semanal/mensual-día/quincenal-fijo/mensual-intervalo/anual), reconciliación idempotente y transaccional al abrir la app, y proyección de saldo futuro de solo lectura.
- `financial-health`: cálculo del indicador de salud financiera (🟢🟡🟠🔴) a partir de reglas configurables.
- `dashboard`: pantalla principal con resumen del mes y salud financiera.
- `purchase-simulator`: simulación general de nuevas compras/deudas con comparación antes/después.
- `monthly-history`: historial mensual navegable de resúmenes financieros.

### Modified Capabilities
_(ninguna — proyecto nuevo, sin specs existentes)_

## Impact

- Proyecto nuevo desde cero: estructura de carpetas (`app/`, `components/`, `db/`, `models/`, `dao/`, `services/financial`, `services/recurring`, `hooks/`, `theme/`).
- Dependencias nuevas: `expo`, `expo-router`, `expo-sqlite`, `expo-dev-client`, `drizzle-orm`, `drizzle-kit`, `zustand`, `date-fns`, `react-hook-form`, `zod`.
- Configuración de build: `eas.json` y cuenta Expo para Dev Client/EAS Build.
- Sin impacto en sistemas externos: la app es 100% offline, sin API ni backend en este cambio.
