/**
 * Datos mock de usuarios
 */

export const mockUsers = [
  {
    id: 'user_001',
    username: 'admin',
    password: 'admin', // En producción NUNCA guardar passwords en texto plano
    nombre: 'Administrador del Sistema',
    rol: 'admin',
    unidad: 'Dirección General',
    email: 'admin@sapal.gob.mx',
    telefono: '477-123-4567',
    active: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user_002',
    username: 'supervisor',
    password: 'supervisor',
    nombre: 'Juan Pérez Rodríguez',
    rol: 'supervisor',
    unidad: 'Operaciones - Zona Norte',
    email: 'jperez@sapal.gob.mx',
    telefono: '477-234-5678',
    active: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'user_003',
    username: 'coordinador',
    password: 'coordinador',
    nombre: 'María González López',
    rol: 'coordinador',
    unidad: 'Coordinación de Obras',
    email: 'mgonzalez@sapal.gob.mx',
    telefono: '477-345-6789',
    active: true,
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'user_004',
    username: 'supervisor2',
    password: 'supervisor2',
    nombre: 'Carlos Ramírez Sánchez',
    rol: 'supervisor',
    unidad: 'Operaciones - Zona Sur',
    email: 'cramirez@sapal.gob.mx',
    telefono: '477-456-7890',
    active: true,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'user_005',
    username: 'consulta',
    password: 'consulta',
    nombre: 'Usuario de Consulta',
    rol: 'consulta',
    unidad: 'Consulta General',
    email: 'consulta@sapal.gob.mx',
    telefono: '',
    active: true,
    createdAt: '2024-02-10T00:00:00Z'
  }
];

export default mockUsers;
