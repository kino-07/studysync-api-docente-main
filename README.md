📚 Biblioteca API
Sistema de Registro y Seguimiento de Préstamos de Biblioteca
Programación IV — UPDS 2026
🌐 URLs del Sistema
Recurso	URL
Panel Admin	https://studysync-api-prv0.onrender.com/index.html
Registro	https://studysync-api-prv0.onrender.com/register.html
Login	https://studysync-api-prv0.onrender.com/login.html
Panel Estudiante	https://studysync-api-prv0.onrender.com/estudiante.html
API Docs (Swagger)	https://studysync-api-prv0.onrender.com/api-docs

⚙️ Stack Tecnológico
Capa	Tecnología
Runtime / Framework	Node.js 20 + Express v5
Base de datos	PostgreSQL vía Supabase
ORM	Prisma v6
Cache / Mensajería	Redis vía Upstash (Pub/Sub)
Tiempo real	Socket.io v4
Autenticación	JWT + bcryptjs
Seguridad HTTP	Helmet + CORS + express-rate-limit
Documentación	Swagger / OpenAPI 3.0
Deploy	Render.com

👥 Roles del Sistema
Rol	Descripción
ADMIN	Primer usuario registrado. Puede ver historial, marcar libros como devueltos y eliminar préstamos.
ESTUDIANTE	Todos los usuarios siguientes. Puede registrar préstamos y ver los suyos.

🚀 Endpoints
Auth
Método	Ruta	Auth	Descripción
POST	/auth/register	No	Registrar usuario. El primero es ADMIN.
POST	/auth/login	No	Iniciar sesión. Retorna JWT.

Préstamos
Método	Ruta	Auth	Descripción
GET	/api/prestamos	No	Listar todos los préstamos con datos del estudiante
GET	/api/prestamos/:id	No	Ver un préstamo por ID
POST	/api/prestamos	JWT	Crear préstamo (elegir fecha de devolución)
PUT	/api/prestamos/:id/devolver	Admin	Marcar como devuelto
DELETE	/api/prestamos/:id	Admin	Eliminar préstamo

🔔 Sistema de Alertas en Tiempo Real
El sistema verifica cada hora los préstamos próximos a vencer y notifica automáticamente:

•	Un job corre cada hora verificando préstamos próximos a vencer
•	Si un préstamo vence en menos de 24 horas → publica evento en Redis
•	El suscriptor Redis lo recibe y lo emite via Socket.io
•	Tanto el estudiante como el panel admin reciben la notificación en vivo

Canales Redis
Canal	Descripción
biblioteca:prestamo:creado	Nuevo préstamo registrado
biblioteca:alerta:vencimiento	Préstamo próximo a vencer (menos de 24h)
biblioteca:alerta:vencido	Préstamo ya vencido y no devuelto

Eventos Socket.io
Evento	Descripción
nuevo-prestamo	Nuevo préstamo creado
alerta-vencimiento	Préstamo próximo a vencer
alerta-vencido	Préstamo vencido

🔒 Seguridad
•	JWT con expiración de 1 hora
•	bcrypt con 12 rondas para contraseñas
•	Rate limiting: 100 peticiones cada 15 minutos por IP
•	Helmet con CSP configurado para Socket.io y Swagger
•	CORS habilitado
•	trust proxy configurado para Render

Códigos de Error
Código	Descripción
400	Campos faltantes o datos inválidos
401	Token no proporcionado, inválido o expirado
403	Sin permisos (no es admin)
404	Recurso no encontrado
409	Email ya registrado
429	Rate limit alcanzado — esperar 15 minutos
500	Error interno del servidor

🗄️ Modelo de Datos
Usuario
Campo	Tipo	Descripción
id	Int	PK autoincremental
nombre	String	Nombre completo
email	String	Único
password	String	Hash bcrypt
rol	Enum	ADMIN o ESTUDIANTE
creadoEn	DateTime	Fecha de registro

Prestamo
Campo	Tipo	Descripción
id	Int	PK autoincremental
libroTitulo	String	Título del libro
libroAutor	String	Autor (default: Desconocido)
diasPrestamo	Int	Días calculados hasta vencimiento
fechaPrestamo	DateTime	Fecha de inicio
fechaVencimiento	DateTime	Fecha límite de devolución
devuelto	Boolean	Estado de devolución
alertaEnviada	Boolean	Si ya se envió alerta de vencimiento
estudianteId	Int	FK a Usuario

📁 Estructura del Proyecto
src/
├── app.js                       → Middlewares, rutas, Swagger
├── server.js                    → HTTP server + Socket.io
├── db.js                        → Singleton PrismaClient
├── controllers/
│   └── prestamosController.js   → CRUD de préstamos
├── middlewares/
│   ├── autenticar.js            → Verificación JWT
│   └── soloAdmin.js             → Verificación rol ADMIN
├── redis/
│   └── client.js                → Pub + Sub connections
├── routes/
│   ├── auth.js                  → /auth/register, /auth/login
│   └── prestamos.js             → /api/prestamos CRUD
├── jobs/
│   └── verificarVencimientos.js → Alertas automáticas cada 1h
├── subscribers/
│   └── notificaciones.js        → Redis → Socket.io bridge
└── swagger/
    └── config.js                → Spec OpenAPI 3.0
public/
├── index.html                   → Panel de control (Admin)
├── estudiante.html              → Panel del estudiante
├── register.html                → Registro de usuarios
└── login.html                   → Inicio de sesión

🛠️ Instalación Local
# 1. Clonar el repositorio
git clone https://github.com/kino-07/studysync-api-docente-main.git
cd studysync-api-docente-main

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Generar cliente Prisma
npx prisma generate

# 5. Correr migraciones
npx prisma migrate dev --name init

# 6. Iniciar en desarrollo
npm run dev

🔧 Variables de Entorno
Variable	Descripción
PORT	Puerto del servidor (default: 3000)
NODE_ENV	development o production
DATABASE_URL	URL del pooler de Supabase (puerto 6543)
DIRECT_URL	URL directa de Supabase (puerto 5432) para migraciones
REDIS_URL	URL de Upstash Redis
JWT_SECRET	Clave secreta para firmar tokens JWT
JWT_EXPIRES_IN	Tiempo de expiración del token (default: 1h)

🐛 Bugs Resueltos
#	Error	Causa	Solución
1	ERR_ERL_UNEXPECTED_X_FORWARDED_FOR	Render usa proxy	app.set("trust proxy", 1)
2	P1012 Prisma CLI v7 en Render	npx usa versión global	npx prisma@6.19.3 generate en build
3	ENOTFOUND tenant/user	URL pooler incorrecta	Usar aws-1-sa-east-1.pooler.supabase.com
4	Cannot find module @prisma/client	Estaba en devDependencies	Mover a dependencies
5	Foreign key constraint al borrar usuario	Préstamos vinculados	Borrar préstamos primero

© 2026 Biblioteca API — Programación IV UPDS
