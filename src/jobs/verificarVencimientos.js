// src/jobs/verificarVencimientos.js
// Revisa cada hora los préstamos próximos a vencer y publica alertas en Redis

const prisma = require('../db');
const { pub } = require('../redis/client');

const verificarVencimientos = async (io) => {
  try {
    const ahora    = new Date();
    const en24h    = new Date();
    en24h.setHours(en24h.getHours() + 24);

    // Buscar préstamos no devueltos que vencen en las próximas 24 horas
    const proximosAVencer = await prisma.prestamo.findMany({
      where: {
        devuelto:         false,
        alertaEnviada:    false,
        fechaVencimiento: {
          gte: ahora,
          lte: en24h,
        }
      },
      include: {
        estudiante: { select: { id: true, nombre: true, email: true } }
      }
    });

    for (const prestamo of proximosAVencer) {
      const horasRestantes = Math.ceil(
        (new Date(prestamo.fechaVencimiento) - ahora) / (1000 * 60 * 60)
      );

      console.log(`[Job] ⚠ Alerta: "${prestamo.libroTitulo}" vence en ${horasRestantes}h — ${prestamo.estudiante.nombre}`);

      // Publicar alerta en Redis
      await pub.publish('biblioteca:alerta:vencimiento', JSON.stringify({
        tipo:    'alerta:vencimiento',
        payload: {
          prestamo,
          horasRestantes,
          mensaje: `El préstamo del libro "${prestamo.libroTitulo}" de ${prestamo.estudiante.nombre} vence en ${horasRestantes} horas.`
        },
        timestamp: new Date().toISOString(),
      }));

      // Marcar alerta como enviada para no repetirla
      await prisma.prestamo.update({
        where: { id: prestamo.id },
        data:  { alertaEnviada: true }
      });
    }

    // Buscar préstamos ya vencidos y no devueltos
    const vencidos = await prisma.prestamo.findMany({
      where: {
        devuelto:         false,
        fechaVencimiento: { lt: ahora }
      },
      include: {
        estudiante: { select: { id: true, nombre: true, email: true } }
      }
    });

    for (const prestamo of vencidos) {
      const diasVencido = Math.ceil(
        (ahora - new Date(prestamo.fechaVencimiento)) / (1000 * 60 * 60 * 24)
      );

      await pub.publish('biblioteca:alerta:vencido', JSON.stringify({
        tipo:    'alerta:vencido',
        payload: {
          prestamo,
          diasVencido,
          mensaje: `⚠ VENCIDO: El libro "${prestamo.libroTitulo}" de ${prestamo.estudiante.nombre} lleva ${diasVencido} día(s) de retraso.`
        },
        timestamp: new Date().toISOString(),
      }));
    }

  } catch (error) {
    console.error('[Job] Error verificando vencimientos:', error.message);
  }
};

const iniciarJob = (io) => {
  console.log('[Job] ✓ Verificador de vencimientos iniciado (cada 1 hora)');

  // Ejecutar inmediatamente al arrancar
  verificarVencimientos(io);

  // Luego cada hora
  setInterval(() => verificarVencimientos(io), 60 * 60 * 1000);
};

module.exports = { iniciarJob };