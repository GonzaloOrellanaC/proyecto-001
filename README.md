# Punto de Venta (POS) – Monorepo

Monorepo con tres paquetes:
- `client/` – App web/móvil con Ionic React (Vite + TypeScript)
- `api/` – API REST con Node.js (Express + Mongoose + TypeScript)
- `blockchain/` – Librería TS de utilidades de trazabilidad

Este documento explica cómo instalar y ejecutar el proyecto en desarrollo (Windows/PowerShell), variables de entorno, puertos y solución de problemas comunes.

## Requisitos
- Node.js 18+ y npm 9+
- MongoDB local (por defecto: mongodb://localhost:27017/pv)
- PowerShell (Windows)
- Opcional móvil: Ionic CLI (`npm i -g @ionic/cli`)

## Instalación

```powershell
# Desde la raíz del repo
npm install
```

## Variables de entorno

Crea `api/.env` (mínimo):

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/pv
# Opcional: seed de super admin (si el código lo usa)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

Crea `client/.env` o `client/.env.local`:

```
VITE_API_URL=http://localhost:4000
# Puerto opcional del dev server; si está ocupado, Vite probará el siguiente libre
VITE_PORT=6000
```

Notas de puertos:
- Algunos navegadores bloquean `http://localhost:6000` por seguridad. Si no abre, usa `VITE_PORT=5173` (recomendado) o un puerto diferente.
- El cliente lee `VITE_PORT` (o `PORT`) y, con la configuración actual, intentará el siguiente puerto libre si el elegido está ocupado.

## Ejecutar en desarrollo

Levantar todo (API + Client + Blockchain) desde la raíz del monorepo:

```powershell
npm run dev
```

Ejecutar por servicio:

```powershell
# API (watch)
npm --workspace api run dev

# Client (forzando puerto 5173 en PowerShell)
$env:VITE_PORT=5173; npm --workspace client run dev

# Blockchain (librería en watch)
npm --workspace blockchain run dev
```

Una vez iniciado:
- API: http://localhost:4000
- Client: la consola de Vite mostrará el puerto final (por ejemplo http://localhost:5173)

## Tests y Lint

```powershell
# API tests
npm --workspace api run test
npm --workspace api run test:ui  # modo UI interactivo

# Client unit tests
npm --workspace client run test.unit

# Client e2e (Cypress)
npm --workspace client run test.e2e

# Lint
npm --workspace api run lint
npm --workspace client run lint
npm --workspace blockchain run lint
```

## Build/Producción

```powershell
# API
npm --workspace api run build
npm --workspace api start

# Client
npm --workspace client run build
npm --workspace client run preview

# Blockchain
npm --workspace blockchain run build
```

## Estructura de carpetas

```
punto-venta/
├─ api/          # Express + TS (+ .env: PORT, MONGODB_URI, ADMIN_*)
├─ client/       # Ionic React + Vite (+ .env: VITE_API_URL, VITE_PORT)
├─ blockchain/   # Librería TS
└─ package.json  # Workspaces y scripts raíz
```

## Solución de problemas

- El cliente no abre en `http://localhost:6000`
  - `6000` puede estar bloqueado por el navegador. Define `VITE_PORT=5173` y vuelve a iniciar el client.

- El cliente indica que el puerto está ocupado
  - Con la configuración actual, Vite intentará el siguiente puerto automáticamente. Revisa la consola para ver el puerto efectivo.

- Error de conexión a MongoDB en la API
  - Asegúrate de tener MongoDB corriendo localmente o ajusta `MONGODB_URI` en `api/.env`.

- La API no reconoce el super admin por defecto
  - Si el proyecto siembra un super admin con `ADMIN_EMAIL`/`ADMIN_PASSWORD`, define esas variables en `api/.env`.

- CORS/Conexión desde el client
  - Verifica que `VITE_API_URL` apunta a `http://localhost:4000` (o donde tengas la API) y que la API esté levantada.

## Notas
- El cliente usa Axios con interceptor de JWT y persiste el token en localStorage.
- UI dividida en Dashboard y páginas: Organizaciones, Tiendas, Productos, Usuarios, Roles.
- El rol “admin” usa su organización por defecto; el “super admin” puede seleccionar organización.
