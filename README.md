# Cash Track

Aplicación fullstack para la gestión de ingresos y egresos, administración de usuarios y generación de reportes financieros.

## Tecnologías principales

- **Frontend**
  - Next.js (router `pages`)
  - React + TypeScript
  - Tailwind CSS
  - Componentes UI estilo shadcn (botones, inputs, diálogos, formularios, tablas)
- **Backend**
  - Next.js API Routes (endpoints REST bajo `/api`)
  - Prisma como ORM
  - PostgreSQL en Supabase
- **Autenticación y seguridad**
  - Better Auth con GitHub como proveedor OAuth
  - Adaptador de sesiones en base de datos con Prisma
  - Control de acceso basado en roles (RBAC) mediante `withRole` y `RoleGuard`
- **Documentación y pruebas**
  - Swagger / OpenAPI generado con `swagger-jsdoc`
  - UI de documentación embebida con `swagger-ui-react`
  - Pruebas unitarias con Jest y React Testing Library


## Estructura del proyecto

- `pages/`
  - `index.tsx`: página inicial con navegación a las secciones principales.
  - `login/`: flujo de inicio de sesión con GitHub.
  - `movements/`: pantalla de gestión de movimientos.
  - `users/`: gestión de usuarios (solo ADMIN).
  - `reports/`: reportes financieros (solo ADMIN).
  - `api/`: endpoints REST (`/api/movements`, `/api/users`, `/api/reports`, `/api/reports/csv`, `/api/me`, `/api/docs`, etc.).
- `components/`
  - `layout/MainLayout.tsx`: layout principal de la aplicación.
  - `auth/RoleGuard.tsx`: componente de guardia de roles en el cliente.
  - `movements/MovementFormModal.tsx`: formulario modal para crear movimientos.
  - `movements/MovementsTable.tsx`: tabla de listado, búsqueda y filtrado de movimientos.
  - `ui/*`: componentes de interfaz (botón, input, tabla, diálogo, formulario).
- `lib/`
  - `auth/`: configuración de Better Auth, `withAuth`, `withRole` y tipos de sesión.
  - `db.ts`: cliente de Prisma conectado a Supabase.
  - `csv.ts`: utilitario de generación de CSV para reportes.
  - `swagger.ts`: configuración de `swagger-jsdoc`.
- `prisma/`
  - `schema.prisma`: definición del modelo de datos (usuarios, movimientos, etc.).

## Endpoints principales

- `GET /api/me`: devuelve el usuario autenticado.
- `GET /api/movements`: lista paginada de movimientos (ADMIN ve todos, USER solo los propios).
- `POST /api/movements`: crea un nuevo movimiento para el usuario autenticado.
- `GET /api/users`: lista de usuarios (solo ADMIN).
- `PATCH /api/users/:id`: actualización de nombre y rol (solo ADMIN).
- `GET /api/reports`: totales y agregados mensuales (solo ADMIN).
- `GET /api/reports/csv`: descarga de reporte CSV (solo ADMIN).
- `GET /api/docs`: especificación OpenAPI de la API.

Todos estos endpoints están documentados mediante anotaciones Swagger en las rutas de `pages/api` y se consolidan en `/api/docs`.

## Puesta en marcha

### Prerrequisitos

- Node.js LTS instalado.
- Base de datos PostgreSQL accesible (Supabase en el contexto de la prueba).
- Credenciales de GitHub OAuth para Better Auth (Client ID y Client Secret).

### Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con, al menos:

```env
DATABASE_URL=...        # conexión vía pooler a Supabase
DIRECT_URL=...          # conexión directa para migraciones Prisma
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

### Instalación y desarrollo

```bash
npm install
npm run dev
```

La aplicación quedará disponible normalmente en `http://localhost:3000`.

### Migraciones de base de datos

Para aplicar las migraciones Prisma:

```bash
npx prisma migrate deploy
```

O, en entorno local de desarrollo:

```bash
npx prisma migrate dev
```

## Pruebas unitarias

El proyecto incluye pruebas unitarias con Jest y React Testing Library, entre ellas:

- Pruebas del endpoint `POST /api/movements` mockeando Prisma y la capa de autenticación.
- Pruebas del utilitario de generación de CSV (`lib/csv.ts`).
- Pruebas del componente `MovementFormModal` (validación, envío y manejo de errores).

Para ejecutarlas:

```bash
npm test
```

## Documentación de la API

- Especificación OpenAPI en JSON: `GET /api/docs`.
- UI interactiva de Swagger: página `/docs` del frontend.

Ambas fuentes se generan a partir de anotaciones `@swagger` en las rutas de `pages/api`.

## Despliegue en Vercel

El proyecto está preparado para ser desplegado en Vercel:

1. Crear un nuevo proyecto en Vercel apuntando a este repositorio de GitHub.
2. Configurar las variables de entorno de producción (las mismas que en `.env`).
3. Permitir que Vercel instale dependencias y ejecute `next build` automáticamente.
4. Una vez desplegado, compartir la URL pública como parte de los entregables de la prueba.

## Notas

- La interfaz está pensada para escritorio, siguiendo la indicación de que no es obligatorio un diseño responsive.
- El control de acceso se implementa tanto en el backend (middleware `withRole`) como en el frontend (componente `RoleGuard`).
- Los nuevos usuarios autenticados mediante GitHub se crean con rol `ADMIN` para facilitar la evaluación y el acceso a todas las secciones.
