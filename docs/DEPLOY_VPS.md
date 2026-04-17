# Guía de despliegue en VPS

Esta guía asume un VPS Linux con Ubuntu 22.04 o similar, dominio propio, Node.js 20+ y Nginx.

## 1. Requisitos previos

- Dominio apuntando al VPS.
- Usuario con permisos `sudo`.
- Node.js 20 o superior.
- `npm`, `git`, `nginx` y `pm2`.

Instalación base recomendada:

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Clonar el proyecto

```bash
git clone TU_REPOSITORIO soluciones-tic
cd soluciones-tic
npm install
```

## 3. Configurar variables de entorno

### Backend

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Configura al menos:

- `PORT=4000`
- `FRONTEND_ORIGIN=https://tudominio.com`
- `ADMIN_USERNAME=tu-usuario`
- `ADMIN_PASSWORD=una-clave-larga`
- `TOKEN_SECRET=otra-clave-muy-larga`

### Frontend

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Configura:

- `PUBLIC_SITE_URL=https://tudominio.com`
- `PUBLIC_API_BASE_URL=https://tudominio.com`
- `API_SERVER_URL=http://127.0.0.1:4000`

## 4. Construir el frontend

```bash
npm run build
```

El backend no necesita build adicional.

## 5. Levantar con PM2

Desde la raíz del proyecto:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Verifica:

```bash
pm2 status
pm2 logs soluciones-tic-backend
pm2 logs soluciones-tic-frontend
```

## 6. Configurar Nginx

Crea un archivo como:

```bash
sudo nano /etc/nginx/sites-available/solucionestic
```

Contenido base:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:4000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
    }

    location /placeholders/ {
        proxy_pass http://127.0.0.1:4000/placeholders/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

Activa la configuración:

```bash
sudo ln -s /etc/nginx/sites-available/solucionestic /etc/nginx/sites-enabled/solucionestic
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Activar HTTPS

Si usarás Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

## 8. Cómo editar el sitio después

1. Entra a `https://tudominio.com/admin`
2. Inicia sesión con el usuario configurado en `backend/.env`
3. Edita textos, botones, artículos e imágenes
4. Guarda desde cada bloque

No necesitas volver a compilar por cada cambio de contenido.

## 9. Qué respaldar

Haz backup frecuente de:

- `backend/storage/content`
- `backend/storage/uploads`
- `backend/.env`
- `frontend/.env`

## 10. Actualizaciones futuras

Cuando subas nuevo código:

```bash
git pull
npm install
npm run build
pm2 restart soluciones-tic-backend
pm2 restart soluciones-tic-frontend
```

## 11. Enlaces de soporte sembrados en el proyecto

El centro de soporte quedó inicializado con estas páginas oficiales:

- [AnyDesk Install](https://support.anydesk.com/install-anydesk)
- [Hikvision SADP](https://www.hikvision.com/us-en/support/tools/hitools/clea8b3e4ea7da90a9/)
- [Hikvision iVMS-4200](https://www.hikvision.com/en/support/download/software/ivms4200-series/)
