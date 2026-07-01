# LuxGym Backend

API REST para gestión de gimnasio. Construida con **Express**, **TypeScript**, **Prisma** y **SQLite**.

Base URL local: **http://localhost:3000**

---

## Requisitos

- Node.js 18+
- npm o pnpm

---

## Cómo levantar el servidor

### 1. Instalar dependencias

```bash
cd backend
npm install
```

Con pnpm:

```bash
cd backend
pnpm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya incluye la configuración por defecto:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 3. Ejecutar migraciones de base de datos

Solo necesario la primera vez o cuando cambie el schema de Prisma:

```bash
npm run db:migrate
```

### 4. Iniciar en modo desarrollo

```bash
npm run dev
```

El servidor quedará disponible en **http://localhost:3000**.

### Otros comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run start` | Ejecuta la versión compilada (producción) |
| `npm run db:studio` | Abre Prisma Studio para ver/editar la base de datos |

---

## Endpoints

### Health check

**GET** `http://localhost:3000/health`

Verifica que el servidor esté activo.

**Respuesta 200:**

```json
{
  "status": "ok"
}
```

---

### Usuarios

#### Crear usuario

**POST** `http://localhost:3000/api/users`

**Body:**

```json
{
  "name": "Kevin",
  "email": "kevin@example.com",
  "password": "miPassword123",
  "role": "MEMBER"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre del usuario |
| `email` | string | Sí | Email único |
| `password` | string | Sí | Mínimo 6 caracteres |
| `role` | string | No | `MEMBER` (default), `TRAINER` o `ADMIN` |

**Respuesta 201:**

```json
{
  "id": "cmr1bavv60003t72qfzbf468b",
  "name": "Kevin",
  "email": "kevin@example.com",
  "role": "MEMBER",
  "createdAt": "2026-07-01T00:03:02.994Z"
}
```

**Errores:**

- `400` — Datos inválidos
- `409` — El email ya está registrado

---

#### Listar usuarios

**GET** `http://localhost:3000/api/users`

**Respuesta 200:**

```json
[
  {
    "id": "cmr1bavv60003t72qfzbf468b",
    "name": "Kevin",
    "email": "kevin@example.com",
    "role": "MEMBER",
    "createdAt": "2026-07-01T00:03:02.994Z"
  }
]
```

> La contraseña nunca se incluye en las respuestas.

---

#### Obtener usuario por ID

**GET** `http://localhost:3000/api/users/:id`

**Ejemplo:** `http://localhost:3000/api/users/cmr1bavv60003t72qfzbf468b`

**Respuesta 200:**

```json
{
  "id": "cmr1bavv60003t72qfzbf468b",
  "name": "Kevin",
  "email": "kevin@example.com",
  "role": "MEMBER",
  "createdAt": "2026-07-01T00:03:02.994Z"
}
```

**Errores:**

- `404` — Usuario no encontrado

---

### Rutinas

#### Crear rutina

**POST** `http://localhost:3000/api/routines`

**Body:**

```json
{
  "name": "Rutina piernas",
  "description": "Sentadillas, prensa, extensiones",
  "userId": "cmr1bavv60003t72qfzbf468b"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la rutina |
| `description` | string | No | Descripción de la rutina |
| `userId` | string | Sí | ID de un usuario existente |

**Respuesta 201:**

```json
{
  "id": "cmr1bavvs0005t72qh0rgp7va",
  "name": "Rutina piernas",
  "description": "Sentadillas, prensa, extensiones",
  "userId": "cmr1bavv60003t72qfzbf468b",
  "createdAt": "2026-07-01T00:03:03.017Z",
  "user": {
    "id": "cmr1bavv60003t72qfzbf468b",
    "name": "Kevin",
    "email": "kevin@example.com",
    "role": "MEMBER"
  }
}
```

**Errores:**

- `400` — Datos inválidos
- `404` — Usuario no encontrado

---

#### Listar rutinas

**GET** `http://localhost:3000/api/routines`

**Respuesta 200:**

```json
[
  {
    "id": "cmr1bavvs0005t72qh0rgp7va",
    "name": "Rutina piernas",
    "description": "Sentadillas, prensa, extensiones",
    "userId": "cmr1bavv60003t72qfzbf468b",
    "createdAt": "2026-07-01T00:03:03.017Z",
    "user": {
      "id": "cmr1bavv60003t72qfzbf468b",
      "name": "Kevin",
      "email": "kevin@example.com",
      "role": "MEMBER"
    }
  }
]
```

---

#### Obtener rutina por ID

**GET** `http://localhost:3000/api/routines/:id`

**Ejemplo:** `http://localhost:3000/api/routines/cmr1bavvs0005t72qh0rgp7va`

**Respuesta 200:** Igual que un ítem del listado anterior.

**Errores:**

- `404` — Rutina no encontrada

---

## Formato de errores

Todas las respuestas de error siguen este formato:

```json
{
  "error": "Mensaje descriptivo del error"
}
```

| Código | Significado |
|--------|-------------|
| `400` | Datos de entrada inválidos |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej. email duplicado) |
| `500` | Error interno del servidor |

---

## Flujo de prueba rápido

1. Levantar el servidor: `npm run dev`
2. Crear un usuario: `POST http://localhost:3000/api/users`
3. Copiar el `id` de la respuesta
4. Crear una rutina con ese `userId`: `POST http://localhost:3000/api/routines`
5. Verificar: `GET http://localhost:3000/api/routines`
