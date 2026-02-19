# Progreso del Proyecto SAPAL Obras Móvil

**Fecha:** 2026-02-17
**Estado:** En desarrollo (MVP)

---

## ✅ Tareas Completadas

### 1. Descubrimiento de Endpoints GIS
- ✅ Análisis completo de archivos GeoMoose/MapServer
- ✅ Identificación de capas principales (calles, predios, tuberías agua/drenaje)
- ✅ Documentación de endpoints WMS/WFS
- ✅ Identificación de proyección (EPSG:32614 - UTM Zone 14N)
- ✅ Extent del área de servicio documentado
- ✅ URL base de MapServer identificada

**Entregable:** `docs/endpoints.md` (documento completo de 400+ líneas)

### 2. Estructura del Proyecto PWA con Phaser 3
- ✅ Configuración de Vite con PWA plugin
- ✅ package.json con todas las dependencias necesarias
- ✅ Estructura modular de carpetas (separación de responsabilidades)
- ✅ Configuración principal (app.config.js) con todas las constantes
- ✅ HTML de entrada con loading screen responsivo
- ✅ Main.js con inicialización de Phaser y manejo de errores
- ✅ 6 escenas de Phaser creadas (Boot, Login, Home, Map, WorkDetail, ActivityForm)
- ✅ Servicios base: StorageService (IndexedDB) y AuthService
- ✅ Configuración de proyecciones con Proj4js
- ✅ Gitignore, ESLint, README completo

**Entregables:**
- Proyecto completo en `sigsapal-mobile/`
- Listo para `npm install && npm run dev`

---

## 🔄 Tareas En Progreso

### 3. Backend Mock (API REST Simulada)
**Próximo paso:** Crear servidor Express con endpoints mock según sección 9 del plan

Endpoints a implementar:
- POST /api/auth/login
- GET /api/me
- GET /api/works (con filtros)
- GET /api/works/:id
- GET /api/works/:id/activities
- POST /api/works/:id/activities/:activityId/start
- POST /api/works/:id/activities/:activityId/complete
- POST /api/evidence (multipart)
- GET /api/sync/status
- POST /api/sync/batch
- GET /api/maps/proxy (proxy a MapServer con CORS)

---

## 📋 Tareas Pendientes

### 4. MapAdapter con Capas Básicas
- Integración con motor de mapas (MapLibre GL o Leaflet)
- Consumo de WMS desde MapServer
- Transformación de coordenadas EPSG:32614 ↔ EPSG:3857/4326
- Capas conmutables (calles, predios, tuberías)
- GetFeatureInfo para consultas

### 5. Módulo de Autenticación (UI Completo)
- ✅ AuthService ya implementado
- ✅ LoginScene ya implementada
- Pendiente: Logout UI, sesión expirada, refresh token

### 6. Módulo de Obras
- WorksService para gestión de obras
- HomeScene completa con lista de obras
- WorkDetailScene con información y mapa
- Filtros y búsqueda

### 7. Módulo de Actividades
- ActivitiesService con validaciones
- Catálogo de actividades (config/activities.json)
- Checklist interactivo
- ActivityFormScene completo
- Validaciones por tipo de actividad

### 8. Módulo de Evidencias
- EvidenceService
- Captura de cámara
- Compresión de imágenes
- Galería de evidencias
- Metadatos (GPS, timestamp)

### 9. Sincronización Offline
- SyncService con outbox pattern
- Cola de operaciones pendientes
- Retry con exponential backoff
- Resolución de conflictos
- Indicador de estado de sincronización

### 10. Catálogo de Actividades
- JSON con actividades del flujo de cambio de tubería
- Requisitos por actividad
- Validaciones configurables
- Ponderación para cálculo de avance

### 11. Pruebas y Validación
- Tests unitarios (Vitest)
- Pruebas en dispositivos Android/iOS
- Validación de responsive
- Performance testing

---

## 📊 Estadísticas del Proyecto

### Archivos Creados
- **Configuración:** 5 archivos (package.json, vite.config.js, etc.)
- **Código fuente:** 12 archivos JS/JSX
- **Documentación:** 3 archivos MD
- **Total:** ~2,500 líneas de código

### Tecnologías Implementadas
- ✅ Phaser 3.80.1 (UI/Scenes)
- ✅ Vite 5.1.4 (Build tool)
- ✅ PWA con Service Worker
- ✅ IndexedDB via idb 8.0.0
- ✅ Proj4js 2.11.0 (Transformaciones)
- ✅ ES Modules

### Arquitectura
```
Frontend (PWA)
├── Phaser 3 (UI/Scenes)
├── StorageService (IndexedDB)
├── AuthService
└── Config (Proyecciones, Endpoints)

Backend Mock (Pendiente)
├── Express
├── Datos mock
└── Proxy a MapServer

GIS Backend (Existente)
└── MapServer/GeoMoose
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Backend Mock** (en progreso)
   - Crear servidor Express
   - Implementar endpoints de autenticación
   - Implementar endpoints de obras y actividades
   - Crear proxy para MapServer con CORS

2. **Catálogo de Actividades**
   - Definir JSON con actividades de agua y drenaje
   - Incluir requisitos y validaciones

3. **MapAdapter**
   - Decidir motor de mapas (MapLibre o Leaflet)
   - Implementar consumo de WMS
   - Transformaciones de coordenadas

---

## 📝 Notas Técnicas

### Decisiones Importantes
1. **PWA en lugar de Capacitor:** Para MVP más rápido
2. **Phaser para UI:** Aprovecha experiencia y flexibilidad
3. **IndexedDB:** Almacenamiento offline robusto
4. **Mock backend:** Permite desarrollo sin dependencias

### Proyección Geográfica
- **Nativa:** EPSG:32614 (UTM Zone 14N)
- **Display:** EPSG:3857 (Web Mercator)
- **GPS:** EPSG:4326 (WGS84)
- **Transformaciones:** Manejadas por Proj4js

### Datos del Sistema Existente
- **MapServer URL:** https://wsorquestador.sapal.gob.mx/...
- **Autenticación:** Usuario + Token JWT + GID
- **Capas principales:** 4 identificadas y documentadas
- **Servicios:** WMS, WFS, GetFeatureInfo

---

## 🚀 Instrucciones para Continuar

### Desarrollo Local
```bash
cd sigsapal-mobile

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar dev server
npm run dev

# En otra terminal, iniciar backend mock (cuando esté listo)
cd ../backend-mock
npm run dev
```

### Credenciales de Prueba
- **admin** / **admin** (Rol: admin)
- **supervisor** / **supervisor** (Rol: supervisor)
- **coordinador** / **coordinador** (Rol: coordinador)

---

**Última actualización:** 2026-02-17 16:30
