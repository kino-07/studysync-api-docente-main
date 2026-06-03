// src/swagger/config.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biblioteca API',
      version: '1.0.0',
      description: `
## Sistema de Registro y Seguimiento de Préstamos de Biblioteca

API REST con autenticación JWT, alertas de vencimiento en tiempo real via Redis + Socket.io.

### Flujo de uso
1. **Registrarse** en \`POST /auth/register\` — el primer usuario es ADMIN automáticamente
2. **Iniciar sesión** en \`POST /auth/login\` — obtener el token JWT
3. **Autorizar** haciendo clic en el botón 🔒 \`Authorize\` y pegando el token
4. **Usar los endpoints** de préstamos

### Roles
- **ADMIN**: puede ver todo el historial, marcar libros como devueltos y eliminar préstamos
- **ESTUDIANTE**: puede crear préstamos y ver los suyos

### Alertas en tiempo real
El sistema verifica cada hora los préstamos próximos a vencer (menos de 24h) y notifica via Socket.io tanto al estudiante como al panel de control.
      `,
      contact: {
        name: 'Programación IV — UPDS 2026',
      },
    },
    servers: [
      {
        url: 'https://studysync-api-prv0.onrender.com',
        description: 'Producción (Render)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Desarrollo local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Pega el token obtenido en POST /auth/login. Ejemplo: **eyJhbGci...**',
        },
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id:       { type: 'integer', example: 1 },
            nombre:   { type: 'string',  example: 'Juan Pérez' },
            email:    { type: 'string',  example: 'juan@upds.edu.bo' },
            rol:      { type: 'string',  enum: ['ADMIN', 'ESTUDIANTE'], example: 'ESTUDIANTE' },
            creadoEn: { type: 'string',  format: 'date-time' },
          },
        },
        Prestamo: {
          type: 'object',
          properties: {
            id:               { type: 'integer', example: 1 },
            libroTitulo:      { type: 'string',  example: 'Cálculo Diferencial' },
            libroAutor:       { type: 'string',  example: 'Stewart' },
            diasPrestamo:     { type: 'integer', example: 14 },
            fechaPrestamo:    { type: 'string',  format: 'date-time' },
            fechaVencimiento: { type: 'string',  format: 'date-time' },
            devuelto:         { type: 'boolean', example: false },
            alertaEnviada:    { type: 'boolean', example: false },
            estudiante: {
              type: 'object',
              properties: {
                id:     { type: 'integer', example: 2 },
                nombre: { type: 'string',  example: 'Juan Pérez' },
                email:  { type: 'string',  example: 'juan@upds.edu.bo' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error:     { type: 'string', example: 'Mensaje de error descriptivo' },
            timestamp: { type: 'string', format: 'date-time' },
            ruta:      { type: 'string', example: '/api/prestamos' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth',      description: 'Registro e inicio de sesión' },
      { name: 'Préstamos', description: 'Gestión de préstamos de libros' },
    ],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar nuevo usuario',
          description: 'El **primer usuario** registrado obtiene rol ADMIN automáticamente. Los siguientes son ESTUDIANTE.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nombre', 'email', 'password'],
                  properties: {
                    nombre:   { type: 'string', example: 'Juan Pérez' },
                    email:    { type: 'string', example: 'juan@upds.edu.bo' },
                    password: { type: 'string', example: 'miPassword123', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario registrado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok:      { type: 'boolean', example: true },
                      mensaje: { type: 'string',  example: 'Estudiante registrado exitosamente.' },
                      usuario: { $ref: '#/components/schemas/Usuario' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Campos faltantes o contraseña muy corta',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'La contraseña debe tener al menos 6 caracteres' },
                },
              },
            },
            409: {
              description: 'Email ya registrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'El email juan@upds.edu.bo ya está registrado' },
                },
              },
            },
            429: {
              description: 'Demasiadas peticiones — rate limit alcanzado',
              content: {
                'application/json': {
                  example: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos.' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Retorna un token JWT válido por 1 hora. Límite: **100 peticiones cada 15 minutos** por IP.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email:    { type: 'string', example: 'juan@upds.edu.bo' },
                    password: { type: 'string', example: 'miPassword123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso — copiar el token para Authorize 🔒',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok:      { type: 'boolean', example: true },
                      token:   { type: 'string',  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      usuario: { $ref: '#/components/schemas/Usuario' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Campos faltantes',
              content: {
                'application/json': {
                  example: { error: 'Email y password son obligatorios' },
                },
              },
            },
            401: {
              description: 'Credenciales inválidas',
              content: {
                'application/json': {
                  example: { error: 'Credenciales inválidas' },
                },
              },
            },
            429: {
              description: 'Rate limit alcanzado',
              content: {
                'application/json': {
                  example: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos.' },
                },
              },
            },
          },
        },
      },
      '/api/prestamos': {
        get: {
          tags: ['Préstamos'],
          summary: 'Listar todos los préstamos',
          description: 'Retorna el historial completo con datos del estudiante. Público — no requiere token.',
          responses: {
            200: {
              description: 'Lista de préstamos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok:    { type: 'boolean', example: true },
                      total: { type: 'integer', example: 5 },
                      datos: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Prestamo' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Préstamos'],
          summary: 'Crear nuevo préstamo',
          description: 'Requiere token JWT de estudiante o admin. La `fechaVencimiento` es opcional — si se omite se calcula con `diasPrestamo`.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['libroTitulo', 'diasPrestamo'],
                  properties: {
                    libroTitulo:      { type: 'string',  example: 'Cálculo Diferencial' },
                    libroAutor:       { type: 'string',  example: 'Stewart' },
                    diasPrestamo:     { type: 'integer', example: 14 },
                    fechaVencimiento: { type: 'string',  format: 'date-time', example: '2026-06-20T18:00:00.000Z', description: 'Opcional — si se envía, sobreescribe el cálculo por días' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Préstamo creado exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Prestamo' },
                },
              },
            },
            400: {
              description: 'Título faltante o días inválidos',
              content: {
                'application/json': {
                  example: { error: 'El campo libroTitulo es obligatorio' },
                },
              },
            },
            401: {
              description: 'Token no proporcionado o inválido',
              content: {
                'application/json': {
                  examples: {
                    sinToken: { value: { error: 'Acceso denegado. Token no proporcionado.' } },
                    expirado: { value: { error: 'Token expirado. Inicia sesión de nuevo.' } },
                    invalido: { value: { error: 'Token inválido.' } },
                  },
                },
              },
            },
            429: {
              description: 'Rate limit alcanzado',
              content: {
                'application/json': {
                  example: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos.' },
                },
              },
            },
          },
        },
      },
      '/api/prestamos/{id}': {
        get: {
          tags: ['Préstamos'],
          summary: 'Obtener un préstamo por ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          ],
          responses: {
            200: {
              description: 'Préstamo encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Prestamo' },
                },
              },
            },
            404: {
              description: 'Préstamo no encontrado',
              content: {
                'application/json': {
                  example: { error: 'Préstamo 99 no encontrado' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Préstamos'],
          summary: 'Eliminar préstamo — solo ADMIN',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          ],
          responses: {
            200: {
              description: 'Préstamo eliminado',
              content: {
                'application/json': {
                  example: { ok: true, mensaje: 'Préstamo 1 eliminado correctamente' },
                },
              },
            },
            401: {
              description: 'Token inválido o faltante',
              content: {
                'application/json': {
                  example: { error: 'Acceso denegado. Token no proporcionado.' },
                },
              },
            },
            403: {
              description: 'No es admin',
              content: {
                'application/json': {
                  example: { error: 'Acceso denegado. Solo el administrador puede realizar esta acción.' },
                },
              },
            },
            404: {
              description: 'Préstamo no encontrado',
              content: {
                'application/json': {
                  example: { error: 'Préstamo 99 no encontrado' },
                },
              },
            },
          },
        },
      },
      '/api/prestamos/{id}/devolver': {
        put: {
          tags: ['Préstamos'],
          summary: 'Marcar préstamo como devuelto — solo ADMIN',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          ],
          responses: {
            200: {
              description: 'Libro marcado como devuelto',
              content: {
                'application/json': {
                  example: { ok: true, mensaje: 'Libro marcado como devuelto' },
                },
              },
            },
            400: {
              description: 'Ya fue devuelto',
              content: {
                'application/json': {
                  example: { error: 'El préstamo 1 ya fue marcado como devuelto' },
                },
              },
            },
            401: {
              description: 'Token inválido',
              content: {
                'application/json': {
                  example: { error: 'Token expirado. Inicia sesión de nuevo.' },
                },
              },
            },
            403: {
              description: 'No es admin',
              content: {
                'application/json': {
                  example: { error: 'Acceso denegado. Solo el administrador puede realizar esta acción.' },
                },
              },
            },
            404: {
              description: 'Préstamo no encontrado',
              content: {
                'application/json': {
                  example: { error: 'Préstamo 99 no encontrado' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);