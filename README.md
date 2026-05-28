# Fintech App

Aplicación de gestión de transacciones con aprobación manual para montos elevados.

- **Backend** — Fastify + Drizzle ORM + PostgreSQL
- **Frontend** — React Router 7 (SSR) + Tailwind CSS + shadcn/ui

---

## Requisitos previos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

> Los comandos de `docker compose` deben ejecutarse desde la raíz del proyecto (`fintech-app/`), donde está el `docker-compose.yml`.

## Opción A — Docker completo

Backend y base de datos corren en contenedores. Útil para probar el build de producción o levantar el stack rápido sin instalar dependencias.

```bash
docker compose up -d
```

Al iniciar, el contenedor del backend corre automáticamente las migraciones y el seed.

Luego correr el frontend localmente:

```bash
cd frontend
cp .env.example .env      # solo la primera vez
npm install               # solo la primera vez
npm run dev               # app en http://localhost:5173
```

> El frontend no está incluido en el `docker-compose.yml` porque requiere el servidor de Vite para desarrollo.

---

## Opción B — Desarrollo local

La base de datos corre en Docker; backend y frontend corren directamente en tu máquina. Es el modo recomendado para trabajar en el código.

### 1. Base de datos

```bash
docker compose up postgres -d
```

Levanta PostgreSQL en `localhost:5432`. Los datos persisten en un volumen Docker entre reinicios.

### 2. Backend

```bash
cd backend
cp .env.example .env      # solo la primera vez
npm install               # solo la primera vez
npm run migrate           # aplica las migraciones
npm run seed              # carga usuarios de prueba
npm run dev               # servidor en http://localhost:3000
```

> `npm run seed` es idempotente — no duplica registros si se corre más de una vez.

### 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env      # solo la primera vez
npm install               # solo la primera vez
npm run dev               # app en http://localhost:5173
```

---

## Variables de entorno

### Backend — `backend/.env`

| Variable      | Descripción                  | Default      |
|---------------|------------------------------|--------------|
| `DB_HOST`     | Host de PostgreSQL           | `localhost`  |
| `DB_PORT`     | Puerto de PostgreSQL         | `5432`       |
| `DB_NAME`     | Nombre de la base de datos   | `fintech_db` |
| `DB_USER`     | Usuario de PostgreSQL        | `postgres`   |
| `DB_PASSWORD` | Contraseña de PostgreSQL     | `postgres`   |
| `PORT`        | Puerto del servidor HTTP     | `3000`       |

### Frontend — `frontend/.env`

| Variable       | Descripción            | Default                  |
|----------------|------------------------|--------------------------|
| `VITE_API_URL` | URL base del backend   | `http://localhost:3000`  |

---

## Tests

### Backend

```bash
cd backend
npm run test:run
```

### Frontend

```bash
cd frontend
npm run test:run
```

---

## Usuarios de prueba

El seed carga cuatro usuarios listos para usar:

| Nombre         | Email                 | Saldo       |
|----------------|-----------------------|-------------|
| Alice García   | alice@example.com     | $100.000,00 |
| Bob Martínez   | bob@example.com       |  $50.000,00 |
| Carlos López   | carlos@example.com    |  $25.000,00 |
| Diana Sánchez  | diana@example.com     |  $75.000,00 |

---

## API

La documentación interactiva (Swagger) está disponible en:

```
http://localhost:3000/docs
```

---

## Documentación técnica

- [Arquitectura y decisiones técnicas](docs/architecture.md) — capas, ORM, framework, manejo de errores, concurrencia
- [Flujos del sistema](docs/flows.md) — diagramas de crear, aprobar y rechazar transacciones
