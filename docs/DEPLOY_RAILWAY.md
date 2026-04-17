# Despliegue en Railway

Esta es la ruta correcta para publicar el proyecto y dejarlo visible en internet usando Railway.

## Como queda montado

El proyecto necesita `2 servicios`:

1. `frontend`
   Atiende la web publica y el panel `/admin`.
2. `backend`
   Atiende la API, login del admin, subida de imagenes y contenido editable.

Tambien necesitas `1 volume` conectado al `backend`, porque el contenido editable y las imagenes se guardan en disco.

## Antes de empezar

Tu codigo ya esta en GitHub:

- [Repositorio](https://github.com/jdgz2206/soluciones-tic)

## Paso 1. Crear el proyecto en Railway

1. Entra a Railway.
2. Crea un proyecto nuevo desde GitHub.
3. Selecciona el repo `jdgz2206/soluciones-tic`.
4. Si Railway detecta el monorepo automaticamente, deja que cree los servicios.
5. Si no lo hace, crea dos servicios manuales usando el mismo repositorio: uno para `frontend` y otro para `backend`.

Railway documenta el soporte para monorepos y comandos separados por servicio aqui:

- [Deploying a Monorepo](https://docs.railway.com/deployments/monorepo)

## Paso 2. Configurar el servicio backend

En el servicio `backend`, deja estos comandos:

- Build Command:

```bash
npm install
```

- Start Command:

```bash
npm run start -w backend
```

Variables recomendadas:

```env
HOST=0.0.0.0
PORT=${{PORT}}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=cambia-esta-clave
TOKEN_SECRET=cambia-esta-clave-super-segura
TOKEN_TTL_MINUTES=720
MAX_UPLOAD_MB=10
```

No pongas `STORAGE_ROOT` si vas a usar Volume. El backend ya esta preparado para usar automaticamente `RAILWAY_VOLUME_MOUNT_PATH` cuando exista.

## Paso 3. Agregar el Volume al backend

1. Abre el servicio `backend`.
2. Agrega un `Volume`.
3. Montalo en cualquier ruta, por ejemplo:

```text
/data/soluciones-tic
```

El backend ya esta preparado para usar esa ruta persistente automaticamente.

Referencia oficial:

- [Using Volumes](https://docs.railway.com/guides/volumes)

## Paso 4. Configurar el servicio frontend

En el servicio `frontend`, usa estos comandos:

- Build Command:

```bash
npm install && npm run build -w frontend
```

- Start Command:

```bash
npm run start -w frontend
```

Variables iniciales:

```env
PUBLIC_SITE_URL=https://AQUI-VA-TU-DOMINIO-DEL-FRONTEND
PUBLIC_API_BASE_URL=https://AQUI-VA-TU-DOMINIO-DEL-BACKEND
API_SERVER_URL=https://AQUI-VA-TU-DOMINIO-DEL-BACKEND
```

Nota:

- `PUBLIC_API_BASE_URL` lo usa el navegador
- `API_SERVER_URL` lo usa Astro en SSR

## Paso 5. Generar dominio publico del backend

1. En `backend` entra a `Settings`.
2. Ve a `Networking -> Public Networking`.
3. Haz clic en `Generate Domain`.
4. Copia la URL generada.

Railway documenta este flujo aqui:

- [Public Networking](https://docs.railway.com/guides/public-networking)
- [Working with Domains](https://docs.railway.com/networking/domains/working-with-domains)

## Paso 6. Terminar variables cruzadas

Cuando ya tengas el dominio del backend:

### En frontend

```env
PUBLIC_API_BASE_URL=https://TU-BACKEND.up.railway.app
API_SERVER_URL=https://TU-BACKEND.up.railway.app
```

### En backend

```env
FRONTEND_ORIGIN=https://TU-FRONTEND.up.railway.app
```

Si luego usas dominio propio, cambia esas variables por tus dominios reales.

## Paso 7. Generar dominio publico del frontend

1. En `frontend` entra a `Settings`.
2. Ve a `Networking -> Public Networking`.
3. Haz clic en `Generate Domain`.
4. Copia la URL generada.

Ahora vuelve al `backend` y pon esa URL en `FRONTEND_ORIGIN`.

## Paso 8. Redeploy

Despues de guardar variables:

1. Despliega primero `backend`.
2. Luego despliega `frontend`.

## Paso 9. Verificaciones

Debes comprobar:

- `https://tu-frontend.up.railway.app`
- `https://tu-frontend.up.railway.app/admin`
- `https://tu-backend.up.railway.app/api/health`

## Cuando ya tengas dominio propio

La estructura recomendada es:

- `www.tudominio.com` -> frontend
- `api.tudominio.com` -> backend

Railway gestiona dominios publicos y certificados SSL automaticamente cuando configuras el dominio.

## Variables finales sugeridas

### Backend

```env
HOST=0.0.0.0
PORT=${{PORT}}
FRONTEND_ORIGIN=https://www.tudominio.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=una-clave-larga
TOKEN_SECRET=otra-clave-larga
TOKEN_TTL_MINUTES=720
MAX_UPLOAD_MB=10
```

### Frontend

```env
PUBLIC_SITE_URL=https://www.tudominio.com
PUBLIC_API_BASE_URL=https://api.tudominio.com
API_SERVER_URL=https://api.tudominio.com
```

## Que ya quedo preparado en el codigo

- El `backend` ya acepta almacenamiento persistente mediante `STORAGE_ROOT` o `RAILWAY_VOLUME_MOUNT_PATH`.
- El `backend` ya escucha por defecto en `0.0.0.0`.
- El `frontend` ya fuerza `HOST=0.0.0.0` al arrancar.
- El proyecto ya esta en GitHub y listo para importar en Railway.
