// src/server.js
require('dotenv').config({ quiet: true });
const http    = require('http');
const { Server } = require('socket.io');
const app     = require('./app');
require('./redis/client'); // inicia conexiones pub/sub al arrancar

const servidor = http.createServer(app);

const io = new Server(servidor, {
  cors: { origin: '*' },
  transports: ['polling', 'websocket'],
});

const { iniciarSuscripciones } = require('./subscribers/notificaciones');
iniciarSuscripciones(io);

io.on('connection', (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[WS] Cliente desconectado: ${socket.id}`));
});

// Render asigna process.env.PORT automáticamente — nunca fijar un puerto fijo aquí
const PORT = process.env.PORT || 3000;
servidor.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(`  StudySync API + WebSocket · puerto ${PORT}`);
  console.log(`  Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Docs: /api-docs`);
  console.log('═══════════════════════════════════════════');
});
