# SAPAL Backend Mock

Servidor Express mock para desarrollo de la aplicación móvil SAPAL Obras.

## Características

- ✅ Autenticación con JWT mock
- ✅ CRUD de obras y actividades
- ✅ Subida de evidencias (fotos)
- ✅ Sincronización batch
- ✅ Proxy a MapServer con CORS
- ✅ Datos mock realistas

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor se iniciará en `http://localhost:3001`

## Endpoints Disponibles

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token

### Obras

- `GET /api/works` - Listar obras (filtros: assignedTo, tipo, status, prioridad)
- `GET /api/works/:id` - Detalle de obra
- `GET /api/works/:id/activities` - Actividades de una obra

### Actividades

- `POST /api/activities/:workId/:activityId/start` - Iniciar actividad
- `POST /api/activities/:workId/:activityId/complete` - Completar actividad
- `GET /api/activities/:workId/:activityId` - Detalle de actividad

### Evidencias

- `POST /api/evidence` - Subir evidencia (multipart/form-data)
- `GET /api/evidence/:id` - Obtener evidencia
- `DELETE /api/evidence/:id` - Eliminar evidencia

### Sincronización

- `GET /api/sync/status` - Estado de sincronización
- `POST /api/sync/batch` - Sincronizar lote de operaciones

### Mapas

- `GET /api/maps/proxy` - Proxy a MapServer (params WMS/WFS)
- `GET /api/maps/layers` - Info de capas disponibles

### Utilidades

- `GET /health` - Health check
- `GET /` - Info del servidor y endpoints

## Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin | admin |
| supervisor | supervisor | supervisor |
| coordinador | coordinador | coordinador |
| supervisor2 | supervisor2 | supervisor |
| consulta | consulta | consulta |

## Ejemplo de Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Respuesta:
```json
{
  "success": true,
  "token": "mock_user_001_1234567890_uuid",
  "expiresAt": 1234567890000,
  "user": {
    "id": "user_001",
    "username": "admin",
    "nombre": "Administrador del Sistema",
    "rol": "admin",
    "unidad": "Dirección General",
    "email": "admin@sapal.gob.mx"
  }
}
```

## Ejemplo de Obtener Obras

```bash
curl -X GET "http://localhost:3001/api/works?assignedTo=user_002" \
  -H "Authorization: Bearer {token}"
```

## Ejemplo de Subir Evidencia

```bash
curl -X POST http://localhost:3001/api/evidence \
  -H "Authorization: Bearer {token}" \
  -F "file=@foto.jpg" \
  -F "activityId=activity_001_005" \
  -F "notes=Compactación capa 1" \
  -F "latitude=21.1234" \
  -F "longitude=-101.5678"
```

## Datos Mock

### 3 Obras
- OBRA-2026-001: Drenaje en Centro (en proceso, 40%)
- OBRA-2026-002: Agua en Zona Norte (programada)
- OBRA-2026-003: Mixta en Zona Sur (en proceso, 30%)

### 10 Actividades por Obra
Basadas en el flujo de cambio de tubería:
1. Marcar área
2. Quitar concreto
3. Descubrir tubería
4. Retirar tubería
5. Compactar tierra
6. Colocar tubo
7. Cubrir tubo
8. Colocar cemento
9. Prueba hidráulica
10. Limpieza

## Notas de Desarrollo

- Las sesiones se guardan en memoria (se pierden al reiniciar)
- Las evidencias se guardan en memoria (buffer)
- No hay persistencia en base de datos
- El proxy a MapServer puede fallar si no hay conexión

## Variables de Entorno

```bash
# Puerto del servidor
PORT=3001

# Autenticación
# - external: valida contra wsautenticador (dev) y devuelve token real para MapServer
# - mock: valida contra usuarios locales (admin/admin, etc.)
AUTH_MODE=external

# Si se requiere token real para mapas, recomienda desactivar fallback a mock
AUTH_FALLBACK_TO_MOCK=false

# (Opcional) URL del autenticador externo
AUTH_URL=https://dev.wsautenticador.sapal.gob.mx/api/autenticador/fObtenerToken/

# (Solo desarrollo) permitir TLS no confiable si hay certificado corporativo/proxy
AUTH_ALLOW_INSECURE_TLS=true

# URL del MapServer real (opcional)
MAPSERVER_URL=https://wsorquestador.sapal.gob.mx/...

# Entorno
NODE_ENV=development

# (Opcional) Trazado de líneas: log temporal a archivo .txt (JSONL)
# En development se habilita por defecto.
# Cada línea guardada agrega un renglón JSON con timestamp, usuario, storage y geometry.
LINES_LOG_TO_FILE=true
LINES_LOG_FILE=./data/lines-temp.txt
```

## Estructura del Código

```
src/
├── server.js           # Servidor principal
├── routes/             # Definición de rutas
│   ├── auth.routes.js
│   ├── works.routes.js
│   ├── activities.routes.js
│   ├── evidence.routes.js
│   ├── sync.routes.js
│   └── maps.routes.js
├── controllers/        # Lógica de negocio
│   ├── auth.controller.js
│   ├── works.controller.js
│   ├── activities.controller.js
│   ├── evidence.controller.js
│   ├── sync.controller.js
│   └── maps.controller.js
├── middleware/         # Middleware personalizado
│   └── auth.middleware.js
└── data/               # Datos mock
    ├── users.data.js
    ├── works.data.js
    └── activities.data.js
```

## License

Propietario - SAPAL León
