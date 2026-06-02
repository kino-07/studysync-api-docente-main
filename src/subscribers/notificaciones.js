// src/subscribers/notificaciones.js
  // Este módulo escucha canales Redis y retransmite los eventos
  // a los navegadores conectados mediante Socket.io
  const { sub } = require('../redis/client');
  
  // Esta función recibe el objeto 'io' de Socket.io y lo usa para emitir
  // Se llama desde server.js después de inicializar Socket.io
  const iniciarSuscripciones = (io) => {
    // Suscribirse a TODOS los canales que empiecen con 'study:'
    // El asterisco (*) es un wildcard (comodín)
    sub.psubscribe('study:*', (err, count) => {
      if (err) {
        console.error('[Sub] Error al suscribirse:', err.message);
        return;
      }
      console.log(`[Sub] ✓ Escuchando ${count} patrón(es) en Redis...`);
    });
  
    // Este listener se ejecuta cada vez que llega un mensaje
    // pattern = patrón que coincidió ('study:*')
    // channel = canal exacto ('study:sesion:creada')
    // message = el JSON string que publicó el publicador
    sub.on('pmessage', (pattern, channel, message) => {
      try {
        const evento = JSON.parse(message);
        console.log(`[Sub] Recibido en ${channel}:`, evento.tipo);
  
        // Emitir el evento a TODOS los navegadores conectados via Socket.io
        // El nombre 'nuevo-evento' es el que escucha el cliente HTML
        io.emit('nuevo-evento', {
          canal: channel,
          ...evento
        });
  
      } catch (error) {
        console.error('[Sub] Error procesando mensaje:', error.message);
      }
    });
  };
  
  module.exports = { iniciarSuscripciones };
