const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function limpiar() {
  const prestamos = await p.prestamo.deleteMany({});
  console.log('Préstamos eliminados:', prestamos.count);
  
  const usuarios = await p.usuario.deleteMany({});
  console.log('Usuarios eliminados:', usuarios.count);
}

limpiar().finally(() => p.$disconnect());