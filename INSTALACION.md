# Guía de Instalación - SAPAL Obras Móvil

**Versión:** 0.1.0 MVP
**Fecha:** 2026-02-17

---

## Requisitos Previos

### Software Necesario
- **Node.js** 18+ (LTS recomendado)
- **npm** 9+ o **pnpm** 8+
- **Git** (opcional, para control de versiones)
- Navegador moderno: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Sistema Operativo
- Windows 10/11
- macOS 11+
- Linux (Ubuntu 20.04+, Debian 11+)

---

## Instalación Paso a Paso

### 1. Frontend (Aplicación PWA)

```bash
# Navegar al proyecto
cd sigsapal-mobile

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env si es necesario
# (Por defecto apunta a localhost:3001)

# Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### 2. Backend Mock (API REST)

**En otra terminal:**

```bash
# Navegar al backend
cd backend-mock

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

El backend estará disponible en: **http://localhost:3001**

---

## Verificación de Instalación

### 1. Verificar Backend

Abrir en navegador o usar curl:

```bash
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T...",
  "uptime": 123.45,
  "environment": "mock"
}
```

### 2. Verificar Frontend

Abrir en navegador: http://localhost:3000

Deberías ver:
1. ✅ Pantalla de carga con logo de SAPAL
2. ✅ Pantalla de login
3. ✅ Sin errores en consola del navegador

### 3. Probar Login

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin`

Otros usuarios disponibles:
- `supervisor` / `supervisor`
- `coordinador` / `coordinador`

Si el login es exitoso, serás redirigido a la pantalla Home.

---

## Solución de Problemas

### Error: "Cannot find module"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en sigsapal-mobile/vite.config.js
server: {
  port: 3005  // Cambiar a otro puerto disponible
}
```

### Error: "CORS policy blocked"

Verificar que:
1. El backend esté corriendo en puerto 3001
2. El `.env` del frontend tenga la URL correcta:
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

### Error: "Failed to fetch"

- Verificar que el backend esté corriendo
- Verificar la URL en `.env`
- Revisar consola del navegador para más detalles

---

## Estructura de Carpetas

```
OBRAS/
├── sigsapal-mobile/          # Frontend PWA
│   ├── src/
│   │   ├── main.js           # Punto de entrada
│   │   ├── scenes/           # Escenas de Phaser
│   │   ├── modules/          # Módulos de negocio
│   │   └── config/           # Configuración
│   ├── public/
│   │   └── index.html        # HTML principal
│   ├── package.json
│   └── vite.config.js
│
├── backend-mock/             # Backend simulado
│   ├── src/
│   │   ├── server.js         # Servidor Express
│   │   ├── routes/           # Rutas de API
│   │   ├── controllers/      # Controladores
│   │   ├── middleware/       # Middleware
│   │   └── data/             # Datos mock
│   └── package.json
│
└── docs/                     # Documentación
    └── endpoints.md          # Inventario de GIS
```

---

## Configuración Avanzada

### Variables de Entorno (Frontend)

Editar `sigsapal-mobile/.env`:

```bash
# URL del backend
VITE_API_BASE_URL=http://localhost:3001/api

# URL del MapServer (proxy a través del backend)
VITE_MAPSERVER_URL=http://localhost:3001/api/maps/proxy

# Habilitar modo debug
VITE_DEBUG=true

# Usar datos mock
VITE_MOCK_DATA=true
```

### Variables de Entorno (Backend)

Crear `backend-mock/.env`:

```bash
# Puerto del servidor
PORT=3001

# URL del MapServer real (opcional)
MAPSERVER_URL=https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData

# Entorno
NODE_ENV=development
```

---

## Build para Producción

### Frontend

```bash
cd sigsapal-mobile

# Build
npm run build

# Los archivos estarán en: dist/
# Servir con cualquier servidor web estático
```

**Opción 1: Servir con npm**
```bash
npm run preview
```

**Opción 2: Servir con servidor web**
```bash
# Nginx, Apache, etc.
# Configurar root a: dist/
```

### Backend

Para producción, reemplazar el backend mock con uno real conectado a base de datos.

---

## Pruebas en Dispositivos Móviles

### Opción 1: Mismo WiFi

1. Obtener IP local de tu computadora:
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig
   ```

2. Acceder desde dispositivo móvil:
   ```
   http://TU_IP:3000
   ```
   Ejemplo: `http://192.168.1.100:3000`

### Opción 2: ngrok (Túnel)

```bash
# Instalar ngrok
npm install -g ngrok

# Crear túnel
ngrok http 3000
```

Usar la URL HTTPS proporcionada por ngrok.

### Opción 3: Instalar como PWA

1. Abrir la app en navegador móvil
2. Chrome: Menú → "Agregar a pantalla de inicio"
3. Safari: Compartir → "Añadir a pantalla de inicio"

---

## Scripts Disponibles

### Frontend

```bash
npm run dev        # Desarrollo con hot-reload
npm run build      # Build para producción
npm run preview    # Preview del build
npm run lint       # Linter
npm test           # Tests (pendiente)
```

### Backend

```bash
npm run dev        # Desarrollo con nodemon
npm start          # Producción
```

---

## Próximos Pasos de Desarrollo

Para continuar con el desarrollo del MVP:

1. **MapAdapter** - Integrar motor de mapas (MapLibre o Leaflet)
2. **HomeScene completa** - Lista de obras con filtros
3. **WorkDetailScene** - Detalle de obra con mapa
4. **ActivityFormScene** - Formulario con validaciones del catálogo
5. **EvidenceModule** - Cámara y galería
6. **SyncService** - Cola offline y sincronización

Ver `docs/endpoints.md` para información sobre servicios GIS.

Ver `src/config/activities.json` para catálogo completo de actividades.

---

## Soporte y Recursos

- **Documentación completa:** Ver carpeta `docs/`
- **Inventario GIS:** `docs/endpoints.md`
- **Plan original:** `Plan_SigSapal_Phaser_App.md`
- **Progreso:** `PROGRESO.md`

### Contacto

Para dudas o problemas:
- Email: soporte@sapal.gob.mx
- Repositorio: (agregar URL cuando esté en control de versiones)

---

**¡Listo para desarrollar!** 🚀
