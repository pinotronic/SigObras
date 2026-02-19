# Plan y especificación para app móvil (Phaser) de seguimiento de obras + mapas (GeoMoose/MapServer) — SIG SAPAL León
_Fecha: 2026-02-17_

## 0) Principios de diseño aplicados
- **Claridad:** una sola fuente de verdad (este documento) + checklist; requisitos redactados como reglas verificables; flujos paso a paso.
- **Modularidad:** separación estricta por dominios (Mapas / Obras / Evidencia / Sincronización / Seguridad / UI); contratos de API y eventos entre módulos.
- **Evolución:** extensible por configuración (catálogo de actividades, etapas, capas, estilos), composición sobre herencia; nuevas actividades/capas sin tocar el núcleo.

---

## 1) Contexto y objetivos
### 1.1 Contexto actual
- Existe un **GeoMoose** que consume **MapServer** para servir mapas e informes geográficos.
- Ubicación de referencia (en equipo local):  
  `C:\Users\pvargas\Documents\SVN\geomouse\branches\Dev\02 Desarrollo\geomoose\SigSapal`  
  (Se usará para **descubrir endpoints**, capas, servicios y reportes existentes).

### 1.2 Objetivo del nuevo producto
Crear una **aplicación móvil** (tabletas y celulares) basada en **Phaser** que:
- Muestre mapas (calles, predios, tuberías de drenaje y agua potable).
- Permita **dar seguimiento a obras** con un flujo de actividades (p. ej. cambio de tubería) registrando avances, evidencias y georreferenciación.
- Trabaje con conectividad variable (idealmente **offline-first** con sincronización).

### 1.3 Usuarios principales
- **Supervisor de obra:** registra avance por actividad/etapa, marca áreas, adjunta evidencia, valida materiales y observaciones.
- **Coordinador / Administrativo:** consulta avances, métricas, exporta informes, revisa evidencias.
- **Consulta** (solo lectura): visualiza mapas y estado general.

---

## 2) Alcance funcional (MVP y fases)
### 2.1 MVP (mínimo viable)
1. **Autenticación** (al menos usuario/contraseña; ideal: token).
2. **Mapa base** con capas conmutables:
   - Calles
   - Predios
   - Tuberías de drenaje
   - Tuberías de agua potable
3. **Obras**:
   - Listado de obras asignadas (por usuario/rol).
   - Detalle de obra (ubicación, tramo, datos generales).
4. **Seguimiento por actividades** (checklist por obra):
   - Marcar área a reemplazar (geometría)
   - Quitar concreto / corte
   - Descubrir tubería
   - Retirar tubería
   - Compactar tierra
   - Colocar tubo
   - Cubrir tubo
   - Colocar cemento
   - (y otras configurables)
5. **Evidencia**:
   - Fotos (con timestamp y ubicación si se permite).
   - Notas/observaciones.
6. **Sincronización básica**:
   - Cola local de cambios.
   - Reintento en background cuando haya conexión.
7. **Panel simple**:
   - % avance por obra (por actividades completadas / ponderación).

### 2.2 Fase 2 (alto valor)
- Firmas de conformidad.
- Control de calidad (campos requeridos por etapa).
- Materiales y volúmenes (p. ej. metros lineales, diámetro, profundidad).
- Exportación de reporte PDF/HTML.
- Notificaciones (cambios, rechazos, incidencias).

### 2.3 Fase 3
- Analítica avanzada y tablero web.
- Integración con ERP/CMMS (si existe).
- Ruteo y asignación dinámica.

---

## 3) Reglas de negocio (seguimiento de obra)
### 3.1 Modelo de actividad
Cada **Actividad** tiene:
- `id`, `nombre`, `descripcion`
- `tipo` (marcación, excavación, instalación, compactación, pavimentación, inspección…)
- `requisitos` (campos obligatorios, mínimo de fotos, validaciones)
- `orden` (secuencia sugerida)
- `estado` por obra: `Pendiente | EnProceso | Bloqueada | Completada | Rechazada`
- `evidencias` (fotos, notas, mediciones)
- `geometria` opcional (polígono, línea, punto)

### 3.2 Flujo típico (cambio de tubería de drenaje)
- (1) Marcar área a reemplazar (polígono/rectángulo sobre mapa)
- (2) Quitar concreto (fecha/hora, fotos antes/después)
- (3) Descubrir tubería (profundidad, fotos)
- (4) Retirar tubería (longitud retirada, fotos)
- (5) Compactar tierra (capas, evidencias)
- (6) Colocar tubo (diámetro, material, longitud, fotos)
- (7) Cubrir tubo (relleno, evidencias)
- (8) Colocar cemento (acabado, fotos, fecha/hora)

### 3.3 Validaciones mínimas sugeridas
- No permitir completar una actividad si faltan campos requeridos.
- Secuencia: permitir “saltos” solo con motivo y/o rol autorizado.
- Evidencia: mínimo 1 foto en actividades críticas (configurable).
- Geometría: el área marcada debe estar dentro de un radio respecto a la obra/tramo (configurable).

---

## 4) Descubrimiento de endpoints y capas (GeoMoose/MapServer)
> **Este paso es clave**: no se deben inventar URLs. La IA debe inspeccionar el proyecto existente en la ruta indicada.

### 4.1 Qué buscar en `SigSapal`
Buscar y documentar:
- Archivos de configuración de GeoMoose (típicos: `mapbook.xml`, `mapbook.json`, `services.json`, `config.js`, etc.).
- Mapfiles de MapServer (`*.map`) y sus capas (`LAYER`, `DATA`, `CONNECTION`, `METADATA`).
- Endpoints existentes para:
  - Mapas (WMS/WMTS/TMS/tiles)
  - Consultas (WFS, MapServer query, o servicios GeoMoose)
  - Reportes/prints (si los hay)
  - Búsquedas (predio por clave, calle por nombre, etc.)

### 4.2 Comandos/acciones sugeridas (local)
- Buscar texto por palabras clave: `wms`, `wfs`, `SERVICE=`, `mapserver`, `GetMap`, `GetFeatureInfo`, `print`, `report`, `identify`.
- Inventario por capa: nombre, proyección, estilo, escala, filtros y campos disponibles.

### 4.3 Resultado esperado de este paso
Crear una tabla de referencia (en este mismo documento o archivo aparte) con:
- **Nombre de capa**
- **Servicio** (WMS/WFS/tiles/otro)
- **URL base**
- **Parámetros requeridos**
- **Ejemplos de solicitud**
- **Campos devueltos** (si es consulta)
- **Limitaciones** (CORS, auth, tamaño de imagen, etc.)

---

## 5) Arquitectura de la app móvil (Phaser)
### 5.1 Decisión técnica: Phaser + mapas
Phaser es excelente para UI interactiva, pero los mapas geográficos suelen manejarse mejor con un motor de mapas.
Hay 2 enfoques:

**A) Integrar un motor de mapas (recomendado)**
- MapLibre GL / Leaflet (según el tipo de servicio: tiles vectoriales o raster).
- Phaser se usa para UI, overlays, minijuegos/gestos avanzados, y composición.
- Pro: performance y estándares.
- Contra: integración requiere puente de eventos/capas.

**B) Renderizar tiles en Phaser (posible si es raster)**
- Consumir tiles (XYZ/TMS) como texturas y montar un “tilemap”.
- Pro: todo en Phaser.
- Contra: reimplementas muchas funciones GIS (proyecciones, escalas, queries).

**Recomendación para MVP:**  
- Si MapServer/GeoMoose ya expone WMS, construir un **servicio intermedio** que entregue **tiles XYZ** (cacheados) o usar un proxy/tiler.  
- Para interacción y consultas, usar `GetFeatureInfo` (WMS) o WFS cuando aplique.

### 5.2 Capas de la app (separación de responsabilidades)
- **UI (Phaser Scenes):** navegación, paneles, formularios, cámara, listas.
- **MapAdapter:** encapsula el motor de mapas o tile renderer.
- **WorkOrders (Obras):** CRUD, asignaciones, estados.
- **Activities:** catálogo + estado por obra + validaciones.
- **Evidence:** fotos, notas, adjuntos.
- **Sync:** cola local, retry, conflictos.
- **Auth & Roles:** login, permisos, expiración token.
- **Storage:** IndexedDB/SQLite (según wrapper), cifrado opcional.
- **Telemetry:** logs y métricas.

---

## 6) Modelo de datos (mínimo)
### 6.1 Entidades
**Usuario**
- id, nombre, rol, unidad, token/refreshToken (si aplica)

**Obra**
- id, folio, tipo (agua/drenaje/mixta), estatus, responsable, fechas, ubicación (geom), tramo (línea), notas

**ActividadCatalogo**
- id, nombre, orden, requisitos, ponderación (%), aplicaA (tipos de obra)

**ActividadEjecucion**
- id, obraId, actividadCatalogoId, estado, timestamps, usuarioId, motivo (si salto/rechazo), métricas (m, m3, etc.), geometría (opcional)

**Evidencia**
- id, actividadEjecucionId, tipo (foto/video/nota), uriLocal, uriRemota, fecha, gps, comentario

**SyncOutbox**
- id, tipoEntidad, payload, estado, reintentos, lastError

### 6.2 Estados y transiciones (simplificado)
- Pendiente → EnProceso → Completada
- Pendiente/EnProceso → Bloqueada (con motivo)
- Completada → Rechazada (rol autorizado) → EnProceso

---

## 7) UX móvil (tabletas y celulares)
### 7.1 Principios
- Diseño “thumb-friendly” (botones grandes, acciones rápidas).
- Modo día/noche (opcional).
- Accesible sin teclado lo más posible.

### 7.2 Pantallas mínimas (MVP)
1. Login
2. Inicio (obras asignadas + buscador)
3. Mapa (capas + leyenda + localizarme + medir simple)
4. Detalle de obra (info + acciones)
5. Checklist de actividades (con estado y %)
6. Formulario de actividad (campos requeridos + evidencia)
7. Evidencias (galería)
8. Sincronización (estado y errores)

### 7.3 Interacciones clave en mapa
- Selección de obra/tramo.
- Marcación de área: polígono libre + rectángulo.
- “Identificar” (tap) para obtener información de predio/tubería/calle (si endpoint existe).
- Mostrar progreso (colores por estado).

---

## 8) Seguridad y cumplimiento
- Autenticación por token (JWT o similar) si existe backend.
- Roles: supervisor/coordinador/consulta.
- Cifrado local opcional para evidencias (si es sensible).
- Auditoría: quién cambió qué y cuándo.

---

## 9) Backend recomendado (si no existe)
> Si ya hay un backend, mapear a estos contratos. Si no, crear uno mínimo (Node/Express, .NET, PHP, etc.) para orquestar.

### 9.1 Endpoints sugeridos (contratos)
- `POST /auth/login`
- `GET /me`
- `GET /works?assignedTo=...`
- `GET /works/:id`
- `GET /works/:id/activities`
- `POST /works/:id/activities/:activityId/start`
- `POST /works/:id/activities/:activityId/complete`
- `POST /evidence` (multipart: foto + metadatos)
- `GET /sync/status`
- `POST /sync/batch`

### 9.2 Integración GIS
- Proxy seguro hacia MapServer/GeoMoose (evita CORS, agrega auth, cache).
- Adaptación de WMS → tiles (si aplica) y `GetFeatureInfo`.

---

## 10) Checklist de ejecución (plan de trabajo)
### 10.1 Preparación
- [ ] Inventariar capas y servicios en `SigSapal` (WMS/WFS/tiles/reportes).
- [ ] Definir roles y permisos.
- [ ] Definir catálogo inicial de actividades (agua y drenaje).
- [ ] Definir campos obligatorios por actividad.

### 10.2 Diseño técnico
- [ ] Elegir enfoque de mapa (motor externo vs tiles en Phaser).
- [ ] Definir modelo de datos local + sincronización.
- [ ] Definir contratos de backend (o adaptar a los existentes).
- [ ] Definir estrategia offline (cola, conflictos, reintentos).

### 10.3 Implementación MVP
- [ ] Scaffold del proyecto (Phaser + empaquetado móvil: Capacitor/Cordova o PWA).
- [ ] Módulo Auth.
- [ ] Módulo MapAdapter + capas básicas.
- [ ] Módulo Obras (listado/detalle).
- [ ] Módulo Actividades (checklist + validaciones).
- [ ] Evidencia (cámara/galería + metadatos).
- [ ] Sync básico (outbox + retry).
- [ ] Pruebas en dispositivos (tablet y teléfono).

### 10.4 Hardening
- [ ] Manejo de errores y logs.
- [ ] Performance (cache de tiles, compresión de imágenes).
- [ ] Seguridad (tokens, expiración, permisos).
- [ ] UAT con supervisores reales.

---

## 11) “Instrucciones para IA generadora” (prompt operativo)
> Copia y pega este bloque como instrucción principal para la IA que generará la aplicación.  
> Ajusta las URLs reales una vez descubiertas en el paso 4.

### 11.1 Objetivo
Construye una aplicación móvil (PWA o empaquetada con Capacitor) usando **Phaser 3** para UI y experiencia principal, que permita:
- Visualizar mapas (calles, predios, tuberías agua/drenaje) desde servicios existentes de GeoMoose/MapServer.
- Gestionar obras y registrar avances por actividades con evidencia y georreferenciación.
- Funcionar en tabletas y celulares, con modo offline y sincronización.

### 11.2 Restricciones
- No inventes endpoints: primero inspecciona el proyecto en:
  `C:\Users\pvargas\Documents\SVN\geomouse\branches\Dev\02 Desarrollo\geomoose\SigSapal`
- La app debe ser **responsive** y usable con dedos (controles grandes).
- Evita acoplar UI a servicios: usa adaptadores y contratos.
- Toda actividad y sus reglas deben ser **configurables** (JSON).

### 11.3 Entregables
1. Repositorio con:
   - App móvil (Phaser) + build scripts
   - Módulos: Auth, MapAdapter, Obras, Actividades, Evidencia, Sync, Storage
2. Archivo `config/activities.json` con catálogo inicial.
3. Documento `docs/endpoints.md` con inventario real de servicios GIS.
4. Tests básicos (unitarios para validaciones y sync).

### 11.4 Pasos obligatorios (orden)
1. **Descubre endpoints** leyendo configs/archivos del GeoMoose/MapServer (paso 4).
2. Implementa `MapAdapter`:
   - Si hay tiles XYZ, consúmelos directo.
   - Si hay WMS, implementa `GetMap` y `GetFeatureInfo` (o crea/propuesta de proxy tiler).
3. Implementa almacenamiento local:
   - Outbox de sincronización (cola).
   - Cache de mapas (si aplica) y cache de obras/actividades.
4. Implementa módulo de Obras y Actividades:
   - Checklist por obra basado en catálogo JSON.
   - Validaciones por actividad (campos requeridos, evidencia mínima).
5. Implementa Evidencia:
   - Captura de foto, compresión, guardado local, subida al sincronizar.
6. Implementa UI móvil:
   - Pantallas: login, listado obras, detalle, mapa, checklist, formulario actividad, evidencias, sync.
7. Prueba en Android tablet y Android phone (mínimo).

### 11.5 Criterios de aceptación (verificables)
- Puede activar/desactivar capas (calles, predios, tuberías).
- Puede seleccionar una obra y verla en mapa.
- Puede marcar un polígono/área asociada a una actividad.
- Puede completar una actividad solo si cumple requisitos (incl. evidencia).
- Puede operar sin internet y sincronizar cuando vuelva la conectividad.
- Registra auditoría mínima: usuario y timestamp por acción.

---

## 12) Notas de implementación (recomendaciones prácticas)
- **Empaquetado móvil:** PWA para MVP; Capacitor si se requiere cámara nativa y mejor offline.
- **Fotos:** comprimir antes de guardar/subir (tamaño objetivo configurable).
- **CORS:** probablemente necesitarás un **proxy** para MapServer/GeoMoose.
- **Proyección:** documentar EPSG usado (p. ej. 4326/3857 o local). No asumir; leer de mapfiles/config.
- **Rendimiento:** cache de tiles + limitar resolución de WMS.

---

## 13) Próximo paso inmediato (acción concreta)
1) Ejecutar el **inventario de endpoints** (sección 4) y completar `docs/endpoints.md`.  
2) Con esa tabla, elegir el enfoque A o B de mapas (sección 5.1).  
3) Iniciar MVP con el checklist (sección 10.3).

