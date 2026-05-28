# Informe de Obras (SvelteKit)

Esta es la UI del proyecto **Informe de Obras** basada en **SvelteKit**.

## Tecnologías

- **Frontend**: SvelteKit (Svelte 5) + TypeScript
- **Backend**: ASP.NET Core 10 (Docker Compose)
- **Almacenamiento**: MinIO (S3 compatible) + PostgreSQL
- **Despliegue**: Docker + Vercel (adapter-vercel) + Dokploy (Raspberry)

## Entornos de ejecución

La aplicación puede ejecutarse en tres escenarios. Elige el que corresponda según lo que quieras hacer.

---

### 1. Desarrollo local (tu PC)

#### 1A. Frontend local + Backend local (Docker Desktop)

`npm run dev` levanta **solo** el servidor de desarrollo de Vite (`http://localhost:5173`). La API (`http://localhost:5000`) y la BBDD (`localhost:5433`) deben estar corriendo por separado. Si no lo están, el panel de admin y las peticiones a la API fallarán.

```bash
# 1. Levantar API, PostgreSQL y MinIO (desde la raíz del repo)
cd ../infra
docker compose up -d

# 2. En otra terminal, levantar el frontend con hot-reload
cd UI
npm ci      # solo la primera vez
npm run dev # http://localhost:5173
```

> **¿Por qué necesito Docker Desktop abierto?**
> El frontend en desarrollo apunta a `http://localhost:5000/api`. Esa API es el contenedor `api` definido en `../infra/docker-compose.yml`. Si Docker Desktop está cerrado, los contenedores se detienen y `localhost:5000` no responde.

#### 1B. Frontend local + Backend real (Raspberry)

Si quieres que tu `npm run dev` local apunte a la API real de la Raspberry (`192.168.1.135:5000`) en lugar de la local, edita temporalmente `src/lib/api-config.ts`:

```ts
// src/lib/api-config.ts (modo local contra Raspberry)
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  return 'http://192.168.1.135:5000/api'; // ← cambia aquí
}
```

Luego ejecuta normalmente:

```bash
npm run dev
```

> **Importante:** Revierte el cambio en `api-config.ts` antes de hacer `git push`, ya que Vercel necesita la lógica original para decidir entre ngrok y la IP dinámica.

---

### 2. Producción en Raspberry (acceso por IP)

La Raspberry (`192.168.1.135`) corre **Dokploy**, que gestiona los servicios como contenedores Docker Swarm.

| Servicio | Puerto | Descripción |
|---|---|---|
| Panel Dokploy | `3000` | Administración web de servicios |
| API | `5000` | ASP.NET Core (Informe de Obras) |
| PostgreSQL | `5433` | BBDD del informe |
| MinIO | `9000` / `9001` | Almacenamiento de fotos/documentos |
| Frontend | según Dokploy / Traefik (ej. `80`, `443` o `8080`) | UI estática servida por Nginx |

#### ¿Por qué no se actualiza al hacer `git push`?

- `git push` actualiza automáticamente **Vercel** (frontend público).
- La Raspberry no se entera del push. Para actualizar la versión que sirve por IP debes **redeployar manualmente** en Dokploy:
  1. Entra al panel: `http://192.168.1.135:3000`
  2. Localiza el servicio `reporteobras-ui`
  3. Pulsa **Redeploy** (o **Rebuild** si cambió el `Dockerfile`)

> **Tip:** También puedes configurar un webhook de Git en Dokploy para que redeploye automáticamente tras cada push. Esto se hace desde la pestaña *Webhooks* del servicio en el panel de Dokploy.

---

### 3. Producción en Vercel

El proyecto incluye `@sveltejs/adapter-vercel`. Al hacer push a la rama principal, Vercel compila y despliega automáticamente.

```bash
git add .
git commit -m "descripción del cambio"
git push
```

No es necesario ejecutar `vercel --prod` manualmente si el proyecto ya está vinculado a Vercel con CI/CD activado.

---

## Build & Docker (todo en uno)

Si prefieres levantar la aplicación completa (frontend compilado + API + BBDD + MinIO) en un solo comando, usa el `docker-compose.yml` de la carpeta `infra`:

```bash
cd ../infra
docker compose up --build -d
```

El contenedor `ui` construye la aplicación durante la fase de build y sirve los archivos estáticos desde `./build` usando Nginx.

## ngrok (acceso externo temporal)

Cuando necesites que la API de la Raspberry sea accesible desde fuera de la red local (por ejemplo, para que Vercel la consuma), usa ngrok:

```bash
ngrok http 192.168.1.135:5000 --url=earthly-discard-tarmac.ngrok-free.dev
```

## Licencia

Proyecto privado – GTM Total.
  