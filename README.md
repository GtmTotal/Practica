# Informe de Obras

Aplicación web para la gestión, digitalización y generación de informes de obras y mantenimiento. Permite a los técnicos completar checklist por sistemas, adjuntar fotografías, guardar progreso automáticamente y exportar el resultado como PDF profesional.

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| **Frontend** | Svelte 5 + TypeScript (Runes) |
| **Backend** | ASP.NET Core 10 (Minimal APIs) |
| **Base de datos** | PostgreSQL 16 + Entity Framework Core |
| **Almacenamiento** | MinIO (compatible S3) |
| **PDF** | pdfmake (frontend) |
| **Excel** | ClosedXML (.NET) |
| **Contenedores** | Docker + Docker Compose |

---

## Arquitectura

```
┌─────────────┐      HTTP       ┌─────────────┐
│   Svelte 5  │ ◄──────────────►│   .NET API  │
│   (UI/)     │                 │ (apiService/)│
└─────────────┘                 └──────┬──────┘
       ▲                             │
       │                             │
       │    ┌─────────────┐    ┌────▼──────┐
       └────┤   MinIO     │    │ PostgreSQL│
            │  (fotos)    │    │  (datos)  │
            └─────────────┘    └───────────┘
```

### Estructura del proyecto

```
reporte-obras-main/
├── UI/                         # Frontend SvelteKit (Svelte 5)
│   ├── src/lib/components/
│   │   ├── informe/            # Componentes del editor (Header, Secciones, Fotos)
│   │   └── common/             # Spinner, Toast, Dialogs
│   ├── src/routes/             # Enrutamiento basado en archivos
│   └── Dockerfile
│
├── apiService/                 # Backend .NET
│   ├── Infraestructura/
│   │   ├── Endpoints.cs        # Definición de rutas (Minimal APIs)
│   │   ├── Archivos/           # Servicio de almacenamiento MinIO/S3
│   │   ├── Datos/              # Configuración de centros (JSON)
│   │   ├── Persistencia/       # DbContext + entidades EF Core
│   │   ├── ServicioAutenticacionAdmin.cs
│   │   └── ServicioSincronizacionExcel.cs
│   └── Dockerfile
│
├── infra/
│   └── docker-compose.yml      # Orquestación completa
│
├── .env.template               # Variables de entorno de ejemplo
└── README.md
```

### Modelo de datos (Backend)

- **Informe**: obra, técnico, fecha, cuatrimestre, conclusiones, protegido
- **Sistema**: sección del informe (ej. "Calefacción", "Electricidad")
- **Tarea**: ítem revisable dentro de un sistema (rev / ok / noOk + notas)
- **Foto**: imagen adjunta a un sistema (URL pública o base64)
- **Cuatrimestre**: período de agrupación de informes

### Flujo de uso

1. El usuario selecciona **centro** y **cuatrimestre** en la página principal.
2. El frontend carga la configuración JSON del centro (`/api/main-page/config-centros/{centro}`).
3. El técnico completa las secciones del informe: tareas con estados y fotografías.
4. El progreso se **guarda automáticamente** en PostgreSQL vía la API.
5. Al finalizar se genera un **PDF profesional** desde el navegador (pdfmake).
6. El **panel de admin** permite sincronizar plantillas Excel, gestionar archivos en MinIO y borrar informes.

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Compose)
- Opcional para desarrollo local:
  - [Node.js 20+](https://nodejs.org/)
  - [Bun](https://bun.sh/) o npm (para gestionar dependencias)
  - [.NET 10 SDK](https://dotnet.microsoft.com/download)

---

## Entorno local con Docker (recomendado)

1. Clona el repositorio y posiciónate en la carpeta `infra`:

```bash
cd reporte-obras-main/infra
```

2. Crea el archivo de variables de entorno:

```bash
cp ../.env.template ../.env
# Edita ../.env y rellena al menos DB_PASS, ADMIN_PASSWORD y ADMIN_TOKEN_SECRET
```

3. Levanta todo el stack:

```bash
docker-compose up --build -d
```

4. Abre la aplicación en el navegador:

- **App**: http://localhost
- **API docs**: http://localhost:5000/openapi/v1.json
- **Consola MinIO**: http://localhost:9001 (minioadmin / minioadmin)

5. Para detener:

```bash
docker-compose down
```

> Nota: la primera vez la API ejecuta migraciones automáticamente de EF Core.

---

## Desarrollo local (sin Docker)

### 1. Base de datos y MinIO

Levanta solo los servicios de infraestructura:

```bash
cd infra
docker-compose up -d postgres minio
```

- PostgreSQL: `localhost:5432`
- MinIO: `localhost:9000` (consola en `:9001`)

### 2. Backend (.NET)

```bash
cd apiService
dotnet restore
dotnet run
```

- API disponible en: `http://localhost:5000`
- Asegúrate de tener el archivo `.env` en la raíz con `DB_PASS`, `ADMIN_PASSWORD` y `ADMIN_TOKEN_SECRET`.

### 3. Frontend (Svelte 5)

```bash
cd UI
npm install
npm run dev
```

- Aplicación en: `http://localhost:5173`
- Vite redirige `/api` al backend mediante el archivo `vite.config.ts`.

---

## Despliegue en producción

### Con Docker Compose

El `docker-compose.yml` ya está preparado para producción. Los pasos son idénticos a los del entorno local, pero asegúrate de:

1. Cambiar **todas las contraseñas por defecto** en el `.env`:
   - `DB_PASS`
   - `ADMIN_PASSWORD`
   - `ADMIN_TOKEN_SECRET` (cadena larga y aleatoria)
   - `STORAGE_SECRET_KEY` (si usas MinIO propio)

2. Usar HTTPS (termina TLS con un reverse proxy como Nginx, Traefik o Caddy).

3. Ejecutar:

```bash
cd infra
docker-compose up --build -d
```

### Despliegue manual (sin Docker)

- Compila el frontend: `cd UI && npm run build` (salida en la carpeta `build/`).
- Sirve los archivos estáticos con Nginx o similar.
- Publica el backend: `cd apiService && dotnet publish -c Release`.
- Configura PostgreSQL y un bucket S3/MinIO externos.
- Ajusta las variables de entorno o el `appsettings.json` del backend.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `postgres` o `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `reporte_obras` |
| `DB_USER` | Usuario de PostgreSQL | `appuser` |
| `DB_PASS` | **Contraseña de PostgreSQL** | *(obligatoria)* |
| `ADMIN_PASSWORD` | **Clave del panel admin** | *(obligatoria)* |
| `ADMIN_TOKEN_SECRET` | **JWT secret del admin** | *(obligatoria, larga)* |
| `ADMIN_TOKEN_EXPIRATION_HOURS` | Duración del token admin | `8` |
| `STORAGE_URL` | Endpoint de MinIO/S3 | `http://minio:9000` |
| `STORAGE_ACCESS_KEY` | Access key de MinIO | `minioadmin` |
| `STORAGE_SECRET_KEY` | Secret key de MinIO | `minioadmin` |
| `STORAGE_BUCKET` | Bucket de imágenes | `obras` |

> Copia `.env.template` a `.env` y rellena los valores marcados como **obligatorios**.

---

## Endpoints principales de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/informes` | Listado de informes |
| `GET` | `/api/informes/{id}` | Detalle completo de un informe |
| `POST` | `/api/informes` | Crear o actualizar informe |
| `DELETE` | `/api/informes/{id}` | Eliminar informe (requiere admin) |
| `GET` | `/api/cuatrimestres` | Listado de cuatrimestres |
| `GET` | `/api/main-page/config-centros` | Configuración de todos los centros |
| `GET` | `/api/main-page/config-centros/{centro}` | Configuración de un centro |
| `POST` | `/api/files/upload` | Subir archivo a MinIO (admin) |
| `DELETE` | `/api/files` | Borrar archivo de MinIO (admin) |
| `POST` | `/api/admin/login` | Login del panel de administración |
| `POST` | `/api/admin/sync/upload` | Sincronizar plantilla Excel (admin) |
| `POST` | `/api/admin/sync` | Re-sincronizar último Excel (admin) |

---

## Sincronización con Excel

El administrador puede cargar una **plantilla Excel** (`PLANTILLAS mantenimiento 3 CUATRIMESTRE 2025.xlsx`) desde el panel de admin. El backend:

1. Lee las hojas del Excel.
2. Extrae los sistemas, tareas y configuraciones por centro.
3. Genera archivos JSON en `apiService/Infraestructura/Datos/config-centros/`.
4. Los técnicos ven esas configuraciones reflejadas inmediatamente en la app.

---

## Funcionalidades clave

- **Autoguardado**: cada cambio en el informe se persiste automáticamente en la base de datos.
- **Modo offline/resiliente**: el frontend almacena estado local mientras dure la sesión.
- **Protección de informes**: un informe marcado como "protegido" evita modificaciones accidentales.
- **Generación de PDF**: desde el navegador, sin depender del backend, usando pdfmake.
- **Gestión de fotos**: subida a MinIO con previsualización y descripciones.
- **Panel de administración**: autenticación por token, sincronización Excel, gestión de archivos y borrado de informes/cuatrimestres.
ç
---

## Comandos
Putty: 
- **Usuario**: gtm-cloud 
**Contraseña**: 1234 
- **Borrar desde putty el caché de construcción**: sudo docker builder prune -af 
- **Borrar desde putty imágenes antiguas**: sudo docker image prune -af 
- **Entrar a Dokploy**: http://192.168.1.135:3000/

---

## Licencia

Proyecto privado — GTM Total.
