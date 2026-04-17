# Soluciones TIC

Sitio comercial para captación de clientes, enfocado en videovigilancia IP, con panel administrativo para editar textos e imágenes sin tocar código.

## Stack

- `frontend/`: Astro SSR + componentes React para las partes interactivas
- `backend/`: Express para contenido editable, autenticación simple y subida de imágenes
- `shared/`: contenido por defecto compartido entre frontend y backend

## Qué incluye

- Home comercial enfocada en CCTV IP
- Comparador de resolución `2MP vs 4MP / 8MP`
- Calculadora profesional de almacenamiento CCTV
- Módulos de ColorVu / Full Color y videoporteros IP
- Páginas SEO para redes, servidores, blog técnico y soporte
- Panel `/admin` para editar textos, imágenes, mensajes y marcas

## Estructura clave

```text
/frontend
  /public
  /src
    /components
    /layouts
    /lib
    /pages
    /styles
/backend
  /public
    /branding
    /placeholders
  /src
  /storage
    /content
    /uploads
/shared
  content-defaults.js
```

## Desarrollo local

1. Instala dependencias:

```bash
npm install
```

2. Crea los archivos de entorno:

- `backend/.env`
- `frontend/.env`

Usa como base:

- `backend/.env.example`
- `frontend/.env.example`

3. Para desarrollo:

```bash
npm run dev
```

Nota: si solo quieres probar una versión estable local, compila y usa la versión productiva:

```bash
npm run build
npm run start:backend
npm run start:frontend
```

## Rutas locales

- Frontend: `http://localhost:4321`
- Backend: `http://localhost:4000`
- Admin: `http://localhost:4321/admin`

## Contenido editable

El contenido vivo se guarda en:

- `backend/storage/content`
- `backend/storage/uploads`

Esas rutas están ignoradas por Git a propósito. Cuando faltan archivos, el backend reconstruye la base desde:

- `shared/content-defaults.js`

## Assets versionados

Los assets de marca que sí deben viajar en el repo están en:

- `frontend/public`
- `backend/public/branding`
- `backend/public/placeholders`

## Despliegue

La guía de VPS está en:

- `docs/DEPLOY_VPS.md`

El proyecto también incluye configuración base para PM2 en:

- `ecosystem.config.cjs`
