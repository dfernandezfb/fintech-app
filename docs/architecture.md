# Arquitectura y decisiones técnicas

## Diagrama de capas

El backend sigue una **arquitectura hexagonal** (ports & adapters). El dominio no depende de ningún framework ni base de datos — solo el código de infraestructura conoce esos detalles.

```
┌─────────────────────────────────────────────────────────┐
│                     INFRAESTRUCTURA                      │
│                                                          │
│   ┌─────────────────┐       ┌────────────────────────┐  │
│   │  Input adapters │       │   Output adapters      │  │
│   │                 │       │                        │  │
│   │  HTTP Routes    │       │  PgUserRepository      │  │
│   │  Controllers    │       │  PgTransactionRepo     │  │
│   └────────┬────────┘       └───────────┬────────────┘  │
│            │                            │               │
│   ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─  │
│            │         APLICACIÓN         │               │
│            ▼                            ▼               │
│   ┌─────────────────────────────────────────────────┐   │
│   │               Use Cases                         │   │
│   │  CreateTransaction   ApproveTransaction         │   │
│   │  RejectTransaction   ListTransactions           │   │
│   │  ListPending         GetUsers                   │   │
│   └────────────────────────┬────────────────────────┘   │
│                            │                            │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                            │         DOMINIO            │
│                            ▼                            │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Entities: Transaction, User                    │   │
│   │  Errors:   DomainErrors                         │   │
│   │  Ports:    ITransactionRepository, IUserRepo    │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

El frontend es independiente del backend — se comunica exclusivamente vía HTTP a través de `api.ts`.

```
┌──────────────────────────────────────┐
│           FRONTEND (SSR)             │
│                                      │
│  Routes (loaders + actions)          │
│    dashboard  /  create  /approval   │
│          │                           │
│       api.ts  ──── HTTP ────►  API   │
└──────────────────────────────────────┘
```

---

## Decisiones técnicas

### ORM — Drizzle

Se eligió Drizzle sobre Prisma o TypeORM por tres razones:

1. **SQL-first**: el schema se define en TypeScript pero los queries son explícitos (`select().from().where()`). No hay magia oculta ni N+1 silenciosos.
2. **Transacciones con acceso directo al cliente**: `db.transaction(async (tx) => { ... })` expone el cliente de transacción directamente, lo que permite usar `SELECT FOR UPDATE` sin workarounds — fundamental para el control de concurrencia.
3. **Cero overhead de runtime**: no hay un proceso separado ni un binario de query engine. Es una librería liviana que genera SQL y lo ejecuta.

### Framework HTTP — Fastify

Se eligió Fastify sobre Express por:

1. **Validación de esquemas nativa**: define el schema JSON de request/response en la propia ruta. Fastify valida automáticamente la entrada y rechaza requests malformados antes de llegar al handler.
2. **Serialización rápida**: usa `fast-json-stringify` para serializar responses, más rápido que `JSON.stringify` estándar.
3. **Plugin system**: el sistema de plugins con `fastify-plugin` garantiza encapsulación de contexto — cada plugin tiene su propio scope.
4. **Swagger integrado**: `@fastify/swagger` + `@fastify/swagger-ui` generan la documentación automáticamente desde los schemas de las rutas, sin mantenimiento extra.

### Manejo de errores

Los errores fluyen en capas:

```
Dominio         → lanza DomainErrors (InsufficientBalanceError, etc.)
Repositorio     → propaga DomainErrors, wrappea errores de DB
Use Case        → propaga sin modificar
HTTP Layer      → errorHandler mapea cada DomainError a su HTTP status
Frontend        → ApiError con code + status → mensaje amigable vía friendlyError()
```

Cada capa solo conoce los errores de su nivel. El handler HTTP centralizado en `errorHandler.ts` traduce el código de dominio al status HTTP correspondiente (ej. `InsufficientBalanceError` → 422, `TransactionNotFoundError` → 404). El frontend usa el campo `error` del body (ej. `"INSUFFICIENT_BALANCE"`) para mostrar el mensaje correcto en español.

### Concurrencia — SELECT FOR UPDATE

Las operaciones de aprobación y creación directa involucran múltiples writes que deben ser atómicos. Se usa `SELECT FOR UPDATE` para serializar el acceso:

```
approve():
  1. LOCK fila de transacción        → evita doble aprobación simultánea
  2. LOCK fila del emisor (users)    → serializa múltiples aprobaciones del mismo emisor
  3. Debit + Credit + Movements      → todo dentro de la misma DB transaction
  4. Auto-rechazar pendientes        → si el nuevo saldo no alcanza para otras transacciones
                                       pendientes del mismo emisor, se rechazan en el mismo tx
```

El auto-rechazo en cascada resuelve el caso donde dos transacciones pendientes son individualmente válidas pero juntas exceden el saldo: al aprobar una, la otra queda automáticamente rechazada si el saldo restante no la cubre.

### Regla de negocio — umbral de aprobación manual

Transacciones **≤ $50.000** se confirman automáticamente en el momento de la creación (flujo síncróno con debit/credit inmediato).

Transacciones **> $50.000** quedan en estado `pending` y requieren aprobación manual desde el panel de aprobaciones. El balance del emisor **no se reserva** al crear la transacción pendiente — solo se mueven fondos al momento de la aprobación.
