// src/routes/auth.js
// Rutas de autenticación: registro e inicio de sesión con Supabase via Prisma

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const prisma   = require('../db');

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: 'Los campos nombre, email y password son obligatorios'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    return res.status(409).json({ error: `El email ${email} ya está registrado` });
  }

  // bcrypt.hash genera un hash irreversible con 12 rondas de sal
  const hashPassword = await bcrypt.hash(password, 12);

  const nuevoUsuario = await prisma.usuario.create({
    data: { nombre, email, password: hashPassword },
    select: { id: true, nombre: true, email: true, creadoEn: true }
  });

  res.status(201).json({
    ok: true,
    mensaje: 'Usuario registrado exitosamente',
    usuario: nuevoUsuario
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mensaje genérico — no revelar si el email existe o no (seguridad)
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.password);
  if (!passwordCorrecta) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  res.json({
    ok: true,
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
  });
});

module.exports = router;
