# 🏗️ Informe de Obras — GTM

> **Aplicación web profesional para digitalizar, gestionar y exportar informes de mantenimiento de centros comerciales.**


---

## 📑 Índice

- [🏗️ Informe de Obras — GTM](#️-informe-de-obras--gtm)
  - [📑 Índice](#-índice)
  - [🎯 ¿Qué hace esta aplicación?](#-qué-hace-esta-aplicación)
    - [Funcionalidades clave](#funcionalidades-clave)
  - [🛠 Tecnologías usadas](#-tecnologías-usadas)
    - [Dependencias npm clave](#dependencias-npm-clave)
    - [Dependencias NuGet clave](#dependencias-nuget-clave)
  - [🏛 Arquitectura del proyecto](#-arquitectura-del-proyecto)
    - [Diagrama de bloques](#diagrama-de-bloques)
    - [Flujo de datos paso a paso](#flujo-de-datos-paso-a-paso)
    - [Mapa mental de la arquitectura](#mapa-mental-de-la-arquitectura)
  - [📁 Estructura del proyecto](#-estructura-del-proyecto)
    - [Raíz del proyecto](#raíz-del-proyecto)
    - [Backend (apiService/)](#backend-apiservice)
    - [Frontend (UI/)](#frontend-ui)
    - [Análisis de archivos críticos](#análisis-de-archivos-críticos)
  - [🚀 Instalación local](#-instalación-local)
    - [Requisitos previos](#requisitos-previos)
    - [Opción A: Docker (recomendado — todo en uno)](#opción-a-docker-recomendado--todo-en-uno)
      - [Explicación de cada paso](#explicación-de-cada-paso)
    - [Opción B: Desarrollo sin Docker](#opción-b-desarrollo-sin-docker)
    - [Cómo comprobar que funciona](#cómo-comprobar-que-funciona)
  - [🐳 Despliegue con Docker](#-despliegue-con-docker)
    - [Los 4 servicios](#los-4-servicios)
    - [Comandos esenciales](#comandos-esenciales)
    - [Volúmenes persistentes](#volúmenes-persistentes)
    - [Cómo actualizar contenedores](#cómo-actualizar-contenedores)
    - [Mantenimiento](#mantenimiento)
  - [🌐 Despliegue en VPS / SSH / PuTTY](#-despliegue-en-vps--ssh--putty)
    - [Paso 1: Conectar al servidor](#paso-1-conectar-al-servidor)
    - [Paso 2: Instalar Docker (si no está)](#paso-2-instalar-docker-si-no-está)
    - [Paso 3: Clonar y configurar](#paso-3-clonar-y-configurar)
    - [Paso 4: Arrancar](#paso-4-arrancar)
    - [Paso 5: Mantenerlo vivo](#paso-5-mantenerlo-vivo)
    - [Paso 6: Actualizar el proyecto](#paso-6-actualizar-el-proyecto)
    - [Paso 7: Configurar HTTPS con nginx + certbot](#paso-7-configurar-https-con-nginx--certbot)
  - [🔐 Variables de entorno](#-variables-de-entorno)
    - [Tabla de variables](#tabla-de-variables)
    - [Dónde se configuran](#dónde-se-configuran)
    - [.env.template explicado](#envtemplate-explicado)
  - [📡 API completa (24 endpoints)](#-api-completa-24-endpoints)
    - [Informes (públicos)](#informes-públicos)
    - [Admin (requiere token)](#admin-requiere-token)
    - [Documentos (admin)](#documentos-admin)
    - [Archivos (admin)](#archivos-admin)
  - [📋 Scripts disponibles](#-scripts-disponibles)
    - [Frontend (UI)](#frontend-ui-1)
    - [Backend (.NET)](#backend-net)
    - [Docker](#docker)
  - [💻 Flujo de trabajo recomendado](#-flujo-de-trabajo-recomendado)
    - [Para desarrollo diario](#para-desarrollo-diario)
    - [Antes de subir cambios](#antes-de-subir-cambios)
    - [Cómo hacer backups](#cómo-hacer-backups)
    - [Cómo evitar romper producción](#cómo-evitar-romper-producción)
  - [🔄 Actualización del proyecto](#-actualización-del-proyecto)
    - [Cambios de código](#cambios-de-código)
    - [Cambios en la base de datos](#cambios-en-la-base-de-datos)
    - [Limpiar todo y empezar de cero](#limpiar-todo-y-empezar-de-cero)
  - [🔧 Troubleshooting (errores comunes)](#-troubleshooting-errores-comunes)
    - [Problemas de conexión a PostgreSQL](#problemas-de-conexión-a-postgresql)
    - [Problemas con fotos / MinIO](#problemas-con-fotos--minio)
    - [Problemas de CORS](#problemas-de-cors)
    - [Problemas de autenticación](#problemas-de-autenticación)
    - [Problemas de build de Docker](#problemas-de-build-de-docker)
    - [Problemas de TypeScript / Svelte](#problemas-de-typescript--svelte)
    - [Problemas de rendimiento](#problemas-de-rendimiento)
  - [✅ Buenas prácticas](#-buenas-prácticas)
    - [Backend (.NET)](#backend-net-1)
    - [Frontend (Svelte)](#frontend-svelte)
    - [General](#general)
  - [🔒 Seguridad](#-seguridad)
    - [Autenticación](#autenticación)
    - [Protección de datos](#protección-de-datos)
    - [Checklist de seguridad](#checklist-de-seguridad)
  - [⚡ Rendimiento](#-rendimiento)
  - [❓ FAQ (Preguntas frecuentes)](#-faq-preguntas-frecuentes)
    - [Generales](#generales)
    - [Técnicas](#técnicas)
    - [Errores comunes](#errores-comunes)
  - [📦 Checklist pre-producción](#-checklist-pre-producción)
    - [🔐 Seguridad](#-seguridad-1)
    - [🐳 Docker](#-docker)
    - [📊 Datos](#-datos)
    - [🧪 Testing](#-testing)
    - [🚀 Deploy](#-deploy)
    - [📋 Documentación](#-documentación)
  - [🤝 Cómo contribuir](#-cómo-contribuir)
  - [📄 Licencia](#-licencia)
  - [🧠 Glosario](#-glosario)

---

## 🎯 ¿Qué hace esta aplicación?

Imagina que tienes que inspeccionar **13 centros comerciales** cada **4 meses**.

Cada centro tiene entre **10 y 15 sistemas** (bombeo, soplantes, químicos, homogeneizador, neutralizador...).  
Cada sistema tiene entre **5 y 30 tareas** que revisar una por una.  
Cada tarea puede tener **fotos, mediciones, observaciones** y un resultado (OK / NO OK).

Antes, todo esto se hacía en **papel** o en **Excel suelto**. Era un caos.



### Funcionalidades clave

| Función | Descripción | ¿Quién lo usa? |
|---|---|---|
| 📋 **Formulario de inspección** | Checklist interactivo con OK/NO OK, fotos, notas, mediciones | Técnicos en campo |
| 📱 **PWA** | Se instala como app en el móvil, funciona offline parcial | Técnicos en campo |
| 💾 **Auto-guardado** | Guarda automáticamente cada pocos segundos | Todos |
| 📄 **Generación de PDF** | PDF profesional con logo, datos, firma, fotos | Técnicos y administración |
| 📊 **Dashboard** | Vista general de todos los informes con progreso | Administración |
| 🔧 **Panel admin** | Sincronizar Excel, editar tareas, gestionar informes | Administradores |
| 🗂 **Cuatrimestres** | Organización por períodos (1Q, 2Q, 3Q) | Todos |
| ⚡ **Cuadros eléctricos** | Tipo especial de informe para cuadros eléctricos | Electricistas |
| 📸 **Fotos por tarea** | Subir, comprimir, visualizar y descargar fotos | Técnicos |
| 📊 **Exportación Excel** | Descargar la plantilla actual o subir una nueva | Administradores |

---

## 🛠 Tecnologías usadas

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| **Frontend** | [Svelte 5](https://svelte.dev) + TypeScript | 5.55 | UI reactiva con runes (`$state`, `$derived`, `$effect`) |
| **Framework front** | [SvelteKit](https://kit.svelte.dev) (adapter-static) | 2.57 | Routing SPA, build estático |
| **Build tool** | [Vite](https://vitejs.dev) | 8.0 | Dev server con HMR, bundler optimizado |
| **Backend** | [ASP.NET Core](https://dotnet.microsoft.com) Minimal APIs | .NET 10 | API RESTful, sin controllers |
| **ORM** | [Entity Framework Core](https://learn.microsoft.com/ef) + Npgsql | 10.0 | Mapeo objeto-relacional, migraciones |
| **Base de datos** | [PostgreSQL](https://postgresql.org) | 16 | Datos persistentes (informes, tareas, fotos) |
| **Object Storage** | [MinIO](https://min.io) (S3-compatible) | latest | Almacenamiento de fotos y archivos |
| **PDF** | [pdfmake](https://pdfmake.org) (vía CDN) | 0.2.9 | Generación de PDF 100% en cliente |
| **Excel** | [ClosedXML](https://closedxml.github.io) | 0.105 | Lectura/escritura de archivos Excel (.xlsx) |
| **Auth** | HMAC-SHA256 (custom) | — | Autenticación stateless del panel admin |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | 1.3 | Service worker, manifest, instalable |
| **Contenedores** | Docker + Docker Compose | — | Entorno completo reproducible |
| **CD Frontend** | [Vercel](https://vercel.com) | — | Auto-deploy desde `main` |
| **CD Alternativo** | [Netlify](https://netlify.com) | — | Config disponible en `netlify.toml` |

### Dependencias npm clave

```json
{
  "dependencies": {
    "@types/pdfmake": "^0.3.2",
    "pdfmake": "^0.3.8"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.10",
    "@sveltejs/kit": "^2.57.0",
    "svelte": "^5.55.2",
    "svelte-check": "^4.4.6",
    "typescript": "^6.0.2",
    "vite": "^8.0.7",
    "vite-plugin-pwa": "^1.3.0"
  }
}
```

### Dependencias NuGet clave

| Paquete | Versión | Propósito |
|---|---|---|
| `AWSSDK.S3` | 4.0.22.1 | Cliente S3 para MinIO |
| `ClosedXML` | 0.105.0 | Parseo de Excel (sincronización centros) |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.1 | Conexión a PostgreSQL desde EF Core |
| `DotNetEnv` | 3.1.1 | Carga de archivos `.env` |
| `Microsoft.AspNetCore.OpenApi` | 10.0.6 | Documentación OpenAPI/Swagger |

---

## 🏛 Arquitectura del proyecto

### Diagrama de bloques

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                                 │
│              (Navegador Web / Móvil con PWA)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND — Svelte 5 + TypeScript                 │
│                    static SPA — Puerto 80 / 5173 (dev)              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │    src/routes/   │  │ src/lib/components│  │   src/lib/services/ │ │
│  │                  │  │                  │  │                     │ │
│  │  • / (dashboard) │  │  • InformePage   │  │  • stores/ (state)  │ │
│  │  • /admin        │  │  • TareaItem     │  │  • api/ (HTTP)     │ │
│  │  • /informe/...  │  │  • SeccionItem   │  │  • domain/ (logic) │ │
│  │  • 4 rutas total │  │  • 15 compon.   │  │  • 6 servicios      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTP (fetch) — JSON
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKEND — ASP.NET Core 10                          │
│                   Minimal APIs — Puerto 5000 / 8081                  │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │   Endpoints/    │  │   Services/     │  │   Persistencia/     │ │
│  │                 │  │                 │  │                     │ │
│  │  • 5 archivos   │  │  • Auth (HMAC)  │  │  • DbContext        │ │
│  │  • ~24 rutas    │  │  • Excel Sync   │  │  • 5 entities       │ │
│  │  • Minimal API  │  │  • MinIO Store  │  │  • 5 migraciones    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│      PostgreSQL 16       │  │      MinIO (S3)              │
│                          │  │                              │
│  • informes              │  │  • Fotos de tareas           │
│  • sistemas (secciones)  │  │  • Archivos adjuntos         │
│  • tareas                │  │  • Bucket: "obras"           │
│  • fotos (metadatos)     │  │  • Expuesto públicamente     │
│  • cuatrimestres         │  │                              │
│  • Puerto: 5433 (host)   │  │  • Puerto: 9000 (API)        │
│    5432 (container)      │  │  • Puerto: 9001 (Console)    │
└─────────────────────────┘  └──────────────────────────────┘
```

### Flujo de datos paso a paso

```
  ADMIN                    TÉCNICO (usuario)              SISTEMA
    │                           │                           │
    ├── 1. Sube Excel ─────────►│                           │
    │    (Plantilla-modelo.xlsx)│                           │
    │                           │                           ├── 2. ClosedXML parsea
    │                           │                           │    el Excel
    │                           │                           │
    │◄── 3. JSONs centros ──────┤                           │
    │    (13 archivos .json)    │                           │
    │                           │                           │
    │                           ├── 4. Abre la app ────────►│
    │                           │                           │
    │                           │◄── 5. Dashboard ──────────┤
    │                           │    (informes guardados)   │
    │                           │                           │
    │                           ├── 6. Selecciona centro ──►│
    │                           │    + cuatrimestre         │
    │                           │                           │
    │                           │◄── 7. Config JSON ────────┤
    │                           │    (secciones y tareas)   │
    │                           │                           │
    │                           ├── 8. Rellena informe ────►│
    │                           │    • Marca OK / NO OK     │
    │                           │    • Toma fotos           │
    │                           │    • Mide amperios        │
    │                           │    • Escribe notas        │
    │                           │                           │
    │                           │◄── 9. Auto-guarda ────────┤
    │                           │    (cada ~30s)            │
    │                           │    POST /api/informes     │
    │                           │                           │
    │                           ├── 10. Genera PDF ────────►│
    │                           │     (pdfmake en cliente)  │
    │                           │                           │
    │                           │     Descarga el PDF       │
    │                           │◄──────────────────────────│
    │                           │                           │
    ├── 11. Panel admin ───────►│                           │
    │     • Editar tareas       │                           │
    │     • Sincronizar Excel   │                           │
    │     • Gestionar informes  │                           │
    │     • Ver documentos      │                           │
    │                           │                           │
    └───────────────────────────┴───────────────────────────┘
```

### Mapa mental de la arquitectura

```
                        INFORME DE OBRAS
                        │
            ┌───────────┴───────────┐
            │                       │
       FRONTEND                  BACKEND
       (Svelte 5)               (.NET 10)
            │                       │
    ┌───────┼───────┐       ┌───────┼───────┐
    │       │       │       │       │       │
  Routes Components Services Endpoints Services DB
    │       │       │       │       │       │
  +layout  Tarea   Stores  Admin   Auth   PostgreSQL
  +page    Seccion   api/  Archivos Excel  ── informes
  /admin   Header  domain/ Documen. MinIO  ── sistemas
  /informe Footer   utils/ Informes       ── tareas
           Fotos    types/  Cuatri.       ── fotos
           Toast             Config       ── cuatri.
           Dialog
```

---

## 📁 Estructura del proyecto

### Raíz del proyecto

```
informeObrasMercadona/
│
├── 📄 .env                      # Variables de entorno (NO se sube a git)
├── 📄 .env.template             # Plantilla de variables (SÍ se sube a git)
├── 📄 .gitignore                # Archivos ignorados por git
├── 📄 package.json              # Dependencias globales (pdfmake types)
├── 📄 DEPLOY.md                 # Guía de despliegue detallada
├── 📄 README.md                 # Este documento
│
├── 📁 apiService/               # ▶ BACKEND (.NET 10)
├── 📁 UI/                       # ▶ FRONTEND (Svelte 5)
├── 📁 infra/                    # ▶ Docker Compose
├── 📁 .vercel/                  # Configuración Vercel (auto-generado)
│
├── 📁 fotosprueba/              # Fotos de prueba (puede eliminarse)
├── 📁 node_modules/             # Dependencias npm raíz (generado)
│
└── 📊 PLANTILLAS mantenimiento 3 CUATRIMESTRE 2025.xlsx  # Plantilla Excel fuente
```

### Backend (apiService/)

```
apiService/
│
├── 📄 InformeObras.csproj       # Archivo de proyecto .NET (NuGet references)
├── 📄 Program.cs                # ENTRY POINT — Configuración DI, CORS, middleware
├── 📄 appsettings.json          # Config general (placeholders, secretos vacíos)
├── 📄 appsettings.Development.json  # Config desarrollo local (BD, MinIO locales)
├── 📄 Dockerfile                # Build multi-stage para Docker
├── 📄 apiService.sln            # Solution file (Visual Studio / dotnet)
├── 📄 Plantilla-modelo.xlsx     # Plantilla Excel para sincronizar centros
│
├── 📁 Properties/
│   └── 📄 launchSettings.json   # Perfiles de ejecución (puertos, URLs)
│
└── 📁 Infraestructura/          #  CAPA DE INFRAESTRUCTURA (toda la lógica)
    │
    ├── 📄 Endpoints.cs          # Clase base: método EsAdmin() para auth
    ├── 📄 DocumentDto.cs        # DTOs para CRUD de documentos
    ├── 📄 IServicioAlmacenamientoArchivos.cs  # Interface para MinIO
    ├── 📄 ServicioAutenticacionAdmin.cs       # Auth con HMAC-SHA256
    ├── 📄 ServicioSincronizacionExcel.cs      # Parseo Excel → JSON
    │
    ├── 📁 Archivos/             # Almacenamiento de archivos (MinIO)
    │   ├── 📄 OpcionesAlmacenamiento.cs       # Config: URL, keys, bucket
    │   └── 📄 ServicioAlmacenamientoMinio.cs  # Implementación AWSSDK.S3
    │
    ├── 📁 Datos/
    │   └── 📁 config-centros/   # Configuraciones JSON por centro (13 centros)
    │       ├── 📄 ALMEIRIN DP2.json
    │       ├── 📄 ALMEIRIN DP3.json
    │       ├── 📄 ANTEQUERA.json
    │       ├── 📄 CIEMPOZUELOS.json
    │       ├── 📄 HUEVAR.json
    │       ├── 📄 INGENIO.json
    │       ├── 📄 MERCAPALMA.json
    │       ├── 📄 PARC DE SAGUNT.json
    │       ├── 📄 POVOA.json
    │       ├── 📄 RIBAROJA.json
    │       ├── 📄 SAN ISIDRO.json
    │       ├── 📄 VILLADANGOS.json
    │       ├── 📄 VITORIA.json
    │       └── 📄 repair_encoding.py    # Script auxiliar (reparar encoding)
    │
    ├── 📁 Endpoints/            # ⭐ ENDPOINTS MINIMAL API (5 archivos)
    │   ├── 📄 AdminEndpoints.cs       # Login, sync Excel, config centros
    │   ├── 📄 ArchivosEndpoints.cs    # Upload/delete a MinIO
    │   ├── 📄 DocumentosEndpoints.cs  # CRUD documentos (admin)
    │   ├── 📄 EndpointHelpers.cs      # DTOs + helpers de parseo JSON
    │   └── 📄 InformesEndpoints.cs    # CRUD informes + cuatrimestres
    │
    └── 📁 Persistencia/         # ⭐ CAPA DE DATOS (EF Core)
        ├── 📄 ContextoBaseDatos.cs    # DbContext (DbSets, config)
        ├── 📁 Entidades/
        │   ├── 📄 Informe.cs          # Entidad principal del informe
        │   ├── 📄 Sistema.cs          # Sección del informe
        │   ├── 📄 Tarea.cs            # Tarea individual (ok, noOk, rev)
        │   ├── 📄 Foto.cs             # Foto asociada a una sección
        │   └── 📄 Cuatrimestre.cs     # Período (1Q, 2Q, 3Q)
        └── 📁 Migraciones/           # 5 migraciones automáticas
            ├── 📄 20260504075802_InitialCreate.cs
            ├── 📄 20260504143010_ModeloRelacionalInformes.cs
            ├── 📄 20260505052658_TablaCuatrimestres.cs
            ├── 📄 20260508081443_AddFotoBase64.cs
            ├── 📄 20260512083435_AddDescripcionAFoto.cs
            └── 📄 ContextoBaseDatosModelSnapshot.cs
```

### Frontend (UI/)

```
UI/
│
├── 📄 package.json              # Dependencias npm del frontend
├── 📄 svelte.config.js          # Config SvelteKit (adapter-static, runes mode)
├── 📄 vite.config.ts            # Config Vite (PWA, Svelte plugin)
├── 📄 tsconfig.json             # TypeScript strict mode
├── 📄 Dockerfile                # Build node + nginx para Docker
├── 📄 nginx.conf                # Config nginx (SPA fallback)
├── 📄 netlify.toml              # Config despliegue Netlify
│
└── 📁 src/
    │
    ├── 📄 app.html              # Shell HTML (meta tags, PWA, favicon)
    ├── 📄 app.css               # CSS GLOBAL (variables, reset, layout)
    ├── 📄 app.d.ts              # Declaraciones globales TypeScript (pdfMake)
    │
    ├── 📁 lib/                  #  CÓDIGO COMPARTIDO
    │   │
    │   ├── 📄 api-config.ts     # Detección dinámica URL API (local vs ngrok)
    │   ├── 📄 index.ts          # Barrel export global (services, types, utils)
    │   │
    │   ├   
    │   │
    │   ├── 📁 components/       # COMPONENTES SVELTE
    │   │   │
    │   │   ├── 📁 informe/      # 11 componentes del formulario de inspección
    │   │   │   ├── 📄 InformePage.svelte        # Página orquestadora (333 ln)
    │   │   │   ├── 📄 HeaderForm.svelte         # Cabecera: logo, progreso, datos
    │   │   │   ├── 📄 ListaSecciones.svelte     # Iterador de secciones
    │   │   │   ├── 📄 SeccionItem.svelte        # Sección colapsable con tareas
    │   │   │   ├── 📄 ListaTareas.svelte        # Iterador de tareas
    │   │   │   ├── 📄 TareaItem.svelte          # Tarea simple (OK/NO OK)
    │   │   │   ├── 📄 TareaPadreItem.svelte     # Tarea con subtareas
    │   │   │   ├── 📄 SubTareaItem.svelte       # Subtarea individual
    │   │   │   ├── 📄 DatosMotor.svelte         # Campos de medición (bombas)
    │   │   │   ├── 📄 GaleriaFotos.svelte       # Galería de fotos
    │   │   │   └── 📄 InformeFooter.svelte      # Conclusiones + acciones
    │   │   │
    │   │   ├── 📁 admin/        # 4 componentes del panel de administración
    │   │   │   ├── 📄 TareasEditor.svelte          # Editor de tareas por centro (900 ln)
    │   │   │   ├── 📄 TareasEditorCuadros.svelte   # Editor de cuadros eléctricos (903 ln)
    │   │   │   ├── 📄 CrearCuadroElectricoModal.svelte  # Modal crear CE
    │   │   │   └── 📄 EditableTable.svelte         # Tabla CRUD genérica
    │   │   │
    │   │   └── 📄 shared/       # 4 componentes reutilizables
    │   │       ├── 📄 Toast.svelte         # Notificaciones toast
    │   │       ├── 📄 Dialog.svelte        # Modal diálogo (confirm, prompt)
    │   │       ├── 📄 ProgressBar.svelte   # Barra de progreso
    │   │       └── 📄 Spinner.svelte       # Indicador de carga
    │   │
    │   ├── 📁 services/         # ▶ CAPA DE SERVICIOS
    │   │   ├── 📄 index.ts      # Barrel export
    │   │   │
    │   │   ├── 📁 stores/       # Estado reactivo global (usando $state)
    │   │   │   ├── 📄 admin.svelte.ts          # Auth admin, documentos CRUD
    │   │   │   ├── 📄 config-centros.svelte.ts # Cache de configs de centros
    │   │   │   ├── 📄 cuatrimestre.svelte.ts   # Gestión de cuatrimestres
    │   │   │   ├── 📄 navigation.svelte.ts     # Navegación, vista actual
    │   │   │   └── 📄 ui.svelte.ts             # UI state (dialog, toast)
    │   │   │
    │   │   ├── 📁 api/          # Llamadas HTTP al backend
    │   │   │   └── 📄 database.svelte.ts       # Servicio de base de datos (CRUD)
    │   │   │
    │   │   └── 📁 domain/       # Lógica de negocio
    │   │       ├── 📄 form-initialization.svelte.ts     # Init formulario, estados
    │   │       ├── 📄 form-persistence.svelte.ts        # Guardado/carga/PDF
    │   │       ├── 📄 form-persistence/
    │   │       │   ├── 📄 pdf-data-builder.svelte.ts    # Construye datos para PDF
    │   │       │   └── 📄 pdf-report.svelte.ts          # Genera PDF con pdfmake
    │   │       ├── 📄 foto-manager.svelte.ts            # Compresión/subida/borrado
    │   │       └── 📄 template-service.ts               # Template cuadros eléctricos
    │   │
    │   ├── 📁 types/            # Interfaces TypeScript compartidas
    │   │   ├── 📄 index.ts
    │   │   ├── 📄 config.interface.ts    # ConfigCentro, ConfigSeccion, TareaConfig
    │   │   ├── 📄 document.interface.ts  # DocumentDto, UpdateDocumentDto
    │   │   ├── 📄 foto.interface.ts      # Foto
    │   │   └── 📄 informe.interface.ts   # InformeGuardado, GrupoCuatrimestre
    │   │
    │   ├── 📁 utils/            # Utilidades varias
    │   │   ├── 📄 index.ts
    │   │   ├── 📄 api-mapper.ts          # snake_case ↔ camelCase
    │   │   └── 📄 informe-utils.ts       # Cálculo de progreso y estado
    │   │
    │   └── 📁 templates/
    │       └── 📄 cuadroElectrico.ts     # Template por defecto (9 secciones, ~90 tareas)
    │
    └── 📁 routes/               # ▶ RUTAS SVELTEKIT (4 rutas)
        │
        ├── 📄 +layout.svelte    # Layout global: app.css, Toast, Dialog
        ├── 📄 +layout.ts        # ssr=false, prerender=true (SPA estática)
        │
        ├── 📄 +page.svelte      #  DASHBOARD PRINCIPAL (1139 líneas)
        │                        #   • Pestañas: Mantenimiento / Cuadros Eléctricos
        │                        #   • Grupos por cuatrimestre
        │                        #   • Métricas (total, completados, progreso)
        │                        #   • Cards de centros con progreso
        │                        #   • Modal crear cuadro eléctrico
        │
        ├── 📁 admin/
        │   └── 📄 +page.svelte  # ⭐ PANEL ADMIN (2799 líneas)
        │                        #   • Menú raíz (Mantenimiento / Cuadros Eléctricos)
        │                        #   • Editor de tareas por centro
        │                        #   • Editor de templates CE
        │                        #   • CRUD documentos
        │                        #   • Sincronización Excel
        │                        #   • Responsive (vistas móvil/escritorio)
        │
        └── 📁 informe/
            ├── 📄 +page.svelte  # Formulario sin parámetros
            └── 📁 [cuatrimestre]/
                └── 📁 [centro]/
                    ├── 📄 +page.svelte  # Formulario con parámetros ruta
                    └── 📄 +page.ts      # prerender=false
```

### Análisis de archivos críticos

| Archivo | ¿Qué hace? | ¿Quién lo usa? | Riesgo al modificarlo |
|---|---|---|---|
| `apiService/Program.cs` | Entry point: DI, CORS, migraciones, routing | Sistema (al arrancar) | 🔴 Alto — cualquier error aquí rompe todo el backend |
| `apiService/Infraestructura/Endpoints/InformesEndpoints.cs` | CRUD de informes (291 líneas) | Frontend, usuarios | 🔴 Alto — lógica principal del negocio |
| `apiService/Infraestructura/ServicioAutenticacionAdmin.cs` | Auth con HMAC-SHA256 | Panel admin | 🔴 Alto — seguridad |
| `apiService/Infraestructura/ContextoBaseDatos.cs` | DbContext de EF Core | Todo el backend | 🔴 Alto — configuración de BD |
| `UI/src/routes/+page.svelte` | Dashboard principal (1139 líneas) | Usuarios | 🟠 Medio — archivo grande, difícil de modificar |
| `UI/src/routes/admin/+page.svelte` | Panel admin (2799 líneas) | Administradores | 🟠 Medio — el más grande del proyecto |
| `UI/src/lib/services/domain/form-persistence.svelte.ts` | Persistencia, PDF, backup | Frontend | 🟡 Moderado — lógica crítica de guardado |
| `UI/src/lib/services/domain/form-initialization.svelte.ts` | Estado reactivo del formulario | Frontend | 🟡 Moderado — define TareaState, FormState |
| `UI/src/app.css` | CSS global (variables, reset) | Toda la app | 🟢 Bajo — solo estilos |
| `infra/docker-compose.yml` | Orquestación completa | DevOps | 🟡 Moderado — puertos, volúmenes, variables |

---

## 🚀 Instalación local

### Requisitos previos

| Herramienta | Versión | Cómo comprobar | Por qué es necesaria |
|---|---|---|---|
| **Git** | cualquier | `git --version` | Clonar el repositorio |
| **Docker** + **Docker Compose** | Docker 24+ | `docker --version && docker compose version` | Opción A (recomendada) |
| **Node.js** | 20+ | `node --version` | Opción B + build frontend |
| **npm** | 10+ | `npm --version` | Gestión de dependencias JS |
| **.NET SDK** | 10.0 | `dotnet --version` | Opción B + build backend |

### Opción A: Docker (recomendado — todo en uno)

Esta opción levanta **los 4 servicios** (PostgreSQL, MinIO, API, UI) con un solo comando. Es la más rápida y la que garantiza que todo funciona igual en cualquier máquina.

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd informeObrasMercadona

# 2. Crear archivo de variables de entorno
cp .env.template .env

# 3. (Opcional) Editar variables
# Abre .env con tu editor favorito y cambia los valores que quieras
# Los valores por defecto ya funcionan para desarrollo local
notepad .env

# 4. Ir a la carpeta de infraestructura Docker
cd infra

# 5. Construir y arrancar TODO
docker compose up --build -d

# ⏳ Esto tarda unos minutos la primera vez (descarga imágenes, compila)

# 6. Verificar que todos los contenedores están corriendo
docker compose ps

# Deberías ver algo como:
# NAME              IMAGE               STATUS              PORTS
# reporte_api       ...                 Up                  0.0.0.0:5000->8080
# reporte_minio     minio/minio         Up                  0.0.0.0:9000->9000, 9001
# reporte_postgres  postgres:16         Up                  0.0.0.0:5433->5432
# reporte_ui        ...                 Up                  0.0.0.0:80->80

# 7. Abrir en el navegador
# → http://localhost:80
```

#### Explicación de cada paso

| Paso | ¿Qué ocurre internamente? |
|---|---|
| `git clone` | Descarga todo el código del repositorio a tu máquina |
| `cp .env.template .env` | Crea el archivo de configuración local a partir de la plantilla |
| `docker compose up --build -d` | **Construye** las imágenes Docker del backend y frontend, **descarga** PostgreSQL y MinIO de Docker Hub, **conecta** los 4 servicios en una red interna, **inicia** todo en segundo plano (`-d` = detached) |
| `docker compose ps` | Muestra el estado de los contenedores |

### Opción B: Desarrollo sin Docker

Usa esta opción si quieres **desarrollar y ver cambios en caliente** (hot reload). Necesitas PostgreSQL y MinIO instalados (pueden estar en Docker aunque el resto no).

```bash
# ─── 1. INFRAESTRUCTURA (PostgreSQL + MinIO) ───
# Puedes usar Docker solo para estos dos servicios:

# PostgreSQL
docker run -d \
  --name pg \
  -e POSTGRES_DB=reporte_obras \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=apppass \
  -p 5432:5432 \
  postgres:16

# MinIO
docker run -d \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# ─── 2. BACKEND (.NET 10) ───
cd apiService

# Restaurar dependencias NuGet
dotnet restore

# Compilar para verificar que no hay errores
dotnet build

# Ejecutar con perfil HTTP
dotnet run --launch-profile http
# El backend arranca en http://192.168.1.135:8081

# ─── 3. FRONTEND (Svelte 5) ───
# Abre otra terminal

cd UI

# Instalar dependencias npm
npm install

# Iniciar servidor de desarrollo con hot reload
npm run dev
# El frontend arranca en http://localhost:5173
```

### Cómo comprobar que funciona

```bash
# 1. Probar que el backend responde
curl http://localhost:5000/api/informes
# → Debería devolver [] (array vacío)

# 2. Probar que el frontend sirve
curl http://localhost:80
# → Debería devolver el HTML de la app

# 3. Probar MinIO
# Abrir http://localhost:9001 en el navegador
# Login: minioadmin / minioadmin

# 4. Abrir la app en el navegador
# → http://localhost:80
```

---

## 🐳 Despliegue con Docker

### Los 4 servicios

| Servicio | Imagen | Puerto host | Puerto contenedor | Depende de | ¿Persiste datos? |
|---|---|---|---|---|---|
| **postgres** | `postgres:16` | 5433 | 5432 | — | ✅ Sí (volumen `pg_data`) |
| **minio** | `minio/minio:latest` | 9000, 9001 | 9000, 9001 | — | ✅ Sí (volumen `minio_data`) |
| **api** | (build local) | 5000 | 8080 | postgres, minio | ❌ No (usa BD externa) |
| **ui** | (build local) | 80 | 80 | api | ❌ No (SPA estática) |

### Comandos esenciales

```bash
# ─── CONSTRUIR Y ARRANCAR ───

# Primera vez o después de cambios
docker compose up --build -d

# Solo arrancar (si ya está construido)
docker compose up -d

# ─── LOGS ───

# Todos los servicios en tiempo real
docker compose logs -f

# Un servicio específico
docker compose logs -f api
docker compose logs -f ui
docker compose logs -f postgres
docker compose logs -f minio

# Últimas N líneas
docker compose logs --tail=50 api

# ─── PARAR ───

# Parar todo (los contenedores se quedan)
docker compose stop

# Parar y eliminar contenedores
docker compose down

# ⚠️ Parar y eliminar contenedores + VOLÚMENES (BORRA DATOS)
docker compose down -v

# ─── REINICIAR ───

# Reiniciar un servicio
docker compose restart api

# Reconstruir un solo servicio (sin tocar los demás)
docker compose up --build -d api

# ─── ESTADO ───

# Ver todos los servicios
docker compose ps

# Ver uso de recursos
docker stats

# ─── ACCEDER A CONTENEDORES ───

# Terminal dentro del contenedor
docker compose exec api bash
docker compose exec postgres psql -U appuser -d reporte_obras

# Copiar archivos desde/hacia un contenedor
docker cp reporte_api:/app/appsettings.json ./appsettings.backup.json
```

### Volúmenes persistentes

```yaml
volumes:
  pg_data:     # → /var/lib/postgresql/data  (base de datos)
  minio_data:  # → /data                     (fotos y archivos)
```

| Volumen | ¿Qué contiene? | Tamaño típico | Backup recomendado |
|---|---|---|---|
| `pg_data` | Todas las bases de datos | 10-100 MB | `pg_dump` semanal |
| `minio_data` | Fotos subidas por los usuarios | 100 MB - 10 GB | Copia mensual |

⚠️ **IMPORTANTE**: Si ejecutas `docker compose down -v`, pierdes **TODOS** los datos. No hay papelera ni recovery.

### Cómo actualizar contenedores

```bash
# 1. Bajar cambios del repositorio
git pull

# 2. Reconstruir y reiniciar
cd infra
docker compose up --build -d

# 3. Verificar logs por posibles errores
docker compose logs --tail=20 api
```

**¿Qué pasa con los datos cuando actualizas?**
- La base de datos **NO se pierde** (está en el volumen `pg_data`)
- Las fotos **NO se pierden** (están en el volumen `minio_data`)
- Solo se reconstruyen las imágenes de `api` y `ui`

### Mantenimiento

```bash
# Limpiar imágenes no usadas (libera espacio)
docker image prune -a

# Ver cuánto ocupa Docker
docker system df

# Backup de la base de datos
docker compose exec postgres pg_dump -U appuser reporte_obras > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker compose exec -T postgres psql -U appuser reporte_obras

# Ver tamaño de los volúmenes
docker system df -v
```

---

## 🌐 Despliegue en VPS / SSH / PuTTY

### Paso 1: Conectar al servidor

```bash
# Desde Linux / Mac / WSL
ssh usuario@tu-servidor.com

# Desde Windows con PuTTY:
#   1. Abre PuTTY
#   2. Host: tu-servidor.com
#   3. Port: 22
#   4. Connection type: SSH
#   5. Open → Introduce usuario y contraseña
```

### Paso 2: Instalar Docker (si no está)

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl

# Añadir repositorio oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Añadir tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# ⚠️ Cerrar sesión y volver a entrar para que el cambio de grupo tenga efecto
exit
# Vuelve a conectarte con SSH

# Verificar instalación
docker --version
docker compose version
```

### Paso 3: Clonar y configurar

```bash
# Ir al directorio de aplicaciones
cd /opt

# Clonar el repositorio
sudo git clone <url-del-repo> informe-obras
sudo chown -R $USER:$USER informe-obras
cd informe-obras

# Configurar variables de entorno
cp .env.template .env
nano .env
# Editar con tus valores de producción:
#   DB_PASS=contraseña_segura
#   ADMIN_PASSWORD=contraseña_segura_admin
#   ADMIN_TOKEN_SECRET=token_super_secreto_aleatorio
```

### Paso 4: Arrancar

```bash
cd infra
docker compose up --build -d
```

### Paso 5: Mantenerlo vivo

Los servicios tienen `restart: unless-stopped` configurado. Esto significa que:

- Si el servidor se **reinicia**, los contenedores arrancan solos
- Si un contenedor **falla**, Docker lo reinicia automáticamente
- Solo dejan de ejecutarse si los paras **explícitamente** con `docker compose stop`

### Paso 6: Actualizar el proyecto

```bash
cd /opt/informe-obras
git pull
cd infra
docker compose up --build -d
```

### Paso 7: Configurar HTTPS con nginx + certbot

```bash
# Instalar nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/informe-obras
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/informe-obras /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Instalar certificado SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 🔐 Variables de entorno

### Tabla de variables

| Variable | Descripción | Valor por defecto | Obligatoria | ¿Para qué se usa? |
|---|---|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` | ✅ Sí | Conexión a BD |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | ✅ Sí | Conexión a BD |
| `DB_NAME` | Nombre de la base de datos | `reporte_obras` | ✅ Sí | Conexión a BD |
| `DB_USER` | Usuario de BD | `appuser` | ✅ Sí | Conexión a BD |
| `DB_PASS` | Contraseña de BD | `apppass` | ✅ Sí | Conexión a BD |
| `ADMIN_PASSWORD` | Contraseña del panel admin | `1234` | ✅ Sí | Login en `/admin` |
| `ADMIN_TOKEN_SECRET` | Secreto HMAC para tokens | — | ✅ Sí | Firmar tokens de sesión |
| `ADMIN_TOKEN_EXPIRATION_HOURS` | Horas hasta que expire el token | `8` | ❌ No | Sesión admin |
| `STORAGE_URL` | URL del servicio MinIO/S3 | `http://minio:9000` | ✅ Sí | Subir/bajar fotos |
| `STORAGE_ACCESS_KEY` | Access key de MinIO | `minioadmin` | ✅ Sí | Autenticación MinIO |
| `STORAGE_SECRET_KEY` | Secret key de MinIO | `minioadmin` | ✅ Sí | Autenticación MinIO |
| `STORAGE_BUCKET` | Bucket donde guardar fotos | `obras` | ❌ No | Organización en MinIO |

### Dónde se configuran

Estas variables se pueden configurar de **tres formas** diferentes, en orden de prioridad:

1. **Archivo `.env`** (raíz del proyecto) — Lo carga `DotNetEnv` en `Program.cs`
2. **Variables de entorno del sistema** — Las que se pasan en `docker-compose.yml` con `${VAR_NAME:-default}`  
3. **`appsettings.json` / `appsettings.Development.json`** — Valores hardcodeados

**En Docker Compose** se pasan así (ver `infra/docker-compose.yml`):

```yaml
services:
  api:
    environment:
      - ConnectionStrings__DefaultConnection=Host=${DB_HOST:-postgres}; ...
      - Storage__ServiceUrl=${STORAGE_URL:-http://minio:9000}
      - Admin__Password=${ADMIN_PASSWORD:-1234}
```

**En desarrollo local** se cargan desde `.env` automáticamente gracias a `DotNetEnv.Env.Load()` en `Program.cs`.

### .env.template explicado

```env
# ─────────────────────────────────────────────
# INFORME DE OBRAS — Variables de Entorno
# ─────────────────────────────────────────────
# Copia este archivo como .env y rellena los valores
# cp .env.template .env
# ─────────────────────────────────────────────

# ─── BASE DE DATOS ───
# PostgreSQL debe estar accesible desde donde se ejecute el backend
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reporte_obras
DB_USER=appuser
DB_PASS=apppass

# ─── ADMIN PANEL ───
# Contraseña para acceder al panel de administración en /admin
ADMIN_PASSWORD=1234
# Secreto para generar los tokens de sesión (cambiar por uno seguro)
ADMIN_TOKEN_SECRET=gtm-reporte-obras-token-super-secreto-2026
# Horas de validez del token (8 horas por defecto)
ADMIN_TOKEN_EXPIRATION_HOURS=8

# ─── STORAGE (MinIO / S3) ───
# URL del servicio de almacenamiento compatible con S3
STORAGE_URL=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=obras
```

---

## 📡 API completa (24 endpoints)

### Informes (públicos)

Estos endpoints **no requieren autenticación**. Cualquier usuario puede leer y escribir informes.

| Método | Ruta | Descripción | Cuerpo (request) | Respuesta |
|---|---|---|---|---|
| **GET** | `/api/informes` | Listar todos los informes | — | `InformeGuardado[]` |
| **GET** | `/api/informes/{id}` | Obtener informe completo con secciones y tareas | — | Informe completo |
| **POST** | `/api/informes` | Crear o actualizar informe (upsert) | `SolicitudGuardarInforme` | Informe creado/actualizado |
| **PATCH** | `/api/informes/{id}/metadata` | Actualizar metadatos (técnico, conclusiones) | Metadata fields | 200 OK |
| **PATCH** | `/api/informes/{id}/seccion/{prefijo}` | Actualizar una sección (observaciones) | Seccion data | 200 OK |
| **PATCH** | `/api/informes/{id}/seccion/{prefijo}/tarea/{orden}` | Actualizar una tarea (ok, noOk, rev, nota) | Tarea data | 200 OK |
| **GET** | `/api/cuatrimestres` | Listar todos los cuatrimestres | — | `Cuatrimestre[]` |

### Admin (requiere token)

Estos endpoints requieren un token Bearer válido (obtenido vía `/api/admin/login`).

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| **POST** | `/api/admin/login` | Iniciar sesión → recibe token | ❌ No |
| **POST** | `/api/admin/sync` | Sincronizar centros desde `Plantilla-modelo.xlsx` | ✅ Sí |
| **POST** | `/api/admin/sync/upload` | Subir Excel y sincronizar centros | ✅ Sí |
| **GET** | `/api/admin/export` | Descargar el Excel actual del servidor | ✅ Sí |
| **GET** | `/api/main-page/config-centros` | Obtener la configuración de todos los centros | ❌ No |
| **GET** | `/api/main-page/config-centros/{centro}` | Obtener configuración de un centro específico | ❌ No |

### Documentos (admin)

CRUD completo sobre la tabla `informes` (acceso directo, sin estructura de secciones/tareas).

| Método | Ruta | Descripción |
|---|---|---|
| **GET** | `/api/documents` | Listar todos los documentos |
| **GET** | `/api/documents/{id}` | Obtener un documento por ID |
| **POST** | `/api/documents` | Crear un nuevo documento |
| **PUT** | `/api/documents/{id}` | Actualizar un documento existente |
| **DELETE** | `/api/documents/{id}` | Eliminar un documento |

### Archivos (admin)

Subida y borrado de archivos a MinIO.

| Método | Ruta | Descripción |
|---|---|---|
| **POST** | `/api/files/upload` | Subir archivo → devuelve URL pública |
| **DELETE** | `/api/files/?objectKey=...` | Eliminar archivo por objectKey |

---

## 📋 Scripts disponibles

### Frontend (UI)

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo con hot reload |
| `npm run build` | Compilar para producción (genera `build/`) |
| `npm run preview` | Vista previa del build de producción |
| `npm run check` | Verificar TypeScript + Svelte (0 errores esperados) |
| `npm run check:watch` | Verificación continua (vigila cambios) |
| `npm run prepare` | Sincronizar SvelteKit (se ejecuta automáticamente en install) |

### Backend (.NET)

| Comando | Descripción | Dónde ejecutar |
|---|---|---|
| `dotnet restore` | Restaurar paquetes NuGet | `apiService/` |
| `dotnet build` | Compilar el proyecto | `apiService/` |
| `dotnet run` | Ejecutar en desarrollo | `apiService/` |
| `dotnet run --launch-profile http` | Ejecutar con perfil HTTP | `apiService/` |
| `dotnet publish -c Release -o out` | Compilar para producción | `apiService/` |
| `dotnet ef migrations add Nombre` | Crear nueva migración | `apiService/` |
| `dotnet ef database update` | Aplicar migraciones manualmente | `apiService/` |

### Docker

| Comando | Descripción | Dónde ejecutar |
|---|---|---|
| `docker compose up --build -d` | Construir y arrancar todo | `infra/` |
| `docker compose down` | Parar y eliminar contenedores | `infra/` |
| `docker compose logs -f` | Ver logs en tiempo real | `infra/` |
| `docker compose restart api` | Reiniciar solo el backend | `infra/` |

---

## 💻 Flujo de trabajo recomendado

### Para desarrollo diario

```bash
# 1. Siempre empezar con los últimos cambios
git checkout main
git pull

# 2. Backend (en una terminal)
cd apiService
dotnet restore    # Solo si cambió el .csproj
dotnet build      # Verificar que compila
dotnet run --launch-profile http

# 3. Frontend (en otra terminal)
cd UI
npm install       # Solo si cambió package.json
npm run dev       # Hot reload en http://localhost:5173
```

### Antes de subir cambios

```bash
# 1. Verificar backend
cd apiService
dotnet build
# Debe decir: "Compilación correcta. 0 Errores"

# 2. Verificar frontend
cd UI
npm run check
# Debe decir: "svelte-check found 0 errors"

# 3. Revisar qué se ha cambiado
git diff --stat

# 4. Hacer commit con mensaje descriptivo
git add .
git commit -m "tipo: descripción breve del cambio"

# Tipos recomendados:
#   feat:  Nueva funcionalidad
#   fix:   Corrección de bug
#   refactor: Cambio de código sin cambiar funcionalidad
#   docs:  Cambios en documentación
#   style: Formato, CSS, espacios
#   chore: Tareas de mantenimiento

# 5. Subir cambios
git push
```

### Cómo hacer backups

```bash
# Backup de la base de datos
docker compose exec postgres pg_dump -U appuser reporte_obras > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de configuración
cp .env .env.backup
cp -r apiService/Infraestructura/Datos/config-centros/ config-centros-backup/

# Restaurar base de datos
cat backup_20260101.sql | docker compose exec -T postgres psql -U appuser reporte_obras
```

### Cómo evitar romper producción

| Regla | Explicación |
|---|---|
| **Nunca hagas `git push` sin verificar** | Siempre ejecuta `dotnet build` y `npm run check` antes |
| **Usa ramas para cambios grandes** | Crea una rama `feature/mi-cambio`, trabaja ahí, luego haz merge |
| **Prueba en local primero** | Siempre reproduce el error o prueba la feature en tu máquina |
| **Haz commits pequeños y frecuentes** | Es más fácil revertir un commit pequeño que uno enorme |
| **No subas secretos al repo** | `.env` está en `.gitignore` pero verifica con `git status` antes de commit |
| **Lee los logs después del deploy** | `docker compose logs --tail=50 api` para detectar errores temprano |

---

## 🔄 Actualización del proyecto

### Cambios de código

```bash
# Con Docker
git pull
cd infra
docker compose up --build -d

# Sin Docker
git pull
cd apiService && dotnet build
cd UI && npm install && npm run build
```

### Cambios en la base de datos

Cuando alguien añade una **migración de EF Core**, esta se ejecuta **automáticamente** al arrancar el backend gracias a esta línea en `Program.cs`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ContextoBaseDatos>();
    db.Database.Migrate();  // ← Aplica migraciones pendientes
}
```

Solo necesitas **reiniciar** el contenedor del backend:

```bash
docker compose restart api
# O si quieres reconstruir:
docker compose up --build -d api
```

### Limpiar todo y empezar de cero

⚠️ **Esto borra TODOS los datos. Solo para desarrollo o emergencias.**

```bash
cd infra
docker compose down -v   # Elimina contenedores y volúmenes
docker compose up --build -d  # Empieza de cero
```

---

## 🔧 Troubleshooting (errores comunes)

### Problemas de conexión a PostgreSQL

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` | PostgreSQL no está corriendo | `docker compose ps postgres` — si no aparece, `docker compose up -d postgres` |
| `role "appuser" does not exist` | El usuario no se creó | Revisa las variables `POSTGRES_USER` en docker-compose |
| `database "reporte_obras" does not exist` | La BD no se creó | Conéctate y créala: `docker compose exec postgres createdb -U appuser reporte_obras` |
| `password authentication failed` | Contraseña incorrecta | Verifica `DB_PASS` en `.env` y en docker-compose |
| `could not translate host name "postgres"` | Docker no resuelve el nombre | Revisa que `networks:` está configurado en docker-compose |

**Diagnóstico rápido:**

```bash
# Verificar que PostgreSQL está vivo
docker compose ps postgres

# Ver logs
docker compose logs postgres

# Probar conexión directa
docker compose exec postgres psql -U appuser -d reporte_obras -c "SELECT 1"
# → Si devuelve "1 row", la BD funciona
```

### Problemas con fotos / MinIO

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Access Denied` | Credenciales incorrectas | Verifica `STORAGE_ACCESS_KEY` y `STORAGE_SECRET_KEY` |
| `Bucket not found` | El bucket no existe | MinIO lo crea automáticamente si `PublicRead=true`, o créalo manual en http://localhost:9001 |
| Las fotos no se ven | La URL pública no es accesible | Revisa `STORAGE_URL` — debe ser accesible desde el navegador |
| No se pueden subir fotos | MinIO no está accesible desde el backend | Si es Docker, usa `http://minio:9000`. Si es local, `http://localhost:9000` |

**Diagnóstico rápido:**

```bash
# Verificar MinIO
docker compose ps minio
docker compose logs minio

# Probar acceso web
# Abrir http://localhost:9001 → login con minioadmin/minioadmin
```

### Problemas de CORS

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cross-Origin Request Blocked` | El backend no permite el origen del frontend | El backend ya tiene `AllowAnyOrigin()`, pero si el frontend está en un puerto distinto al esperado... |
| `No 'Access-Control-Allow-Origin' header` | La petición se bloquea antes de llegar al backend | Verifica que el backend está corriendo y accesible |

**Solución:** Revisa la URL que usa el frontend para llamar al backend. Está en `UI/src/lib/api-config.ts`. En local suele ser `http://localhost:5000/api`. Si cambiaste el puerto, actualiza esta configuración.

### Problemas de autenticación

| Síntoma | Causa probable | Solución |
|---|---|---|
| `401 Unauthorized` | Token inválido o expirado | Vuelve a iniciar sesión en `/admin` |
| `Sesión expirada` | Pasaron más de 8 horas | Aumenta `ADMIN_TOKEN_EXPIRATION_HOURS` en `.env` y reinicia |
| `Token inválido` | El `ADMIN_TOKEN_SECRET` cambió | Los tokens antiguos dejan de funcionar. Vuelve a hacer login |

### Problemas de build de Docker

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Error: No such file or directory` | Falta un archivo en el contexto de build | Asegúrate de ejecutar `docker compose` desde `infra/` |
| `failed to solve: process ...` | Error de compilación | `docker compose build --no-cache` para limpiar caché |
| `no space left on device` | Disco lleno | `docker system prune -a` para limpiar imágenes no usadas |
| `The command '...' returned a non-zero code` | Error en el Dockerfile | Revisa los logs completos del build |

**Diagnóstico rápido:**

```bash
# Ver espacio en disco
df -h

# Limpiar todo lo no usado por Docker
docker system prune -a

# Build sin caché
docker compose build --no-cache
```

### Problemas de TypeScript / Svelte

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cannot find name 'pdfMake'` | Falta la declaración global | Ya está en `app.d.ts`, pero si no: añade `declare var pdfMake: any;` |
| `Property '$state' does not exist` | Svelte 5 runes no activadas | Verifica `svelte.config.js` → `compilerOptions.runes` |
| `Cannot use 'bind:' with this property` | Falta `$bindable()` en la prop | Añade `prop = $bindable()` en el componente hijo |
| `Parameter implicitly has 'any' type` | Falta tipar un callback | Añade el tipo al parámetro: `(item: MiTipo) => ...` |

**Diagnóstico rápido:**

```bash
cd UI
npm run check
# Muestra todos los errores con archivo y línea
```

### Problemas de rendimiento

| Síntoma | Causa probable | Solución |
|---|---|---|
| La app va lenta al cargar muchos informes | El dashboard carga todos los informes de golpe | Revisar si hay paginación en el backend |
| Las fotos tardan en subir | Las imágenes no se comprimen | `foto-manager.svelte.ts` ya comprime, verificar que se llama antes de subir |
| El PDF tarda en generarse | pdfmake procesa muchas tareas | Es normal si el informe tiene +100 tareas. Paciencia. |

---

## ✅ Buenas prácticas

### Backend (.NET)

| Práctica | Por qué |
|---|---|
| **No guardes secretos en `appsettings.json`** | Usa `.env` o variables de entorno para contraseñas y claves |
| **Usa `Endpoint.EsAdmin()` en nuevos endpoints admin** | Sin esta verificación, cualquiera podría acceder a funciones administrativas |
| **Mantén los DTOs sincronizados con las entidades** | Los DTOs en `EndpointHelpers.cs` deben reflejar los campos de las entidades |
| **No elimines migraciones antiguas** | Las migraciones son el historial de cambios de la BD. Nunca las borres |
| **Usa `async/await` en todos los endpoints** | Las operaciones de BD y red deben ser asíncronas para no bloquear el servidor |
| **Verifica `dotnet build` antes de cada commit** | 0 errores es el estándar |

### Frontend (Svelte)

| Práctica | Por qué |
|---|---|
| **Usa `$state()` para estado reactivo** | En Svelte 5, `$state` reemplaza a las variables reactivas `let` |
| **Usa `$derived()` para valores calculados** | Se recalculan automáticamente cuando cambian sus dependencias |
| **Usa `$bindable()` para props que necesitan `bind:`** | Sin esto, no se puede usar `bind:prop` desde el padre |
| **Ejecuta `npm run check` antes de commit** | Garantiza 0 errores de TypeScript |
| **Usa los barrel exports (`index.ts`)** | Simplifican los imports: `'$lib/services'` en vez de rutas largas |
| **Las fotos se comprimen antes de subir** | Ver `foto-manager.svelte.ts` — la compresión se hace automáticamente |
| **No modifiques `node_modules/` ni `.svelte-kit/`** | Son directorios generados, cualquier cambio se pierde al hacer `npm install` |

### General

| Práctica | Por qué |
|---|---|
| **Commits pequeños y descriptivos** | Facilitan el revert y el code review |
| **Un cambio = un commit** | No mezcles correcciones con nuevas features |
| **Nunca subas el `.env` al repo** | Contiene secretos. `.gitignore` ya lo excluye |
| **Documenta los cambios importantes** | Un README desactualizado es peor que no tener README |
| **Prueba en local antes de desplegar** | Siempre reproduce el entorno de producción localmente |

---

## 🔒 Seguridad

### Autenticación

El sistema usa **HMAC-SHA256** para generar y validar tokens de administración:

1. El usuario envía su contraseña a `POST /api/admin/login`
2. El backend verifica contra `Admin:Password` (configurado en `.env`)
3. Si es correcta, genera un token con:
   - **Payload**: `admin|{timestamp_expiracion}`
   - **Firma**: `HMAC-SHA256(payload, Admin:TokenSecret)`
   - **Codificación**: Base64
4. El token se envía al frontend y se guarda en `sessionStorage`
5. Cada petición admin lleva el token en `Authorization: Bearer {token}`
6. El backend valida la firma y la expiración en cada request

### Protección de datos

| Medida | Implementación |
|---|---|
| **Contraseñas** | No se almacenan en BD — solo se compara contra variable de entorno |
| **Tokens** | No tienen refresh token ni sesión persistente en servidor |
| **Fotos** | Se almacenan en MinIO con URLs públicas (configurable) |
| **SQL Injection** | Prevenido por EF Core (parametriza todas las consultas) |
| **XSS** | Prevenido por Svelte (escapa HTML automáticamente) |
| **CORS** | Actualmente `AllowAnyOrigin()` — restringir en producción |
| **HTTPS** | No implementado en el backend — usar reverse proxy |

### Checklist de seguridad

- [ ] **Cambiar `ADMIN_PASSWORD`** del valor por defecto `1234`
- [ ] **Cambiar `ADMIN_TOKEN_SECRET`** por un valor aleatorio (mínimo 32 caracteres)
- [ ] **Configurar HTTPS** con nginx/caddy + Let's Encrypt
- [ ] **Restringir CORS** a orígenes específicos
- [ ] **Revisar quién tiene acceso** al servidor y al repositorio
- [ ] **Backups automáticos** de la base de datos y MinIO
- [ ] **Monitoreo de logs** — detectar accesos no autorizados

---

## ⚡ Rendimiento

| Aspecto | Estado actual | Recomendación |
|---|---|---|
| **Carga inicial** | Buena — SPA estática con build optimizado | ✅ |
| **Consultas a BD** | Aceptable — EF Core con carga lazy | 🟡 Considerar eager loading en listados grandes |
| **Subida de fotos** | Buena — compresión en cliente antes de subir | ✅ |
| **Generación de PDF** | Correcta — pdfmake en cliente, sin carga al servidor | ✅ |
| **Dashboard** | Correcto para ~100 informes | 🟡 Considerar paginación si crece mucho |
| **Imágenes Docker** | ~500MB cada imagen | 🟡 Usar alpine, multi-stage ya implementado |
| **Caché** | No implementada | 🟡 Añadir Redis o caché en memoria para configs |

---

## ❓ FAQ (Preguntas frecuentes)

### Generales

**¿Puedo usar esto sin Docker?**  
Sí. Necesitas PostgreSQL 16 y MinIO instalados manualmente, Node.js 20+ y .NET 10 SDK. Sigue la [Opción B de instalación local](#opción-b-desarrollo-sin-docker).

**¿Funciona offline?**  
La PWA almacena en caché los archivos estáticos, pero los datos (informes, configuraciones) requieren conexión al backend. Sin conexión no se puede trabajar.

**¿Se puede instalar en un móvil?**  
Sí. Abre la URL en Chrome/Safari y verás la opción "Añadir a pantalla de inicio" o "Instalar app". La PWA se comporta como una app nativa.

**¿Cuántos centros soporta?**  
Actualmente 13 centros configurados. Puedes añadir más:
1. Subiendo un Excel con la nueva configuración vía panel admin
2. O creando un archivo JSON manualmente en `apiService/Infraestructura/Datos/config-centros/`

**¿Puedo exportar los datos a Excel?**  
Sí. Desde el panel admin puedes descargar el Excel actual (`GET /api/admin/export`) o subir uno nuevo para actualizar las configuraciones.

### Técnicas

**¿Qué puertos usa cada servicio?**

| Servicio | Puerto (host) | Puerto (contenedor) |
|---|---|---|
| Frontend (dev) | 5173 | — |
| Frontend (Docker) | 80 | 80 |
| Backend (dev) | 8081 | — |
| Backend (Docker) | 5000 | 8080 |
| PostgreSQL | 5433 | 5432 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 9001 |

**¿Cómo se configura la URL de la API?**  
El frontend detecta automáticamente la URL en `UI/src/lib/api-config.ts`. Usa `localhost:5000` en local y la URL de ngrok en producción (configurable).

**¿Qué pasa con los datos si actualizo el código?**  
Los datos NO se pierden. La base de datos y las fotos están en volúmenes Docker separados. Solo se reconstruyen las imágenes de `api` y `ui`.

**¿Cómo hago backup de la base de datos?**  
```bash
docker compose exec postgres pg_dump -U appuser reporte_obras > backup.sql
```

**¿Cómo restauro un backup?**  
```bash
cat backup.sql | docker compose exec -T postgres psql -U appuser reporte_obras
```

### Errores comunes

**Error: "Cannot find name 'pdfMake'"**  
Añade `declare var pdfMake: any;` en `UI/src/app.d.ts`. Ya debería estar, pero si no, añádelo.

**Error: "No se puede conectar a PostgreSQL"**  
```bash
docker compose logs postgres
docker compose exec postgres psql -U appuser -d reporte_obras
```

**Error: "Las fotos no se ven"**  
Verifica que MinIO está corriendo y que `STORAGE_URL` es accesible desde el navegador.

**Error: "Token inválido"**  
El token expiró (por defecto 8 horas). Vuelve a iniciar sesión en el panel admin.

---

## 📦 Checklist pre-producción

Usa esta lista antes de poner la aplicación en producción:

### 🔐 Seguridad
- [ ] `ADMIN_PASSWORD` cambiado (no `1234`)
- [ ] `ADMIN_TOKEN_SECRET` cambiado por valor aleatorio
- [ ] `STORAGE_SECRET_KEY` cambiado
- [ ] `DB_PASS` cambiado
- [ ] HTTPS configurado (certbot + nginx)
- [ ] CORS restringido a orígenes específicos
- [ ] `.env` no está en el repo

### 🐳 Docker
- [ ] `.dockerignore` creado (excluir bin/, obj/, node_modules/)
- [ ] Imágenes Docker optimizadas (multi-stage ya implementado)
- [ ] Volúmenes persistentes configurados
- [ ] `restart: unless-stopped` en todos los servicios

### 📊 Datos
- [ ] Backup automático de PostgreSQL configurado (cron + pg_dump)
- [ ] Backup de MinIO configurado
- [ ] Migraciones aplicadas (se aplican solas al arrancar)

### 🧪 Testing
- [ ] `npm run check` — 0 errores
- [ ] `dotnet build` — 0 errores
- [ ] Login admin funciona
- [ ] Crear informe funciona
- [ ] Guardar y recuperar informe funciona
- [ ] Subir fotos funciona
- [ ] Generar PDF funciona
- [ ] Panel admin funciona

### 🚀 Deploy
- [ ] Variables de entorno configuradas en producción
- [ ] URL de API apunta al servidor correcto
- [ ] Puertos abiertos en firewall (80, 443, 5000 si es necesario)
- [ ] Logs monitorizados
- [ ] CI/CD configurado (GitHub Actions, Vercel, etc.)

### 📋 Documentación
- [ ] README actualizado
- [ ] Variables de entorno documentadas
- [ ] Persona de contacto para incidencias definida

---

## 🤝 Cómo contribuir

1. **Haz fork** del repositorio
2. **Crea una rama** para tu cambio: `git checkout -b feature/mi-mejora`
3. **Haz tus cambios** siguiendo las buenas prácticas de este documento
4. **Verifica** que `npm run check` y `dotnet build` dan 0 errores
5. **Haz commit**: `git commit -m "feat: descripción clara del cambio"`
6. **Sube la rama**: `git push origin feature/mi-mejora`
7. **Abre un Pull Request** describiendo qué cambia y por qué

---

## 📄 Licencia

Este proyecto es de uso interno de GTM. Todos los derechos reservados.

---

## 🧠 Glosario

| Término | Significado |
|---|---|
| **Cuatrimestre** | Período de 4 meses (1Q, 2Q, 3Q). Cada centro se inspecciona una vez por cuatrimestre. |
| **Sección** | Grupo de tareas dentro de un informe (ej: "Bombeo", "Químicos", "Soplantes"). |
| **Tarea** | Elemento individual a revisar dentro de una sección (ej: "Comprobar presión de bomba"). |
| **Subtarea** | Sub-elemento dentro de una tarea con subtareas (ej: tarea "Bombas 1-2-3" con subtareas para cada bomba). |
| **OK / NO OK** | Estado de una tarea: correcta o incorrecta. |
| **REV (Rev)** | Marca que indica que la tarea requiere revisión especial. |
| **Sin Check** | Tarea informativa que no requiere marcar OK/NO OK (solo es una observación). |
| **MinIO** | Almacenamiento de objetos compatible con S3 (como AWS S3 pero auto-gestionado). |
| **PWA** | Progressive Web App — aplicación web que se puede instalar como app nativa. |
| **Runes** | Sistema de reactividad de Svelte 5 (`$state`, `$derived`, `$effect`, `$props`). |
| **SPA** | Single Page Application — toda la UI se carga una vez y navega sin recargar. |
| **SSR** | Server-Side Rendering — la app se renderiza en el servidor. En este proyecto está desactivado. |
| **HMAC** | Hash-based Message Authentication Code — algoritmo para firmar y verificar mensajes. |
| **Upsert** | Operación que crea un registro si no existe o lo actualiza si ya existe (INSERT + UPDATE). |
| **ClosedXML** | Librería .NET para leer y escribir archivos Excel (.xlsx) sin necesidad de Excel instalado. |

---

<p align="center">
  <sub>Hecho con ❤️ para GTM — Mantenimiento de Centros </sub>

</p>
