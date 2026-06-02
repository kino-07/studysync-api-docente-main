// src/controllers/prestamosController.js
const prisma = require('../db');
const { pub } = require('../redis/client');

// ── GET /api/prestamos ────────────────────────────────────────────────────────
const listar = async (req, res) => {
  const prestamos = await prisma.prestamo.findMany({
    orderBy: { fechaPrestamo: 'desc' },
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } }
    }
  });

  res.json({ ok: true, total: prestamos.length, datos: prestamos });
};

// ── GET /api/prestamos/:id ────────────────────────────────────────────────────
const obtenerUno = async (req, res) => {
  const id = parseInt(req.params.id);

  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } }
    }
  });

  if (!prestamo) {
    return res.status(404).json({ error: `Préstamo ${id} no encontrado` });
  }

  res.json(prestamo);
};

// ── POST /api/prestamos ───────────────────────────────────────────────────────
const crear = async (req, res) => {
  const { libroTitulo, libroAutor, diasPrestamo } = req.body;

  if (!libroTitulo || libroTitulo.trim() === '') {
    return res.status(400).json({
      error: 'El campo libroTitulo es obligatorio',
      campos_requeridos: ['libroTitulo', 'diasPrestamo'],
      campos_opcionales: ['libroAutor'],
      diasValidos: [7, 14, 30]
    });
  }

  const dias = parseInt(diasPrestamo);
  if (![7, 14, 30].includes(dias)) {
    return res.status(400).json({
      error: 'diasPrestamo debe ser 7, 14 o 30',
      diasValidos: [7, 14, 30]
    });
  }

  // Calcular fecha de vencimiento
  const fechaPrestamo    = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

  const nuevoPrestamo = await prisma.prestamo.create({
    data: {
      libroTitulo:      libroTitulo.trim(),
      libroAutor:       libroAutor || 'Desconocido',
      diasPrestamo:     dias,
      fechaPrestamo,
      fechaVencimiento,
      estudianteId:     req.usuario.id,
    },
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } }
    }
  });

  // Publicar evento en Redis
  try {
    await pub.publish('biblioteca:prestamo:creado', JSON.stringify({
      tipo: 'prestamo:creado',
      payload: nuevoPrestamo,
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[Redis] No se pudo publicar el evento:', e.message);
  }

  res.status(201).json(nuevoPrestamo);
};

// ── PUT /api/prestamos/:id/devolver ───────────────────────────────────────────
const marcarDevuelto = async (req, res) => {
  const id = parseInt(req.params.id);

  const existe = await prisma.prestamo.findUnique({ where: { id } });
  if (!existe) {
    return res.status(404).json({ error: `Préstamo ${id} no encontrado` });
  }

  if (existe.devuelto) {
    return res.status(400).json({ error: `El préstamo ${id} ya fue marcado como devuelto` });
  }

  const actualizado = await prisma.prestamo.update({
    where: { id },
    data: { devuelto: true },
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } }
    }
  });

  res.json({ ok: true, mensaje: 'Libro marcado como devuelto', prestamo: actualizado });
};

// ── DELETE /api/prestamos/:id ─────────────────────────────────────────────────
const eliminar = async (req, res) => {
  const id = parseInt(req.params.id);

  const existe = await prisma.prestamo.findUnique({ where: { id } });
  if (!existe) {
    return res.status(404).json({ error: `Préstamo ${id} no encontrado` });
  }

  await prisma.prestamo.delete({ where: { id } });

  res.json({ ok: true, mensaje: `Préstamo ${id} eliminado correctamente` });
};

module.exports = { listar, obtenerUno, crear, marcarDevuelto, eliminar };