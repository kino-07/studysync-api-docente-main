// src/redis/client.js
  // Exporta DOS conexiones Redis independientes:
  // - pub: para publicar mensajes (no puede suscribirse mientras publica)
  // - sub: para suscribirse a canales (no puede publicar mientras escucha)
  // Esta separación es OBLIGATORIA en Redis Pub/Sub
require('dotenv').config({ quiet: true });
  const Redis = require('ioredis');
  
  const REDIS_URL = process.env.REDIS_URL;
  
  if (!REDIS_URL || REDIS_URL.includes('PENDIENTE')) {
    console.error('❌ REDIS_URL no configurada en .env');
    process.exit(1); // Detener el servidor si Redis no está configurado
  }
  
  // Opciones compartidas de conexión
  const opciones = {
    maxRetriesPerRequest: 3,          // Reintentar 3 veces si falla
    retryStrategy: (times) => {
      if (times > 3) return null;     // Después de 3 intentos, rendirse
      return Math.min(times * 200, 1000); // Esperar 200ms, 400ms, 600ms...
    }
  };
  
  // Conexión para PUBLICAR eventos
  const pub = new Redis(REDIS_URL, opciones);
  pub.on('connect', () => console.log('✓ Redis Pub: conectado a Upstash'));
  pub.on('error',   (e) => console.error('✗ Redis Pub error:', e.message));
  
  // Conexión para SUSCRIBIRSE a canales
  const sub = new Redis(REDIS_URL, opciones);
  sub.on('connect', () => console.log('✓ Redis Sub: conectado a Upstash'));
  sub.on('error',   (e) => console.error('✗ Redis Sub error:', e.message));
  
  module.exports = { pub, sub };
