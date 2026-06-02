// src/app.js
require('dotenv').config({ quiet: true });
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');

const app = express();
app.set('trust proxy', 1); // Necesario para express-rate-limit en Render 

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc:        ["'self'", 'data:', 'https:'],
      connectSrc:    ["'self'", 'wss:', 'ws:'],
      fontSrc:       ["'self'", 'https:', 'data:'],
    },
  },
}));

app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos.' },
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Biblioteca API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── RUTAS ─────────────────────────────────────────────────────────────────────
app.use('/auth',          require('./routes/auth'));
app.use('/api/prestamos', require('./routes/prestamos'));

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Biblioteca API funcionando',
    version: '1.0.0',
    docs: '/api-docs',
    endpoints: ['/api/prestamos', '/auth/register', '/auth/login', '/api-docs'],
  });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ruta: req.path,
  });
});

module.exports = app;