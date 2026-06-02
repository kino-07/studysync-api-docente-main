// src/swagger/config.js
// Especificación OpenAPI 3.0 — incluye JWT BearerAuth y endpoints de autenticación
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudySync API',
      version: '1.0.0',
      description:
        'API REST para coordinar grupos de estudio universitarios. ' +
        'Permite crear, consultar, actualizar y eliminar sesiones de estudio ' +
        'con autenticación JWT y notificaciones en tiempo real via Redis Pub/Sub + Socket.io.',
      contact: { name: 'UPDS Programación IV — 2026' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo local' },
      { url: 'https://studysync-api-a5o9.onrender.com', description: 'Producción (Render)' },
    ],
    tags: [
      { name: 'Auth',     description: 'Registro e inicio de sesión' },
      { name: 'Sesiones', description: 'CRUD de sesiones de estudio' },
    ],
    // ── Esquema de seguridad: JWT Bearer Token ─────────────────────────────────
    // Define que la API puede recibir tokens en el header Authorization: Bearer <token>
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token obtenido en /auth/login. Formato: Bearer <token>',
        },
      },
      schemas: {
        Sesion: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            titulo:      { type: 'string',  example: 'Redis Pub/Sub' },
            descripcion: { type: 'string',  example: 'Mensajería en tiempo real' },
            materia:     { type: 'string',  example: 'Prog IV' },
            fechaHora:   { type: 'string',  format: 'date-time' },
            completada:  { type: 'boolean', example: false },
            creadaEn:    { type: 'string',  format: 'date-time' },
            autor: {
              type: 'object',
              properties: {
                id:     { type: 'integer', example: 1 },
                nombre: { type: 'string',  example: 'Jimmy Requena' },
                email:  { type: 'string',  example: 'jimmy@upds.edu.bo' },
              },
            },
          },
        },
        NuevaSesion: {
          type: 'object',
          required: ['titulo'],
          properties: {
            titulo:      { type: 'string', example: 'Redis Pub/Sub' },
            descripcion: { type: 'string', example: 'Mensajería en tiempo real' },
            materia:     { type: 'string', example: 'Prog IV' },
            fechaHora:   { type: 'string', format: 'date-time', example: '2026-05-20T10:00:00.000Z' },
          },
        },
        ActualizarSesion: {
          type: 'object',
          properties: {
            titulo:      { type: 'string',  example: 'Tema actualizado' },
            descripcion: { type: 'string',  example: 'Nueva descripción' },
            materia:     { type: 'string',  example: 'Prog IV' },
            fechaHora:   { type: 'string',  format: 'date-time' },
            completada:  { type: 'boolean', example: true },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre:   { type: 'string', example: 'Jimmy Requena' },
            email:    { type: 'string', format: 'email', example: 'jimmy@upds.edu.bo' },
            password: { type: 'string', minLength: 6, example: 'miPassword123' },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'jimmy@upds.edu.bo' },
            password: { type: 'string', example: 'miPassword123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            ok:    { type: 'boolean', example: true },
            token: { type: 'string',  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            usuario: {
              type: 'object',
              properties: {
                id:     { type: 'integer', example: 1 },
                nombre: { type: 'string',  example: 'Jimmy Requena' },
                email:  { type: 'string',  example: 'jimmy@upds.edu.bo' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error:     { type: 'string', example: 'Mensaje de error' },
            timestamp: { type: 'string', format: 'date-time' },
            ruta:      { type: 'string', example: '/api/sesiones/99' },
          },
        },
      },
    },
    paths: {
      // ── Auth endpoints ──────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          summary: 'Registrar nuevo usuario',
          description: 'Crea un usuario con contraseña hasheada con bcrypt (12 salt rounds). El password nunca se guarda en texto plano.',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            201: {
              description: 'Usuario creado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok:      { type: 'boolean', example: true },
                      mensaje: { type: 'string',  example: 'Usuario registrado exitosamente' },
                      usuario: { type: 'object', properties: {
                        id:       { type: 'integer', example: 1 },
                        nombre:   { type: 'string',  example: 'Jimmy Requena' },
                        email:    { type: 'string',  example: 'jimmy@upds.edu.bo' },
                        creadoEn: { type: 'string',  format: 'date-time' },
                      }},
                    },
                  },
                },
              },
            },
            400: { description: 'Campos faltantes o password muy corto' },
            409: { description: 'El email ya está registrado' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Iniciar sesión',
          description: 'Verifica credenciales y devuelve un JWT válido por 1 hora. Úsalo en el botón **Authorize** (arriba a la derecha) para probar rutas protegidas.',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            200: {
              description: 'Login exitoso — copia el token y úsalo en Authorize',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
            },
            401: { description: 'Credenciales inválidas' },
          },
        },
      },
      // ── Sesiones endpoints ─────────────────────────────────────────────────
      '/api/sesiones': {
        get: {
          summary: 'Listar todas las sesiones',
          description: 'Devuelve el listado completo de sesiones de estudio. No requiere autenticación.',
          tags: ['Sesiones'],
          responses: {
            200: {
              description: 'Lista de sesiones obtenida correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok:    { type: 'boolean', example: true },
                      total: { type: 'integer', example: 2 },
                      datos: { type: 'array', items: { $ref: '#/components/schemas/Sesion' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Crear una nueva sesión',
          description: 'Crea una sesión y publica un evento en Redis. **Requiere JWT** — haz login primero y usa el botón Authorize.',
          tags: ['Sesiones'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NuevaSesion' } } },
          },
          responses: {
            201: { description: 'Sesión creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sesion' } } } },
            400: { description: 'El campo titulo es obligatorio' },
            401: { description: 'Token no proporcionado o inválido' },
          },
        },
      },
      '/api/sesiones/{id}': {
        get: {
          summary: 'Obtener una sesión por ID',
          tags: ['Sesiones'],
          parameters: [{
            in: 'path', name: 'id', required: true,
            description: 'ID numérico de la sesión',
            schema: { type: 'integer', example: 1 },
          }],
          responses: {
            200: { description: 'Sesión encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sesion' } } } },
            404: { description: 'Sesión no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        put: {
          summary: 'Actualizar una sesión',
          description: 'Actualiza los campos enviados. **Requiere JWT.**',
          tags: ['Sesiones'],
          security: [{ BearerAuth: [] }],
          parameters: [{
            in: 'path', name: 'id', required: true,
            schema: { type: 'integer', example: 1 },
          }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ActualizarSesion' } } },
          },
          responses: {
            200: { description: 'Sesión actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sesion' } } } },
            401: { description: 'Token no proporcionado o inválido' },
            404: { description: 'Sesión no encontrada' },
          },
        },
        delete: {
          summary: 'Eliminar una sesión',
          description: '**Requiere JWT.**',
          tags: ['Sesiones'],
          security: [{ BearerAuth: [] }],
          parameters: [{
            in: 'path', name: 'id', required: true,
            schema: { type: 'integer', example: 1 },
          }],
          responses: {
            200: {
              description: 'Sesión eliminada',
              content: { 'application/json': { schema: { type: 'object', properties: {
                ok:      { type: 'boolean', example: true },
                mensaje: { type: 'string',  example: 'Sesión 1 eliminada correctamente' },
              }}}},
            },
            401: { description: 'Token no proporcionado o inválido' },
            404: { description: 'Sesión no encontrada' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
