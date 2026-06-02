// src/app.js
require('dotenv').config({ quiet: true });
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const swaggerUi  = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');

const app = express();

// ── HELMET — Cabeceras de seguridad HTTP ──────────────────────────────────────
// Helmet configura automáticamente ~12 headers que el navegador interpreta
// como instrucciones de seguridad. Debe ir PRIMERO, antes de cualquier otro middleware.
//
// Headers que activa:
//   Content-Security-Policy    → bloquea scripts/recursos de dominios no autorizados
//   X-Frame-Options: DENY      → impide que la app sea embebida en un <iframe> (clickjacking)
//   X-Content-Type-Options     → prohíbe al navegador "adivinar" el tipo MIME (MIME sniffing)
//   Strict-Transport-Security  → fuerza HTTPS en el navegador (HSTS)
//   Referrer-Policy            → controla qué URL se envía como "Referer" en requests
//   X-XSS-Protection           → activa el filtro XSS del navegador (legacy, pero útil)
//   Cross-Origin-*             → políticas de aislamiento de origen cruzado
app.use(helmet({
  // Relajamos CSP para Swagger UI y el frontend con event handlers inline
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      // Helmet 7 separa script-src (bloques <script>) de script-src-attr
      // (atributos onclick, onkeydown, etc.). Sin esto, los botones del
      // frontend quedan bloqueados aunque scriptSrc permita 'unsafe-inline'.
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc:        ["'self'", 'data:', 'https:'],
      connectSrc:    ["'self'", 'wss:', 'ws:'],
      fontSrc:       ["'self'", 'https:', 'data:'],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors());

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
// Máximo 100 peticiones por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos.' },
});
app.use('/api/', limiter);

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static('public'));

// Middleware de logs
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ── SWAGGER UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'StudySync API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── RUTAS ─────────────────────────────────────────────────────────────────────
app.use('/auth',         require('./routes/auth'));
app.use('/api/sesiones', require('./routes/sesiones'));

app.get('/', (req, res) => {
  res.json({
    mensaje: 'StudySync API funcionando',
    version: '1.0.0',
    docs: 'http://localhost:3000/api-docs',
    endpoints: ['/api/sesiones', '/auth/register', '/auth/login', '/api-docs'],
  });
});

// ── MANEJO DE ERRORES GLOBAL ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ruta: req.path,
  });
});

module.exports = app;
