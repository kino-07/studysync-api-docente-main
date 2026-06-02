// src/subscribers/notificaciones.js
const { sub } = require('../redis/client');

const iniciarSuscripciones = (io) => {
  // Suscribirse a todos los canales de biblioteca:*
  sub.psubscribe('biblioteca:*', (err, count) => {
    if (err) {
      console.error('[Sub] Error al suscribirse:', err.message);
      return;
    }
    console.log(`[Sub] ✓ Escuchando ${count} patrón(es) en Redis...`);
  });

  sub.on('pmessage', (pattern, channel, message) => {
    try {
      const evento = JSON.parse(message);
      console.log(`[Sub] Recibido en ${channel}:`, evento.tipo);

      // Nuevo préstamo creado → notificar a todos
      if (channel === 'biblioteca:prestamo:creado') {
        io.emit('nuevo-prestamo', {
          canal: channel,
          ...evento
        });
      }

      // Alerta de vencimiento próximo → notificar a todos
      if (channel === 'biblioteca:alerta:vencimiento') {
        io.emit('alerta-vencimiento', {
          canal: channel,
          ...evento
        });
      }

      // Alerta de préstamo ya vencido → notificar a todos
      if (channel === 'biblioteca:alerta:vencido') {
        io.emit('alerta-vencido', {
          canal: channel,
          ...evento
        });
      }

    } catch (error) {
      console.error('[Sub] Error procesando mensaje:', error.message);
    }
  });
};

module.exports = { iniciarSuscripciones };