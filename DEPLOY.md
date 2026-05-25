# Flujo de Despliegue

## Para no romper nada

La app tiene **3 entornos**. Cada uno requiere pasos diferentes.

---

## 1. Desarrollo local (tu PC con Docker)

```bash
# En la raiz del proyecto
cd c:\Users\alepe\Desktop\svelte\informeObrasMercadona

# Si cambiaste el backend (C#)
docker-compose -f infra/docker-compose.yml build api
docker-compose -f infra/docker-compose.yml up -d api

# Frontend
cd UI
npm run dev
```

| Cambio | Accion requerida |
|---|---|
| Frontend (`.svelte`, `.ts`) | Nada extra, `npm run dev` auto-refresca |
| Backend (`.cs`) | `docker-compose build api` + `up -d api` |
| Templates de tareas | Nada extra, solo `npm run dev` |

---

## 2. Raspberry + ngrok (produccion actual)

```bash
# En la Raspberry
cd /home/gtm-cloud/Practica
git pull origin main
cd apiService
dotnet build InformeObras.csproj

# Matar proceso viejo y reiniciar
sudo pkill -f "InformeObras"
sleep 2
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5433;Database=reporte_obras;Username=appuser;Password=apppass"
nohup dotnet bin/Debug/net10.0/InformeObras.dll > /dev/null 2>&1 &
```

> **Importante:** La Raspberry usa el puerto **5433** para PostgreSQL (no 5432).

---

## 3. Vercel (frontend publico)

Se actualiza **automaticamente** cuando haces `git push` a `main`.

```bash
git add .
git commit -m "descripcion del cambio"
git push
```

---

## Sobre Dokploy

Tienes Dokploy instalado en `192.168.1.135:3000` pero **actualmente no se usa** para la app en produccion. La API apunta a ngrok (Raspberry).

Si algun dia quieres migrar de ngrok a Dokploy:
- Borra el dominio `api.gtm.com` (no validado) en Dokploy
- Usa la URL automatica de Dokploy o configura DNS correctamente
- Cambia la URL en `UI/src/lib/api-config.ts`

> **En Dokploy no tocas nada** a menos que quieras cambiar de ngrok a Dokploy como backend.

---

## Comandos utiles

### Putty (Raspberry)
- **Usuario**: gtm-cloud
- **Contraseña**: 1234
- **Borrar cache de construccion**: `sudo docker builder prune -af`
- **Borrar imagenes antiguas**: `sudo docker image prune -af`
- **Entrar a Dokploy**: http://192.168.1.135:3000/

---

## Errores comunes y prevencion

| Error | Causa | Solucion |
|---|---|---|
| `column i.n_proy does not exist` | La DB tiene `NProy` pero el codigo busca `n_proy` | Renombrar columnas con ALTER TABLE |
| Ngrok caido | El proceso se cerro en la Raspberry | `pkill ngrok` y reiniciar |
| Docker "imagen vieja" | Cambiaste C# pero no rebuildaste | `docker-compose build api` |
| `Failed to connect to 127.0.0.1:5432` | PostgreSQL no esta en puerto 5432 | Usar puerto 5433 en Raspberry, o arrancar Docker en PC |
| `No hay configuracion para X` | Creaste informe con nombre que no existe en config-centros | Usar nombres validos de obras |
