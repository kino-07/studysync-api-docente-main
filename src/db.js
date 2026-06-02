// src/db.js
// Singleton de PrismaClient — una sola instancia reutilizada en toda la app
// Evita "too many connections" en entornos con hot-reload (nodemon, Serverless)

const { PrismaClient } = require('@prisma/client');

const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
