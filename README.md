# LuxGym

Sistema de gestión para gimnasio.

## Estructura del proyecto

```
luxgym/
├── backend/     → API REST (Express + Prisma + PostgreSQL)
├── frontend/    → SPA en JavaScript vanilla
└── render.yaml  → Configuración de despliegue en Render
```

## Inicio rápido

### Backend

1. Configurá Supabase y las variables de entorno (ver `backend/.env.example`)
2. Documentación de endpoints: [`backend/README.md`](backend/README.md)

### Frontend

1. Clonar el repo
2. Editar `API_BASE_URL` en `frontend/app.js` con la URL del API en Render
3. Abrir `frontend/index.html` con Live Server

No necesita instalar nada del backend.

## Despliegue

El backend se despliega en Render usando `render.yaml`. La base de datos va en Supabase (PostgreSQL). Ver `backend/README.md` para los pasos de configuración local.
