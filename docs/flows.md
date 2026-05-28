# Flujos del sistema

## 1. Crear transacción

El monto determina si la transacción se confirma en el momento o queda pendiente de aprobación.

```mermaid
flowchart TD
    A([Usuario completa el formulario]) --> B[POST /transactions]
    B --> C{Validaciones}
    C -- monto ≤ 0 --> ERR1([❌ 400 InvalidAmountError])
    C -- origen = destino --> ERR2([❌ 400 SameUserTransactionError])
    C -- usuario no existe --> ERR3([❌ 404 UserNotFoundError])
    C -- saldo insuficiente --> ERR4([❌ 422 InsufficientBalanceError])
    C -- OK --> D{monto ≤ $50.000?}

    D -- Sí --> E[createAndConfirm]
    E --> E1[BEGIN TRANSACTION]
    E1 --> E2[SELECT FOR UPDATE emisor]
    E2 --> E3[Debit emisor\nCredit receptor]
    E3 --> E4[INSERT balance_movements]
    E4 --> E5[INSERT transaction\nstatus = confirmed]
    E5 --> E6[COMMIT]
    E6 --> OK1([✅ 201 Confirmed])

    D -- No --> F[createPending]
    F --> F1[INSERT transaction\nstatus = pending]
    F1 --> OK2([✅ 202 Pending])
```

---

## 2. Aprobar transacción

El balance **no fue reservado** al crear la transacción pendiente, por lo que la aprobación incluye una verificación de saldo en el momento.

```mermaid
flowchart TD
    A([Admin hace click en Aprobar]) --> B[PATCH /transactions/:id/approve]
    B --> C[BEGIN TRANSACTION]
    C --> D[SELECT FOR UPDATE\ntransacción]
    D --> E{¿status = pending?}
    E -- No --> ERR1([❌ 409 TransactionNotPendingError])
    E -- Sí --> F[SELECT FOR UPDATE\nemisora]
    F --> G{¿saldo suficiente?}
    G -- No --> ERR2([❌ 422 InsufficientBalanceError])
    G -- Sí --> H[Debit emisor\nCredit receptor]
    H --> I[INSERT balance_movements]
    I --> J[UPDATE transaction\nstatus = confirmed]
    J --> K[Buscar otras transacciones\npendientes del mismo emisor]
    K --> L{¿alguna excede\nel nuevo saldo?}
    L -- No --> M[COMMIT]
    L -- Sí --> N[UPDATE esas transacciones\nstatus = rejected\nrazón: saldo insuficiente]
    N --> M
    M --> OK([✅ 200 Confirmed])
```

---

## 3. Rechazar transacción

Flujo simple: no mueve fondos, solo actualiza el estado.

```mermaid
flowchart TD
    A([Admin hace click en Rechazar]) --> B[PATCH /transactions/:id/reject]
    B --> C[BEGIN TRANSACTION]
    C --> D[SELECT FOR UPDATE\ntransacción]
    D --> E{¿status = pending?}
    E -- No --> ERR([❌ 409 TransactionNotPendingError])
    E -- Sí --> F[UPDATE transaction\nstatus = rejected\nrazón opcional]
    F --> G[COMMIT]
    G --> OK([✅ 200 Rejected])
```

---

## 4. Ciclo de vida de una transacción

```mermaid
stateDiagram-v2
    [*] --> pending : monto > $50.000
    [*] --> confirmed : monto ≤ $50.000

    pending --> confirmed : aprobación manual
    pending --> rejected : rechazo manual
    pending --> rejected : auto-rechazo por saldo\ninsuficiente al aprobar otra

    confirmed --> [*]
    rejected --> [*]
```
