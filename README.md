# Soluciones TIC

Sitio comercial para captacion de clientes, enfocado en videovigilancia IP, con panel administrativo para editar textos e imagenes sin tocar codigo.

## Stack

- `frontend/`: Astro SSR + componentes React para las partes interactivas
- `backend/`: Express para contenido editable, autenticacion simple y subida de imagenes
- `shared/`: contenido por defecto compartido entre frontend y backend

## Que incluye

- Home comercial enfocada en CCTV IP
- Comparador de resolucion `2MP vs 4MP / 8MP`
- Calculadora profesional de almacenamiento CCTV
- Modulos de ColorVu / Full Color y videoporteros IP
- Paginas SEO para redes, servidores, blog tecnico y soporte
- Panel `/admin` para editar textos, imagenes, mensajes y marcas

## Estructura

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

4. Para correr una version estable local:

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

Esas rutas estan ignoradas por Git a proposito. Cuando faltan archivos, el backend reconstruye la base desde:

- `shared/content-defaults.js`

## Assets versionados

Los assets de marca que si deben viajar en el repo estan en:

- `frontend/public`
- `backend/public/branding`
- `backend/public/placeholders`

## Despliegue

- VPS: `docs/DEPLOY_VPS.md`
- Railway: `docs/DEPLOY_RAILWAY.md`

## Nota importante sobre Railway

Para que las imagenes subidas y el contenido editado no se pierdan en Railway, el servicio `backend` debe tener un `Volume` adjunto. Railway documenta que los volumes son la forma de persistir datos entre reinicios y despliegues.

Fuentes oficiales:

- [Railway Volumes](https://docs.railway.com/guides/volumes)
- [Railway Monorepo](https://docs.railway.com/deployments/monorepo)
- [Railway Public Networking](https://docs.railway.com/guides/public-networking)
