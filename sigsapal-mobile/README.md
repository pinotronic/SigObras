# SAPAL Obras Móvil

Aplicación móvil PWA para seguimiento de obras de agua y drenaje - SAPAL León, Guanajuato.

## Tecnologías

- **Phaser 3** - Motor de juegos/UI para interfaz interactiva
- **Vite** - Build tool y dev server
- **PWA** - Progressive Web App para instalación móvil
- **Proj4js** - Transformación de coordenadas geográficas
- **IndexedDB** - Almacenamiento local offline-first

## Arquitectura

```
src/
├── scenes/          # Escenas de Phaser (pantallas)
│   ├── boot/        # Carga inicial
│   ├── login/       # Autenticación
│   ├── home/        # Lista de obras
│   ├── map/         # Visualización de mapas
│   ├── work-detail/ # Detalle de obra
│   └── activity-form/ # Formulario de actividad
├── modules/         # Módulos de negocio
│   ├── auth/        # Autenticación y roles
│   ├── maps/        # MapAdapter y servicios GIS
│   ├── works/       # Gestión de obras
│   ├── activities/  # Actividades y validaciones
│   ├── evidence/    # Fotos y evidencias
│   ├── sync/        # Sincronización offline
│   └── storage/     # Persistencia local
├── config/          # Configuración
├── utils/           # Utilidades compartidas
└── assets/          # Recursos estáticos
```

## Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Tests
npm test
```

## Configuración

1. Copiar `.env.example` a `.env`
2. Configurar variables de entorno
3. Revisar `src/config/app.config.js` para ajustes específicos

## Endpoints GIS

Ver documentación completa en: `../docs/endpoints.md`

**URL Base MapServer:**
```
https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData
```

**Proyección:** EPSG:32614 (UTM Zone 14N)

## Capas Principales

- Calles: `SS_MAP_GRAL_CALLES`
- Predios: `SS_MAP_INFO_PREDIOS`
- Tuberías Agua: `SS_MAP_AGUA_TUBERIA`
- Tuberías Drenaje: `SS_MAP_DREN_TUBERIA_DRENAJE`

## Flujo de Trabajo

1. **Login** → Autenticación con token JWT
2. **Home** → Lista de obras asignadas
3. **Mapa** → Visualización con capas conmutables
4. **Obra** → Detalle y checklist de actividades
5. **Actividad** → Registro de avance + evidencia
6. **Sync** → Sincronización cuando haya conexión

## Offline-First

La aplicación funciona completamente offline:

- Datos sincronizados se almacenan en IndexedDB
- Cola de cambios pendientes (outbox)
- Reintentos automáticos al recuperar conexión
- Cache de tiles de mapa

## Scripts de Desarrollo

```bash
# Linter
npm run lint

# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Build de desarrollo
npm run build:dev
```

## Despliegue

### PWA (Recomendado para MVP)
```bash
npm run build
# Servir carpeta dist/ desde servidor web con HTTPS
```

### Capacitor (Futuro)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
```

## Estructura de Datos

Ver `src/config/schema.js` para modelos de datos completos.

### Entidades Principales
- `User` - Usuario autenticado
- `Work` - Obra asignada
- `Activity` - Actividad del catálogo
- `ActivityExecution` - Ejecución de actividad en obra
- `Evidence` - Foto/nota de evidencia
- `SyncOutbox` - Cola de sincronización

## Seguridad

- Tokens JWT con expiración
- Cifrado opcional de evidencias locales
- Validación de inputs en cliente y servidor
- Headers CORS apropiados
- Sanitización de geometrías

## Performance

- Lazy loading de módulos
- Code splitting automático (Vite)
- Cache de tiles con IndexedDB
- Compresión de imágenes antes de subir
- Debouncing en búsquedas

## Compatibilidad

- Android 8.0+
- iOS 12+
- Navegadores modernos con soporte PWA
- Pantallas: 320px - 1920px

## Licencia

Propietario - SAPAL León, Guanajuato

## Soporte

Para issues técnicos, consultar documentación en `docs/` o contactar al equipo de desarrollo.
