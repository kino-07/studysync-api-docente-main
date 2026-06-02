# StudySync API

API REST para coordinar grupos de estudio universitarios.  
**Programación IV — UPDS 2026 · M.Sc. Jimmy Nataniel Requena Llorentty**

**Producción:** https://studysync-api-a5o9.onrender.com  
**Swagger UI:** https://studysync-api-a5o9.onrender.com/api-docs  
**Repositorio:** https://github.com/bolivianotech/studysync-api

---

## Stack tecnológico

| Tecnología | Propósito |
|---|---|
| Node.js 20 + Express v5 | Servidor HTTP y rutas REST |
| Prisma ORM v6 | Acceso type-safe a PostgreSQL |
| Supabase | PostgreSQL gestionado en la nube (gratis) |
| Redis / Upstash | Pub/Sub para eventos en tiempo real |
| Socket.io v4 | WebSockets hacia el navegador |
| JWT + bcryptjs | Autenticación sin estado |
| Helmet | 12 headers de seguridad HTTP |
| CORS + express-rate-limit | Seguridad y control de tráfico |
| Swagger / OpenAPI 3.0 | Documentación interactiva |
| CloudFormation + LocalStack | Infrastructure as Code (IaC) |
| Render.com | Deploy automático desde GitHub |

---

## Requisitos previos

- [Node.js 20+](https://nodejs.org)
- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (para LocalStack)
- Cuenta gratuita en [Supabase](https://supabase.com)
- Cuenta gratuita en [Upstash](https://upstash.com)
- VS Code con extensión [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)

---

## Instalación local — paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/bolivianotech/studysync-api.git
cd studysync-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo .env

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
# Windows PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Edita `.env` con tus valores reales (ver sección de variables más abajo).

### 4. Configurar Supabase

1. Entra a [supabase.com](https://supabase.com) → **New Project**
2. Anota el **Database Password** que elijas
3. Ve a **Settings → Database → Connection string**
4. Copia la URL de **Transaction pooler** (puerto 6543) → `DATABASE_URL`
5. Copia la URL de **Session mode** (puerto 5432) → `DIRECT_URL`

> **Importante:** agrega `?pgbouncer=true&connection_limit=1` al final del `DATABASE_URL`

### 5. Configurar Upstash Redis

1. Entra a [upstash.com](https://upstash.com) → **Create Database** → tipo Redis
2. Copia la **REDIS_URL** (empieza con `rediss://`)

### 6. Completar el archivo .env

```env
PORT=3000
NODE_ENV=development

REDIS_URL=rediss://default:TOKEN@host.upstash.io:6379

DATABASE_URL=postgresql://postgres.PROYECTO:PASSWORD@aws-X.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.PROYECTO:PASSWORD@aws-X.pooler.supabase.com:5432/postgres

JWT_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=1h
```

### 7. Generar el cliente Prisma y crear las tablas

```bash
# Genera el cliente Prisma (necesario siempre después de npm install)
npm run build

# Crea las tablas en Supabase (solo la primera vez)
npx prisma db push
```

Si `db push` sale exitoso, verás en Supabase → Table Editor las tablas `usuarios` y `sesiones`.

### 8. Iniciar el servidor

```bash
npm run dev
```

Deberías ver:
```
═══════════════════════════════════════════
  StudySync API + WebSocket · puerto 3000
  Modo: development
  Docs: /api-docs
═══════════════════════════════════════════
✓ Redis Sub: conectado a Upstash
✓ Redis Pub: conectado a Upstash
```

---

## Verificación completa — 9 sesiones de 3 grupos

Sigue este flujo para demostrar que todo funciona correctamente.

### Paso 1 — Registrar 3 usuarios (uno por grupo)

Con Thunder Client o el Swagger en `http://localhost:3000/api-docs`:

**POST** `http://localhost:3000/auth/register`

```json
{ "nombre": "Ana Torres",    "email": "ana@estudio.bo",    "password": "grupo1pass" }
{ "nombre": "Carlos Mendez", "email": "carlos@estudio.bo", "password": "grupo2pass" }
{ "nombre": "Sofia Vargas",  "email": "sofia@estudio.bo",  "password": "grupo3pass" }
```

Respuesta esperada para cada uno — **201 Created** (sin el campo `password`):
```json
{
  "ok": true,
  "mensaje": "Usuario registrado exitosamente",
  "usuario": { "id": 1, "nombre": "Ana Torres", "email": "ana@estudio.bo" }
}
```

### Paso 2 — Login y obtener tokens JWT

**POST** `http://localhost:3000/auth/login`

```json
{ "email": "ana@estudio.bo", "password": "grupo1pass" }
```

Respuesta **200 OK** — copia el `token` de cada usuario:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { "id": 1, "nombre": "Ana Torres" }
}
```

Repite con Carlos y Sofia para obtener sus 3 tokens.

### Paso 3 — Crear 3 sesiones por grupo (9 en total)

Cada request debe incluir el header:
```
Authorization: Bearer <token_del_usuario>
```

**POST** `http://localhost:3000/api/sesiones`

**Grupo 1 — Ana Torres (Matemáticas):**
```json
{ "titulo": "Algebra Lineal — Matrices",      "materia": "Matematicas" }
{ "titulo": "Algebra Lineal — Vectores",      "materia": "Matematicas" }
{ "titulo": "Algebra Lineal — Examen parcial","materia": "Matematicas" }
```

**Grupo 2 — Carlos Méndez (Redes):**
```json
{ "titulo": "Redes — Modelo OSI",               "materia": "Redes de Computadoras" }
{ "titulo": "Redes — TCP/IP y subnetting",       "materia": "Redes de Computadoras" }
{ "titulo": "Redes — Cisco Packet Tracer",       "materia": "Redes de Computadoras" }
```

**Grupo 3 — Sofía Vargas (Programación IV):**
```json
{ "titulo": "Prog IV — Express REST API",        "materia": "Programacion IV" }
{ "titulo": "Prog IV — Prisma ORM y Supabase",   "materia": "Programacion IV" }
{ "titulo": "Prog IV — Redis PubSub y Socket.io","materia": "Programacion IV" }
```

Respuesta esperada — **201 Created** con el autor incluido:
```json
{
  "id": 1,
  "titulo": "Algebra Lineal — Matrices",
  "materia": "Matematicas",
  "completada": false,
  "autor": { "id": 1, "nombre": "Ana Torres", "email": "ana@estudio.bo" }
}
```

### Paso 4 — Verificar todas las sesiones

**GET** `http://localhost:3000/api/sesiones` (no requiere token)

Debes ver `"total": 9` con las 9 sesiones y sus autores. Verifica también en **Supabase → Table Editor → sesiones** que las 9 filas existen.

### Paso 5 — Verificar tiempo real

1. Abre `http://localhost:3000/login.html` en dos pestañas del navegador
2. En cada pestaña inicia sesión con un usuario diferente
3. Ambas deben mostrar el badge **🟢 Conectado**
4. Desde una pestaña crea una sesión — el feed de eventos se actualiza en **ambas pestañas instantáneamente**

### Paso 6 — Verificar seguridad JWT

```bash
# Sin token → debe devolver 401
POST http://localhost:3000/api/sesiones
Body: { "titulo": "Sin token" }
# Respuesta: 401 "Acceso denegado. Token no proporcionado."

# Token falso → debe devolver 401
Authorization: Bearer tokeninvalido
# Respuesta: 401 "Token inválido."
```

### Paso 7 — Verificar headers de seguridad (Helmet)

Abre DevTools (F12) → Network → clic en cualquier request → Response Headers.  
Deben aparecer: `x-frame-options`, `x-content-type-options`, `cross-origin-opener-policy`, `referrer-policy`.

---

## Infrastructure as Code con LocalStack

```bash
# 1. Asegúrate de que Docker Desktop esté corriendo

# 2. Levantar LocalStack
docker run -d -p 4566:4566 --name localstack localstack/localstack

# 3. Instalar el wrapper de AWS CLI
pip install awscli awscli-local

# 4. Validar el template
awslocal cloudformation validate-template \
  --template-body file://cloudformation/template.yaml

# 5. Desplegar el stack (crea S3 + DynamoDB + SSM)
awslocal cloudformation create-stack \
  --stack-name studysync-api \
  --template-body file://cloudformation/template.yaml \
  --parameters ParameterKey=Ambiente,ParameterValue=development

# 6. Verificar los 3 recursos creados
awslocal cloudformation describe-stack-resources \
  --stack-name studysync-api --output table

# 7. Probar S3
awslocal s3 ls
awslocal s3 cp cloudformation/template.yaml s3://studysync-adjuntos-development/docs/

# 8. Probar DynamoDB
awslocal dynamodb scan --table-name studysync-eventos-development

# 9. Probar SSM
awslocal ssm get-parameter --name "/studysync/development/api-url"
```

---

## Deploy en Render

1. Haz fork del repositorio en tu GitHub
2. Entra a [render.com](https://render.com) → **New Web Service** → conecta tu repo
3. Configura:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. Agrega las variables de entorno (NO agregues `PORT`):

| Variable | Dónde obtenerla |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Cualquier cadena larga y aleatoria |
| `JWT_EXPIRES_IN` | `1h` |
| `REDIS_URL` | Dashboard de Upstash |
| `DATABASE_URL` | Supabase → Settings → Database (con `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Supabase → Settings → Database (puerto 5432, sin parámetros extra) |

5. Haz clic en **Deploy** — Render desplegará automáticamente en cada push a `main`

> **Nota:** El tier gratuito de Render pausa el servicio tras 15 minutos de inactividad. El primer request tarda 50-60 segundos en despertar — es normal.

---

## Endpoints

### Autenticación (públicos)

| Método | Ruta | Body requerido |
|---|---|---|
| POST | `/auth/register` | `nombre`, `email`, `password` |
| POST | `/auth/login` | `email`, `password` |

### Sesiones (GET público, escritura requiere JWT)

| Método | Ruta | Auth |
|---|---|---|
| GET | `/api/sesiones` | No |
| GET | `/api/sesiones/:id` | No |
| POST | `/api/sesiones` | Bearer token |
| PUT | `/api/sesiones/:id` | Bearer token |
| DELETE | `/api/sesiones/:id` | Bearer token |

---

## Estructura del proyecto

```
studysync-api/
├── cloudformation/
│   ├── template.yaml          # IaC: S3 + DynamoDB + SSM
│   └── evento-prueba.json     # Dato de prueba para DynamoDB
├── prisma/
│   └── schema.prisma          # Modelos Usuario y Sesion
├── public/
│   ├── index.html             # Panel principal (requiere login)
│   ├── login.html             # Formulario de login
│   ├── register.html          # Formulario de registro
│   └── app.css                # Estilos globales
├── src/
│   ├── app.js                 # Express + middlewares globales
│   ├── server.js              # HTTP server + Socket.io
│   ├── db.js                  # Singleton PrismaClient
│   ├── controllers/
│   │   └── sesionesController.js
│   ├── middlewares/
│   │   └── autenticar.js      # Verificación de JWT
│   ├── redis/
│   │   └── client.js          # Conexiones pub y sub separadas
│   ├── routes/
│   │   ├── auth.js            # /auth/register y /auth/login
│   │   └── sesiones.js        # CRUD /api/sesiones
│   ├── subscribers/
│   │   └── notificaciones.js  # Redis → Socket.io
│   └── swagger/
│       └── config.js          # Especificación OpenAPI 3.0
├── BUGS.md                    # Registro de defectos (IEEE 829)
├── .env.example               # Plantilla de variables de entorno
├── .gitignore
└── package.json
```

---

## Bugs conocidos y resueltos

Ver [BUGS.md](./BUGS.md) para el historial completo. Bugs documentados:

| ID | Descripción | Estado |
|---|---|---|
| BUG-001 | POST devuelve 500 sin `Content-Type: application/json` | Resuelto |
| BUG-002 | Render "Port scan timeout" por PORT fijo | Resuelto |
| BUG-003 | Anuncios comerciales de dotenv v17 en logs | Resuelto |
| BUG-004 | Helmet bloquea `onclick` (CSP `script-src-attr`) | Resuelto |
| BUG-005 | Prisma error 42P05 con pgBouncer de Supabase | Resuelto |

---

*Programación IV — UPDS 2026*
