## Context

FinCheck es una app móvil personal (Android primero, preparada para iOS), 100% offline, sin backend ni autenticación en esta fase. Stack: React Native + Expo + TypeScript + `expo-router` + `expo-sqlite` + Drizzle ORM + Zustand + `date-fns`. Build/instalación sin Android Studio vía Dev Client + EAS Build (cloud).

Restricción central del usuario: la app puede estar cerrada días o semanas y, al reabrirse, debe reconstruir correctamente todo lo que debió ocurrir (sueldos, pagos recurrentes, vencimientos de deuda) sin depender de ejecución en segundo plano, cron externo, ni servidor.

## Goals / Non-Goals

**Goals:**
- Modelo de datos normalizado, con montos monetarios como enteros (`_cents`) para evitar drift de punto flotante.
- Separación estricta de capas: `dao/` (solo queries Drizzle) → `services/financial` y `services/recurring` (lógica pura, testeable sin I/O) → `hooks/` (puente) → `app/` y `components/` (UI).
- Reconciliación de recurrencias idempotente y transaccional al abrir la app.
- Distinción explícita entre saldo real (confirmado) y saldo proyectado (solo lectura, nunca persistido).
- Los pagos de deuda nunca se descuentan automáticamente — requieren confirmación explícita del usuario.
- Salud financiera y reglas de presupuesto calculadas por función pura a partir de configuración, nunca hardcodeadas.
- Historial mensual estable: `monthly_summaries` guarda snapshot de qué regla/límite estaba vigente ese mes.

**Non-Goals (de este cambio):**
- Metas de ahorro, gráficas, notificaciones locales, backup/restore, PIN/biometría — capacidades futuras, no requeridas para que el núcleo funcione.
- Sincronización en la nube, multiusuario, autenticación.
- Vincular automáticamente cargos de tarjeta de crédito (cuenta) con el saldo de la deuda correspondiente — quedan como registros independientes en v1 (ver Open Questions).

## Decisions

### 1. Montos monetarios como enteros
Todas las columnas de dinero se guardan como `INTEGER` en centavos (`amount_cents`), nunca `REAL`/`FLOAT`. Conversión a formato de moneda solo en la capa de presentación (`utils/money.ts`). Evita acumulación de error de punto flotante en sumas repetidas de meses/años.

### 2. Drizzle ORM sobre expo-sqlite
Alternativas consideradas: SQL crudo con `expo-sqlite` directo. Se eligió Drizzle porque da schema-as-code tipado y migraciones versionadas (`drizzle-kit`), alineado con TypeScript estricto y con la exigencia de un proyecto mantenible "durante años". Costo aceptado: una dependencia adicional y su curva de aprendizaje.

### 3. Cuentas (`accounts`) con saldo derivado, no almacenado
El saldo de una cuenta se calcula como `initial_balance_cents + Σ(income) - Σ(expenses) - Σ(debt_payments confirmados)` para esa cuenta, no como un campo mutable editado directamente. Evita drift entre el saldo mostrado y la suma real del ledger. Se puede cachear en `hooks` para performance, pero la fuente de verdad es siempre la suma.

### 4. Motor de recurrencias: `recurrence_type` + `recurrence_config` (JSON) interpretados por función pura
```
computeOccurrences(config: RecurrenceConfig, from: Date, to: Date): Date[]
```
Sin I/O, determinista, unit-testeable con casos límite (mes de 28/29/30/31 días, año bisiesto). Tipos soportados: `DAILY_INTERVAL`, `WEEKLY`, `MONTHLY_DAY`, `MONTHLY_LAST_DAY`, `SEMIMONTHLY_FIXED` (día fijo + último día — modela "quincena" de nómina, NO es un intervalo rodante de 15 días), `MONTHLY_INTERVAL`, `ANNUAL`.

**Alternativa descartada**: modelar "quincenal" como `DAILY_INTERVAL{15}`. Se descarta porque un intervalo rodante desde una fecha ancla se va corriendo mes a mes (16-sep, 1-oct, 16-oct...) y no corresponde a la semántica real de nómina quincenal (día 15 y último día de cada mes, fijos).

**Clamp de día-de-mes**: si el día configurado no existe en un mes dado (ej. día 31 en un mes de 30 días), se usa el último día disponible de ese mes. Semántica documentada explícitamente para evitar ambigüedad; cubierta por pruebas unitarias dedicadas.

### 5. Idempotencia vía ledger `recurrence_occurrences` con restricción UNIQUE
```
UNIQUE(recurring_transaction_id, occurrence_date)
```
Cada ocurrencia generada (de cualquier tipo: income/expense/debt_payment) se registra aquí antes o junto con la fila de negocio correspondiente. Reintentar la reconciliación el mismo día, o tras un crash a medio proceso, nunca duplica movimientos — el conflicto de la restricción UNIQUE actúa como guardia de seguridad además de la lógica de aplicación.

**Cursor de reconciliación**: se deriva como `MAX(occurrence_date) WHERE recurring_transaction_id = X` sobre `recurrence_occurrences`, no se guarda como columna redundante en `recurring_transactions`. Una sola fuente de verdad. `next_occurrence_date` en `recurring_transactions` es solo una caché de UI (para mostrar "próximo: 5 oct"), nunca se usa como cursor real.

### 6. Reconciliación transaccional al abrir la app
Todo el proceso (todas las recurrencias, todas las ocurrencias pendientes) corre dentro de una única transacción Drizzle/SQLite. Si la app se cierra o crashea a medio proceso, no queda estado parcial — el siguiente intento retoma limpio desde el mismo cursor derivado. `settings.last_reconciled_at` se actualiza solo tras el commit, y es puramente informativo (no es el cursor de cálculo).

### 7. Pagos de deuda: ciclo `scheduled` → `vencido` (derivado) → `confirmed`
Al llegar la fecha de una recurrencia de tipo `debt_payment`, la reconciliación crea una fila en `debt_payments` con `status = 'scheduled'` — **no** resta del saldo de la cuenta ni del `saldo_pendiente` de la deuda. El estado "vencido" es **derivado en tiempo de lectura** (`status = 'scheduled' AND occurrence_date < hoy`), nunca persistido, para evitar una segunda fuente de verdad que sincronizar. Solo cuando el usuario confirma manualmente (`status = 'confirmed'`) se aplican los efectos: descuento de `accounts.balance` (vía el ledger derivado) y reducción de `debts.saldo_pendiente`. Decisión confirmada explícitamente por el usuario tras señalar una contradicción entre su ejemplo narrativo y su regla fundamental.

### 8. Proyección de saldo futuro: función de solo lectura, separada de la reconciliación
```
projectBalance(accountId, horizonDate) // NO escribe en la base de datos
```
Reutiliza `computeOccurrences` sobre el rango `[hoy+1, horizonDate]` para todas las recurrencias activas, sumando/restando en memoria. La reconciliación (que sí escribe) y la proyección (que nunca escribe) son dos caminos de código distintos que comparten el mismo motor de fechas — evita que un cálculo de UI contamine accidentalmente el estado persistido.

### 9. `monthly_summaries` como caché con snapshot de configuración
Cada fila cachea, además de los totales del mes, qué `budget_rule_id` y qué `debt_limit_pct` estaban vigentes ese mes. Así el histórico no se reescribe silenciosamente si el usuario cambia su regla de presupuesto meses después — el pasado queda congelado con la configuración que realmente aplicó. Recalculable de forma idempotente (upsert) cuando cambian los datos subyacentes de ese mes.

### 10. Notificaciones locales: sistema independiente de la reconciliación
Se investigaron límites reales de plataforma (no se asumen):
- Ambas plataformas disparan notificaciones locales programadas con la app cerrada — el SO despierta el dispositivo, sin necesidad de JS corriendo.
- Android: requiere permiso runtime `POST_NOTIFICATIONS` (13+) y canal de notificación; gestores de batería agresivos (MIUI, Huawei, algunos Samsung) pueden retrasarlas si el usuario no exime la app.
- iOS: límite histórico de 64 notificaciones locales pendientes por app — mitigación: programar solo el próximo vencimiento de cada recurrencia activa y reprogramar tras cada reconciliación/confirmación, no todo el futuro de una vez.
- Ninguna plataforma soporta una alerta "persistente" sin un servicio en primer plano (fuera de alcance, contradice "sin background execution").
- Acciones desde la notificación deben abrir la app a la pantalla correspondiente y resolver la acción dentro del flujo normal — no asumir ejecución silenciosa en background en Android.

_(Nota: notificaciones es una capacidad fuera de alcance de este cambio; esta investigación queda documentada aquí para cuando se implemente.)_

### 11. Deudas con jerarquía padre/hija: el padre es 100% derivado, las hijas solo cuentan meses
Una deuda puede tener un `parent_debt_id` (auto-referencia nullable en `debts`). Caso real: una tarjeta de crédito (BBVA) es la deuda padre; cada compra a meses (MSI) o cargo recurrente cobrado a esa tarjeta (Netflix) es una deuda hija.

```
BBVA (padre)                                    Llantas (hija, con countdown)
  status: activa                                  remaining_payments: 12 → cuenta regresiva
  due_date: "25" (ÚNICA fecha de pago — todas       monthly_payment_cents: 30000
            las hijas se pagan en esa fecha,      TV (hija, con countdown)
            ninguna tiene fecha propia)             remaining_payments: 3
  monthly_payment_cents  ← DERIVADO:              Netflix (hija, SIN countdown)
     Σ (hijas activas).monthly_payment_cents        remaining_payments: NULL → indefinida,
  saldo_pendiente_cents  ← DERIVADO:                 activa hasta que el usuario la desactive
     Σ (hijas con countdown).
       (monthly_payment_cents × remaining_payments)
```

**Por qué el saldo pendiente del padre es una estimación derivada y no una suma de saldos reales de cada hija**: el usuario explícitamente no quiere (ni recordar ni buscar) cuánto costó originalmente cada MSI. Pedirle `original_amount_cents`/`saldo_pendiente_cents` por hija habría sido fricción sin valor real para él. En vez de eso, el saldo de una hija con countdown se **estima** como `monthly_payment_cents × remaining_payments` (sin intereses) — usa solo datos que el usuario ya conoce de memoria (pago mensual, meses restantes). Para hijas sin countdown (indefinidas, tipo suscripción) no existe la noción de "saldo pendiente" — son perpetuas hasta desactivarse manualmente.

**Por qué Netflix es una deuda hija y no un egreso recurrente aparte**: se decidió explícitamente así, aunque no tenga countdown — porque se cobra automáticamente a la tarjeta BBVA y el usuario quiere que todo lo que compone "lo que debo de BBVA" viva junto, en un solo lugar, y no como un egreso independiente que restaría por separado de su disponible. Que sea "hija" en este modelo no exige que tenga fin — solo exige que contribuye al total mensual del padre y se desactiva manualmente si se cancela.

**Confirmar el pago del padre — qué le pasa a cada hija**:
```
Confirmar pago BBVA (padre)
        │
        ├─► Hija CON countdown (Llantas, TV): remaining_payments -= 1 ÚNICAMENTE
        │        (nada de restar montos en dólares — el saldo ya se deriva de
        │         remaining_payments, así que decrementar el contador ya
        │         "baja" el saldo estimado automáticamente)
        │        → si remaining_payments llega a 0, status = 'pagada'
        │        → el padre deja de sumarla el próximo ciclo, sin edición manual
        │
        └─► Hija SIN countdown (Netflix): no se toca — sigue activa indefinidamente
```

**Reglas de la jerarquía**:
- Solo un nivel (una hija no puede tener sus propias hijas).
- Las hijas NUNCA tienen su propio `due_date`, su propia recurrencia de pago (`recurring_transactions` de tipo `debt_payment`), ni sus propias filas en `debt_payments` — solo el padre tiene eso. Pagar es un evento único a nivel padre.
- Las hijas no piden `original_amount_cents` ni `saldo_pendiente_cents` en el formulario — se autocompletan por detrás (ej. igual al pago mensual) únicamente para satisfacer la columna NOT NULL existente; no se muestran ni se usan para nada.
- El selector "vincular a una deuda" de `commitments` solo debe listar deudas **sin padre** (`parent_debt_id IS NULL`) — el reparto por quincena siempre se calcula sobre el total del padre, nunca sobre una hija suelta.
- Una deuda sin hijas se comporta exactamente igual que hoy (100% retrocompatible): sus propios `monthly_payment_cents`/`saldo_pendiente_cents` almacenados siguen siendo la fuente de verdad si no tiene ninguna hija.

## Risks / Trade-offs

- **[Riesgo]** Cierre prolongado (meses) genera muchas ocurrencias de golpe en la primera apertura → **[Mitigación]** la reconciliación no tiene límite artificial de rango, pero se recomienda un aviso de UI si el número de ocurrencias generadas en una sola pasada es inusualmente alto, para que el usuario lo revise antes de continuar.
- **[Riesgo]** `SEMIMONTHLY_FIXED` y `MONTHLY_DAY` pueden confundirse en la UI de configuración de recurrencias → **[Mitigación]** copy explícito distinguiendo "quincenal (15 y último día)" de "un día fijo al mes", y pruebas unitarias que fijan la semántica.
- **[Riesgo]** Un pago de deuda `scheduled` sin confirmar puede acumularse indefinidamente si el usuario nunca confirma → **[Mitigación]** el dashboard debe destacar pagos vencidos sin confirmar como acción pendiente visible, no silenciarlos.
- **[Riesgo]** Drizzle + expo-sqlite es una combinación relativamente joven en el ecosistema Expo → **[Mitigación]** confirmar compatibilidad de versiones antes de fijar dependencias en `package.json` durante implementación.
- **[Trade-off]** No vincular cuentas de tipo tarjeta de crédito con su deuda correspondiente simplifica el modelo de datos ahora, a costa de que el usuario deba actualizar el saldo de la deuda manualmente o vía pagos confirmados — aceptado para v1.
- **[Trade-off]** El `saldo_pendiente` derivado de una deuda hija (`monthly_payment × remaining_payments`) es una estimación sin intereses, no el saldo real del banco — aceptado explícitamente por el usuario a cambio de no tener que buscar/recordar montos originales por cada MSI.

## Migration Plan

No aplica — proyecto nuevo sin datos previos que migrar. El primer arranque de la app corre las migraciones iniciales de Drizzle para crear el esquema completo descrito en las specs.

## Open Questions

- ¿Se debe vincular en una fase posterior una cuenta `tarjeta_credito` con su `debt` correspondiente para que los cargos actualicen el saldo pendiente automáticamente? Documentado como idea futura, no bloqueante para este cambio.
- ¿Debe existir un tope configurable de "días cerrada" a partir del cual la reconciliación pida confirmación explícita antes de generar un lote muy grande de movimientos? Pendiente de validar con uso real.
