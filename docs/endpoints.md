# Inventario de Endpoints y Servicios GIS - SAPAL León

**Fecha de descubrimiento:** 2026-02-17
**Fuente:** Proyecto GeoMoose/MapServer existente

---

## 1. Endpoint Principal

### URL Base de MapServer
```
https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData
```

### Autenticación Requerida
El servicio requiere tres parámetros de autenticación:
- `clusuario`: Clave del usuario
- `clToken`: Token JWT de sesión
- `pGid`: ID de grupo/usuario

**Formato del mapfile_root:**
```
clusuario={usuario}/clToken={token}/pGid={gid}
```

### Ambiente
- **Producción:** `https://wsorquestador.sapal.gob.mx/...`
- **Otros ambientes:** `https://{environment}.wsorquestador.sapal.gob.mx/...`

---

## 2. Proyección y Extent

### Sistema de Coordenadas
- **EPSG:** 32614 (UTM Zone 14N, WGS 84)
- **Unidades:** Metros
- **SRS Soportados:** EPSG:32614, EPSG:3857 (Web Mercator)

### Extent del Área de Servicio (UTM metros)
```
MINX: 182916.955339
MINY: 2309262.755359
MAXX: 254143.488068
MAXY: 2360276.552781
```

**Para conversión a Web Mercator (EPSG:3857):**
Se requiere transformación de coordenadas para uso en mapas web estándar.

---

## 3. Capas Principales para el MVP

### 3.1 Calles
| Atributo | Valor |
|----------|-------|
| **Nombre de capa** | SS_MAP_GRAL_CALLES |
| **Mapfile** | map_calles.map |
| **Tipo** | LINE |
| **Servicio** | WMS, WFS |
| **Escalas** | Variable según mapfile |
| **Campos disponibles** | Nombres de calles, geometría |
| **URL ejemplo WMS** | `{base_url}?SERVICE=WMS&REQUEST=GetMap&LAYERS=SS_MAP_GRAL_CALLES&...` |

### 3.2 Predios
| Atributo | Valor |
|----------|-------|
| **Nombre de capa** | SS_MAP_INFO_PREDIOS |
| **Mapfile** | map_predios.map |
| **Tipo** | POLYGON |
| **Servicio** | WMS, WFS, GetFeatureInfo |
| **Escala máxima** | 1:15,900 |
| **Campos principales** | id_elemento_geografico, cl_estado, cl_tipo_predio, cl_niple_supresor |
| **Conexión** | PostgreSQL/PostGIS (includes/conexion_gestion_infra.map) |
| **Tabla fuente** | op.mv_gm_predio_cuenta |

**Clasificación de predios:**
- Área verde (cl_tipo_predio = 22): Verde
- Área de donación (cl_tipo_predio = 1)
- Niple supresor (cl_niple_supresor = "R"): Rojo punteado

### 3.3 Tuberías de Agua Potable
| Atributo | Valor |
|----------|-------|
| **Nombre de capa** | SS_MAP_AGUA_TUBERIA |
| **Mapfile** | map_tuberia_agua.map |
| **Tipo** | LINE |
| **Servicio** | WMS |
| **Escalas** | 1 a 15,000 |
| **Campos principales** | gid, diametro, geometry |
| **Conexión** | PostgreSQL/PostGIS |
| **Tabla fuente** | tuberiassec |
| **Filtro** | cl_responsable_mantenimiento=1 |

**Clasificación por diámetro:**
- 1 pulgada: Negro sólido, width 2
- 1.5 pulgadas: Negro con patrón
- 2 pulgadas: Negro con patrón diferente
- 2.5, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36 pulgadas: Diversos estilos

**Capa adicional de información:**
- SS_MAP_AGUA_TUBERIA_INFO: Etiquetas con diámetro (azul, size 20)

### 3.4 Tuberías de Drenaje
| Atributo | Valor |
|----------|-------|
| **Nombre de capa** | SS_MAP_DREN_TUBERIA_DRENAJE |
| **Mapfile** | map_tuberia_drenaje.map |
| **Tipo** | LINE |
| **Servicio** | WMS, WFS |
| **Servicio WFS** | wfstuberiassanitarias |
| **Campos disponibles** | Diámetro, material, geometría |

**Capas relacionadas:**
- SS_MAP_DREN_POZOS_DRENAJE (Pozos): Puntos con WFS
- SS_MAP_DREN_CAPTACION_DRENAJE (Captación)
- SS_MAP_DREN_DRENAJE_SECTORES (Sectores)

---

## 4. Capas Adicionales Relevantes

### 4.1 Información General
- **Límite Municipal:** SS_MAP_GRAL_LIMITE_MUNICIPAL (map_limite_municipal.map)
- **Colonias:** SS_MAP_GRAL_COLONIAS (map_colonias.map)
- **Límite de Colonias:** SS_MAP_GRAL_LIMITE_COLONIAS (map_limite_colonias.map) - WFS
- **Delegaciones:** SS_MAP_GRAL_DELEGACIONES (map_delegaciones.map) - WFS
- **Códigos Postales:** SS_MAP_GRAL_CODIGOS_POSTALES (map_codigo_postal.map)
- **Instalaciones SAPAL:** SS_MAP_GRAL_INSTALACIONES (map_instalacion_sapal.map) - WFS

### 4.2 Otras Capas de Infraestructura
- **Pozos de Drenaje:** SS_MAP_DREN_POZOS_DRENAJE
- **Válvulas de Agua:** SS_MAP_AGUA_VALVULAS
- **Medidores:** Múltiples capas de medidores

---

## 5. Servicios Soportados

### 5.1 WMS (Web Map Service)
**Operaciones soportadas:**
- GetCapabilities
- GetMap
- GetFeatureInfo (para capas consultables)

**Formato de solicitud GetMap:**
```
{base_url}?
  SERVICE=WMS&
  VERSION=1.3.0&
  REQUEST=GetMap&
  LAYERS={layer_name}&
  STYLES=&
  CRS=EPSG:32614&
  BBOX={minx},{miny},{maxx},{maxy}&
  WIDTH={width}&
  HEIGHT={height}&
  FORMAT=image/png
```

### 5.2 WFS (Web Feature Service)
Disponible para capas específicas marcadas con "wfs" en el mapbook.

**Formato de solicitud GetFeature:**
```
{base_url}?
  SERVICE=WFS&
  VERSION=1.1.0&
  REQUEST=GetFeature&
  TYPENAME={layer_name}&
  OUTPUTFORMAT=application/json
```

**Capas con WFS:**
- SS_MAP_GRAL_INSTALACIONES (wfsinstalacionessapal)
- SS_MAP_GRAL_LIMITE_COLONIAS (limites_colonias_wfs)
- SS_MAP_GRAL_DELIMITACION_PATRON (wfsdelimitacionpatron)
- SS_MAP_GRAL_DELEGACIONES (wfsdelegaciones)
- SS_MAP_DREN_POZOS_DRENAJE (wfspozosdrenaje)
- SS_MAP_AGUA_VALVULAS (wfsvalvulas)

### 5.3 GetFeatureInfo
Para consultas puntuales sobre elementos en el mapa.

**Formato:**
```
{base_url}?
  SERVICE=WMS&
  VERSION=1.3.0&
  REQUEST=GetFeatureInfo&
  LAYERS={layer_name}&
  QUERY_LAYERS={layer_name}&
  I={x}&
  J={y}&
  WIDTH={width}&
  HEIGHT={height}&
  CRS=EPSG:32614&
  BBOX={bbox}&
  INFO_FORMAT=application/geo+json
```

**Formatos de respuesta soportados:**
- application/geo+json (preferido)
- application/json
- text/plain
- application/vnd.ogc.gml

---

## 6. Configuración de Conexión a Base de Datos

Las capas se conectan a PostgreSQL/PostGIS mediante includes:

### Archivos de Conexión
- `includes/conexion.map` - Conexión principal
- `includes/conexionGeo.map` - Conexión geográfica
- `includes/conexionInfraestructura.map` - Conexión a infraestructura
- `includes/conexion_gestion_infra.map` - Gestión de infraestructura

**Optimizaciones aplicadas:**
- `PROCESSING "CLOSE_CONNECTION=DEFER"` - Reutiliza conexiones
- `PROCESSING "POSTGIS_FILTER=YES"` - Filtrado en servidor

---

## 7. Limitaciones y Consideraciones

### 7.1 CORS
Es probable que se requiera un **proxy** para consumir desde aplicaciones web debido a políticas CORS.

**Solución recomendada:**
- Crear un servicio proxy en el backend mock que agregue headers CORS apropiados
- Alternativamente, configurar MapServer para enviar headers CORS

### 7.2 Autenticación
- **Problema:** GeoMoose no puede enviar tokens JWT en headers estándar
- **Workaround actual:** Token se pasa en la URL del mapfile_root
- **Para MVP:** El backend mock debe simular este mecanismo

### 7.3 Escalas y Rendimiento
- Muchas capas tienen restricciones MINSCALE/MAXSCALE
- Para performance, limitar requests a escalas apropiadas
- Considerar tile caching para capas base

### 7.4 Transformación de Coordenadas
- Los datos están en EPSG:32614 (UTM)
- Mapas web típicamente usan EPSG:3857 (Web Mercator)
- Se requiere transformación de coordenadas para:
  - Visualización en mapas web estándar
  - Geolocalización (GPS devuelve EPSG:4326/WGS84)

---

## 8. Estrategia para el MVP

### 8.1 Enfoque Recomendado: Hybrid

**Backend Mock debe:**
1. Simular el endpoint de autenticación con tokens mock
2. Crear un proxy que:
   - Agregue autenticación a requests de MapServer
   - Maneje transformaciones de coordenadas si necesario
   - Agregue headers CORS
   - Cache responses para mejorar performance

### 8.2 Endpoints del Backend Mock (basados en sección 9 del plan)

**Autenticación:**
```
POST /api/auth/login
  → { username, password }
  ← { token, user: { id, nombre, rol, unidad } }

GET /api/me
  → Headers: { Authorization: Bearer {token} }
  ← { user data }
```

**Mapas (Proxy a MapServer):**
```
GET /api/maps/wms
  → Parámetros WMS estándar
  ← Imagen o datos según REQUEST

GET /api/maps/wfs
  → Parámetros WFS estándar
  ← GeoJSON con features
```

**Obras:**
```
GET /api/works?assignedTo={userId}
  ← Array de obras asignadas

GET /api/works/:id
  ← Detalle de obra con geometría

GET /api/works/:id/activities
  ← Checklist de actividades
```

**Actividades:**
```
POST /api/works/:workId/activities/:activityId/start
  → { timestamp, location }
  ← { status, activity }

POST /api/works/:workId/activities/:activityId/complete
  → { evidenceIds, metrics, notes }
  ← { status, activity }
```

**Evidencias:**
```
POST /api/evidence
  → multipart/form-data: { file, activityId, location, notes }
  ← { id, uriLocal, timestamp }
```

**Sincronización:**
```
GET /api/sync/status
  ← { pendingCount, lastSync }

POST /api/sync/batch
  → { operations: [{ type, entity, payload }] }
  ← { synced, errors }
```

---

## 9. Archivos de Referencia

### Configuración GeoMoose
- `/app.js` - Aplicación principal
- `/config.js` - Configuración de endpoints
- `/mapbook.xml` - Catálogo completo de capas y servicios
- `/es.json` - Traducciones al español

### Mapfiles por Categoría

**Generales:**
- `map_calles.map`
- `map_predios.map`
- `map_colonias.map`
- `map_delegaciones.map`
- `map_limite_municipal.map`

**Agua Potable:**
- `map_tuberia_agua.map` ⭐ (Principal)
- `map_tuberia_agua_condominios.map`
- `map_valvula_agua.map`

**Drenaje:**
- `map_tuberia_drenaje.map` ⭐ (Principal)
- `map_pozo_drenaje.map`
- `map_captacion_drenaje.map`

**Agua Tratada:**
- `map_tuberia_agua_tratada.map`
- `map_valvula_agua_tratada.map`

### Includes Compartidos
- `includes/globals.map` - Configuración global
- `includes/common_metadata.map` - Metadatos comunes
- `includes/conexion*.map` - Strings de conexión a BD
- `includes/temp_directory.map` - Directorio temporal

---

## 10. Próximos Pasos

✅ **Completado:** Inventario de endpoints y capas

**Pendiente:**
1. Crear estructura de proyecto PWA con Phaser 3
2. Implementar backend mock con los endpoints documentados
3. Implementar MapAdapter que consuma estos servicios
4. Implementar transformaciones de coordenadas (EPSG:32614 ↔ EPSG:3857/4326)
5. Agregar caching de tiles para performance
6. Implementar módulos de Obras, Actividades y Evidencias

---

## Notas Técnicas Adicionales

### Herramientas Útiles
- **proj4js:** Para transformación de coordenadas en JavaScript
- **MapLibre GL JS:** Motor de mapas recomendado para tiles vectoriales
- **Leaflet:** Alternativa más simple para tiles raster
- **OpenLayers:** Opción robusta con soporte nativo para WMS/WFS

### Referencias
- EPSG:32614 Info: https://epsg.io/32614
- MapServer Documentation: https://mapserver.org/
- GeoMoose Documentation: https://www.geomoose.org/

---

**Documento generado automáticamente mediante análisis del proyecto existente.**
