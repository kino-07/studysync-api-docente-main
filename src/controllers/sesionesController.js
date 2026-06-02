// src/controllers/sesionesController.js
// Lógica de negocio para sesiones — migrado a Supabase via Prisma (Paso 10)

const prisma = require('../db');
const { pub } = require('../redis/client');

// ── GET /api/sesiones ─────────────────────────────────────────────────────────
const listar = async (req, res) => {
  const sesiones = await prisma.sesion.findMany({
    orderBy: { creadaEn: 'desc' },
    include: { autor: { select: { id: true, nombre: true, email: true } } }
  });

  res.json({ ok: true, total: sesiones.length, datos: sesiones });
};

// ── GET /api/sesiones/:id ─────────────────────────────────────────────────────
const obtenerUna = async (req, res) => {
  const id = parseInt(req.params.id);

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { autor: { select: { id: true, nombre: true, email: true } } }
  });

  if (!sesion) {
    return res.status(404).json({ error: `Sesión ${id} no encontrada` });
  }

  res.json(sesion);
};

// ── POST /api/sesiones ────────────────────────────────────────────────────────
const crear = async (req, res) => {
  const { titulo, descripcion, fechaHora, materia } = req.body;

  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({
      error: 'El campo titulo es obligatorio',
      campos_requeridos: ['titulo'],
      campos_opcionales: ['descripcion', 'fechaHora', 'materia']
    });
  }

  const nuevaSesion = await prisma.sesion.create({
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      materia: materia || 'General',
      fechaHora: fechaHora ? new Date(fechaHora) : new Date(),
      autorId: req.usuario.id, // Inyectado por el middleware autenticar
    },
    include: { autor: { select: { id: true, nombre: true, email: true } } }
  });

  // Publicar evento en Redis → el suscriptor lo retransmite via Socket.io
  try {
    await pub.publish('study:sesion:creada', JSON.stringify({
      tipo: 'sesion:creada',
      payload: nuevaSesion,
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[Redis] No se pudo publicar el evento:', e.message);
  }

  res.status(201).json(nuevaSesion);
};

// ── PUT /api/sesiones/:id ─────────────────────────────────────────────────────
const actualizar = async (req, res) => {
  const id = parseInt(req.params.id);

  const existe = await prisma.sesion.findUnique({ where: { id } });
  if (!existe) {
    return res.status(404).json({ error: `Sesión ${id} no encontrada` });
  }

  const { titulo, descripcion, materia, fechaHora, completada } = req.body;

  const actualizada = await prisma.sesion.update({
    where: { id },
    data: {
      ...(titulo      !== undefined && { titulo }),
      ...(descripcion !== undefined && { descripcion }),
      ...(materia     !== undefined && { materia }),
      ...(fechaHora   !== undefined && { fechaHora: new Date(fechaHora) }),
      ...(completada  !== undefined && { completada }),
    },
    include: { autor: { select: { id: true, nombre: true, email: true } } }
  });

  res.json(actualizada);
};

// ── DELETE /api/sesiones/:id ──────────────────────────────────────────────────
const eliminar = async (req, res) => {
  const id = parseInt(req.params.id);

  const existe = await prisma.sesion.findUnique({ where: { id } });
  if (!existe) {
    return res.status(404).json({ error: `Sesión ${id} no encontrada` });
  }

  await prisma.sesion.delete({ where: { id } });

  res.json({ ok: true, mensaje: `Sesión ${id} eliminada correctamente` });
};

module.exports = { listar, obtenerUna, crear, actualizar, eliminar };
