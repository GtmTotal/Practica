# Informe de Obras (SvelteKit)

Esta es la UI del proyecto **Informe de Obras** basada en **SvelteKit**.

## Tecnologías

- **Frontend**: SvelteKit (Svelte 5) + TypeScript
- **Backend**: ASP.NET Core 10 (Docker Compose) 
- **Almacenamiento**: MinIO (S3 compatible) + PostgreSQL
- **Despliegue**: Docker + Vercel (adapter‑vercel) 

## Desarrollo local

```bash
# instalar dependencias
npm ci

# iniciar servidor de desarrollo (Vite)
npm run dev   # http://localhost:5173
```

El proyecto está configurado para usar **ngrok** cuando necesites exponer la API desde la Raspberry:

```bash
ngrok http 192.168.1.135:5000 --url=earthly-discard-tarmac.ngrok-free.dev
```

## Build & Docker

```bash
# Compilar UI para producción (opcional: Docker Compose ya lo hace automáticamente)
# npm run build   # genera ./build

# Lanzar todo con Docker Compose (incluye API, MinIO, PostgreSQL y UI pre‑construida)
cd ../infra
docker compose up --build -d
```

> **Nota:** Si utilizas `docker compose up --build`, el contenedor `ui` ejecuta el proceso de build durante la fase de construcción, por lo que no es necesario ejecutar `npm run build` por separado.


El contenedor `ui` sirve los archivos estáticos desde `./build` usando Nginx.

## Despliegue en Vercel

El proyecto ya incluye `@sveltejs/adapter-vercel`.  Basta con hacer push a Git y Vercel construirá automáticamente:

```bash
vercel --prod
```

Con el adapter‑vercel las rutas como `/informe/2034‑C3/HUEVAR` funcionan sin **404** y el recargo de la página se gestiona mediante Serverless Functions.

## Licencia

Proyecto privado – GTM Total.
