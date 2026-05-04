# JPL-AIOT-LOCK Backend

Backend Express + TypeScript + Prisma para gestionar candados digitales inteligentes AIoT/IoT.

## Stack

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- dotenv
- cors
- zod

## Instalacion local

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init_aiot_lock
npm run prisma:seed
npm run dev
```

El servidor queda por defecto en `http://localhost:3001`.

## Variables de entorno

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="change_me_super_secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="change_me_refresh_secret"
JWT_REFRESH_EXPIRES_IN="7d"
IOT_PROVIDER="mock"
```

## Railway

1. Crear un servicio PostgreSQL en Railway.
2. Copiar la variable `DATABASE_URL`.
3. Configurar en Railway:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - `PORT`
   - `CORS_ORIGIN`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `IOT_PROVIDER=mock`

Comandos de produccion:

```bash
npm run build
npm run prisma:deploy
npm run start
```

## Validaciones rapidas

Health:

```bash
curl http://localhost:3001/health
```

API base:

```bash
curl http://localhost:3001/api
```

Prisma Studio:

```bash
npm run prisma:studio
```

Validar conexion Prisma:

```bash
npx prisma migrate status
npm run prisma:seed
```

Si esos comandos leen `DATABASE_URL` y terminan correctamente, Prisma esta conectando con PostgreSQL.

## Endpoints iniciales

- `GET /health`
- `GET /api`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/companies`
- `GET /api/companies/:id`
- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`
- `GET /api/locks`
- `GET /api/locks/:id`
- `POST /api/locks`
- `PATCH /api/locks/:id`
- `DELETE /api/locks/:id`
- `POST /api/locks/:lockId/access`
- `GET /api/locks/:lockId/access`
- `GET /api/users/:userId/locks`
- `DELETE /api/locks/:lockId/access/:accessId`
- `POST /api/locks/:lockId/commands/open`
- `POST /api/locks/:lockId/commands/close`
- `GET /api/locks/:lockId/commands`
- `GET /api/events`
- `GET /api/locks/:lockId/events`
- `GET /api/locks/:lockId/location`
- `GET /api/locks/:lockId/locations/history`
- `POST /api/iot/locks/:lockId/location`
- `GET /api/alerts`
- `GET /api/alerts/:id`
- `PATCH /api/alerts/:id`

## Pendiente para siguientes fases

- Autorizacion fina por permisos.
- Refresh token endpoint y rotacion de sesiones.
- Integracion de proveedor IoT real.
- Webhooks o ingestion segura para dispositivos.
- Tests automatizados.
- Paginacion, filtros avanzados y observabilidad.
- Politicas completas de geofencing y alertas.
