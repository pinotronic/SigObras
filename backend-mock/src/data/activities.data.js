/**
 * Datos mock de actividades (ejecuciones)
 * Basado en el flujo de cambio de tubería (sección 3.2 del plan)
 */

export const mockActivities = [
  // Obra 1 - work_001
  {
    id: 'activity_001_001',
    workId: 'work_001',
    catalogoId: 'cat_marcacion',
    nombre: 'Marcar área a reemplazar',
    tipo: 'marcacion',
    orden: 1,
    status: 'completada',
    ponderacion: 5,
    requisitos: {
      geometria_requerida: true,
      min_fotos: 1,
      campos_obligatorios: ['area']
    },
    datos: {
      area: 85.5,
      unidad: 'm2'
    },
    geometria: {
      type: 'Polygon',
      coordinates: [[
        [218530, 2334770],
        [218535, 2334770],
        [218535, 2334780],
        [218530, 2334780],
        [218530, 2334770]
      ]],
      srid: 32614
    },
    evidencias: ['evidence_001', 'evidence_002'],
    usuario: 'user_002',
    timestamps: {
      inicio: '2026-02-12T08:30:00Z',
      fin: '2026-02-12T09:15:00Z'
    }
  },
  {
    id: 'activity_001_002',
    workId: 'work_001',
    catalogoId: 'cat_quitar_concreto',
    nombre: 'Quitar concreto / corte',
    tipo: 'excavacion',
    orden: 2,
    status: 'completada',
    ponderacion: 10,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: ['profundidad']
    },
    datos: {
      profundidad: 0.15,
      area_cortada: 82,
      unidad: 'm2'
    },
    evidencias: ['evidence_003', 'evidence_004'],
    usuario: 'user_002',
    timestamps: {
      inicio: '2026-02-12T09:30:00Z',
      fin: '2026-02-12T12:00:00Z'
    }
  },
  {
    id: 'activity_001_003',
    workId: 'work_001',
    catalogoId: 'cat_descubrir_tuberia',
    nombre: 'Descubrir tubería',
    tipo: 'excavacion',
    orden: 3,
    status: 'completada',
    ponderacion: 10,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: ['profundidad']
    },
    datos: {
      profundidad: 1.85,
      diametro_encontrado: 8,
      estado: 'deteriorado',
      unidad: 'm'
    },
    evidencias: ['evidence_005', 'evidence_006'],
    usuario: 'user_002',
    timestamps: {
      inicio: '2026-02-13T08:00:00Z',
      fin: '2026-02-13T11:30:00Z'
    }
  },
  {
    id: 'activity_001_004',
    workId: 'work_001',
    catalogoId: 'cat_retirar_tuberia',
    nombre: 'Retirar tubería',
    tipo: 'remocion',
    orden: 4,
    status: 'completada',
    ponderacion: 15,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: ['longitud', 'diametro']
    },
    datos: {
      longitud: 48,
      diametro: 8,
      material_retirado: 'concreto simple',
      unidad: 'm'
    },
    evidencias: ['evidence_007', 'evidence_008'],
    usuario: 'user_002',
    timestamps: {
      inicio: '2026-02-13T13:00:00Z',
      fin: '2026-02-13T16:30:00Z'
    }
  },
  {
    id: 'activity_001_005',
    workId: 'work_001',
    catalogoId: 'cat_compactar_tierra',
    nombre: 'Compactar tierra',
    tipo: 'compactacion',
    orden: 5,
    status: 'en_proceso',
    ponderacion: 10,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 1,
      campos_obligatorios: ['capas']
    },
    datos: {
      capas: 2,
      espesor_por_capa: 0.15,
      unidad: 'm'
    },
    evidencias: ['evidence_009'],
    usuario: 'user_002',
    timestamps: {
      inicio: '2026-02-14T08:00:00Z',
      fin: null
    }
  },
  {
    id: 'activity_001_006',
    workId: 'work_001',
    catalogoId: 'cat_colocar_tubo',
    nombre: 'Colocar tubo',
    tipo: 'instalacion',
    orden: 6,
    status: 'pendiente',
    ponderacion: 20,
    requisitos: {
      geometria_requerida: true,
      min_fotos: 3,
      campos_obligatorios: ['diametro', 'material', 'longitud']
    },
    datos: null,
    geometria: null,
    evidencias: [],
    usuario: null,
    timestamps: {
      inicio: null,
      fin: null
    }
  },
  {
    id: 'activity_001_007',
    workId: 'work_001',
    catalogoId: 'cat_cubrir_tubo',
    nombre: 'Cubrir tubo',
    tipo: 'relleno',
    orden: 7,
    status: 'pendiente',
    ponderacion: 10,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: ['material_relleno']
    },
    datos: null,
    evidencias: [],
    usuario: null,
    timestamps: {
      inicio: null,
      fin: null
    }
  },
  {
    id: 'activity_001_008',
    workId: 'work_001',
    catalogoId: 'cat_colocar_cemento',
    nombre: 'Colocar cemento',
    tipo: 'pavimentacion',
    orden: 8,
    status: 'pendiente',
    ponderacion: 15,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: ['acabado', 'espesor']
    },
    datos: null,
    evidencias: [],
    usuario: null,
    timestamps: {
      inicio: null,
      fin: null
    }
  },
  {
    id: 'activity_001_009',
    workId: 'work_001',
    catalogoId: 'cat_prueba_hidraulica',
    nombre: 'Prueba hidráulica',
    tipo: 'inspeccion',
    orden: 9,
    status: 'pendiente',
    ponderacion: 10,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 1,
      campos_obligatorios: ['presion', 'resultado']
    },
    datos: null,
    evidencias: [],
    usuario: null,
    timestamps: {
      inicio: null,
      fin: null
    }
  },
  {
    id: 'activity_001_010',
    workId: 'work_001',
    catalogoId: 'cat_limpieza',
    nombre: 'Limpieza y entrega',
    tipo: 'finalizacion',
    orden: 10,
    status: 'pendiente',
    ponderacion: 5,
    requisitos: {
      geometria_requerida: false,
      min_fotos: 2,
      campos_obligatorios: []
    },
    datos: null,
    evidencias: [],
    usuario: null,
    timestamps: {
      inicio: null,
      fin: null
    }
  }
];

export default mockActivities;
