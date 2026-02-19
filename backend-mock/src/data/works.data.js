/**
 * Datos mock de obras
 */

export const mockWorks = [
  {
    id: 'work_001',
    folio: 'OBRA-2026-001',
    tipo: 'drenaje',
    nombre: 'Sustitución de tubería de drenaje - Calle Madero',
    descripcion: 'Cambio de tubería de drenaje sanitario de 8" por deterioro. Tramo de 120 metros lineales.',
    status: 'en_proceso',
    prioridad: 'alta',
    responsable: 'user_002', // supervisor
    supervisor_nombre: 'Juan Pérez Rodríguez',
    coordinador: 'user_003',
    ubicacion: {
      calle: 'Francisco I. Madero',
      entre_calles: 'Juárez y Hidalgo',
      colonia: 'Centro',
      delegacion: 'Delegación Centro',
      codigo_postal: '37000'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [218530, 2334770], // Coordenadas UTM EPSG:32614
        [218550, 2334780],
        [218580, 2334790]
      ],
      srid: 32614
    },
    fechas: {
      inicio_programado: '2026-02-10T00:00:00Z',
      fin_programado: '2026-02-24T00:00:00Z',
      inicio_real: '2026-02-12T08:00:00Z',
      fin_real: null
    },
    metricas: {
      longitud_total: 120,
      diametro: 8,
      profundidad_promedio: 1.8,
      unidad: 'metros'
    },
    presupuesto: {
      monto: 185000,
      moneda: 'MXN',
      avance_financiero: 35
    },
    avance: {
      porcentaje: 40,
      actividades_completadas: 4,
      actividades_totales: 10
    },
    notas: 'Obra con prioridad alta debido a colapso parcial de tubería existente.',
    tags: ['urgente', 'drenaje', 'centro'],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-17T14:30:00Z'
  },
  {
    id: 'work_002',
    folio: 'OBRA-2026-002',
    tipo: 'agua',
    nombre: 'Instalación de red de agua potable - Col. Nuevo Amanecer',
    descripcion: 'Instalación de red nueva de agua potable en colonia de reciente urbanización.',
    status: 'programada',
    prioridad: 'media',
    responsable: 'user_002',
    supervisor_nombre: 'Juan Pérez Rodríguez',
    coordinador: 'user_003',
    ubicacion: {
      calle: 'Av. Principal',
      entre_calles: 'Calle 1 y Calle 5',
      colonia: 'Nuevo Amanecer',
      delegacion: 'Delegación Norte',
      codigo_postal: '37420'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [219000, 2335500],
        [219200, 2335520],
        [219400, 2335540]
      ],
      srid: 32614
    },
    fechas: {
      inicio_programado: '2026-03-01T00:00:00Z',
      fin_programado: '2026-03-20T00:00:00Z',
      inicio_real: null,
      fin_real: null
    },
    metricas: {
      longitud_total: 450,
      diametro: 4,
      profundidad_promedio: 1.2,
      unidad: 'metros'
    },
    presupuesto: {
      monto: 320000,
      moneda: 'MXN',
      avance_financiero: 0
    },
    avance: {
      porcentaje: 0,
      actividades_completadas: 0,
      actividades_totales: 12
    },
    notas: 'Obra programada para inicio de marzo. Coordinación con vecinos completada.',
    tags: ['agua', 'norte', 'expansion'],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z'
  },
  {
    id: 'work_003',
    folio: 'OBRA-2026-003',
    tipo: 'mixta',
    nombre: 'Rehabilitación integral - Calle Reforma',
    descripcion: 'Sustitución de tuberías de agua y drenaje, incluye repavimentación.',
    status: 'en_proceso',
    prioridad: 'media',
    responsable: 'user_004', // supervisor2
    supervisor_nombre: 'Carlos Ramírez Sánchez',
    coordinador: 'user_003',
    ubicacion: {
      calle: 'Reforma',
      entre_calles: 'Insurgentes y Revolución',
      colonia: 'Jardines del Moral',
      delegacion: 'Delegación Sur',
      codigo_postal: '37160'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [218200, 2333800],
        [218220, 2333850],
        [218240, 2333900]
      ],
      srid: 32614
    },
    fechas: {
      inicio_programado: '2026-02-01T00:00:00Z',
      fin_programado: '2026-03-15T00:00:00Z',
      inicio_real: '2026-02-03T07:30:00Z',
      fin_real: null
    },
    metricas: {
      longitud_total: 200,
      diametro: 6,
      profundidad_promedio: 1.5,
      unidad: 'metros'
    },
    presupuesto: {
      monto: 550000,
      moneda: 'MXN',
      avance_financiero: 25
    },
    avance: {
      porcentaje: 30,
      actividades_completadas: 5,
      actividades_totales: 16
    },
    notas: 'Obra integral que incluye pavimentación posterior.',
    tags: ['mixta', 'sur', 'integral'],
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-17T16:00:00Z'
  }
];

export default mockWorks;
