# TechTest - Sistema de Gestión de Operaciones Financieras

Un sistema completo de monorepo para gestionar operaciones financieras con autenticación JWT. Construido con backend Node.js/Express, frontend React, y base de datos PostgreSQL.
Pruebalo en la siguiente URL: https://app-smart-jacobopp7.replit.app/login
## 🚀 Inicio Rápido

Sigue estos pasos para ejecutar la aplicación localmente:

### 1. Prerrequisitos
- Node.js 18+ instalado
- Base de datos PostgreSQL (local o en la nube)
- Git

### 2. Clonar e Instalar Dependencias
```bash
git clone <repository-url>
cd tech-test
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con:
```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/techtest
JWT_SECRET=tu-clave-secreta-jwt-super-segura-aqui
NODE_ENV=development
```

### 4. Configurar Base de Datos
```bash
# Aplicar schema a la base de datos
npm run db:push
```

### 5. Ejecutar la Aplicación
```bash
# Ejecutar en modo desarrollo (backend + frontend)
npm run dev
```

La aplicación estará disponible en: `http://localhost:5000`

## 📋 Características Principales

### 🔐 Sistema de Autenticación
- **JWT Authentication**: Tokens seguros con expiración configurable
- **Encriptación de Contraseñas**: bcrypt con salt rounds para máxima seguridad
- **Rutas Protegidas**: Middleware de autenticación en todas las rutas sensibles
- **Gestión de Sesiones**: Tokens almacenados en localStorage con validación automática

### 💰 Gestión de Operaciones Financieras
- **Tipos de Operación**: BUY (Compra) y SELL (Venta)
- **Múltiples Monedas**: Soporte para 12 monedas (USD, EUR, BTC, ETH, etc.)
- **Validación de Montos**: Cantidades deben ser mayores a 0
- **Precisión Decimal**: Hasta 2 decimales para monedas fiat, 8 para criptomonedas

### 📊 Dashboard Interactivo
- **Estadísticas en Tiempo Real**: Total de operaciones, compras y ventas
- **Filtros Avanzados**: Por tipo, moneda, texto de búsqueda
- **Paginación**: Navegación eficiente de grandes volúmenes de datos
- **Interfaz Responsiva**: Optimizada para desktop y móvil

### 🛠️ Arquitectura Robusta
- **Transacciones de Base de Datos**: ACID compliance con rollback automático
- **Patrón Repository**: Separación clara entre controladores, servicios y datos
- **Manejo de Errores**: Códigos específicos por tipo de error
- **Validación en Capas**: Cliente, servidor y base de datos

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto
```
tech-test/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── contexts/       # Context API (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilidades y configuración
│   │   ├── pages/          # Páginas de la aplicación
│   │   └── utils/          # Funciones auxiliares
├── server/                 # Backend Express
│   ├── services/           # Lógica de negocio
│   ├── db.ts              # Configuración de base de datos
│   ├── routes.ts          # Definición de rutas API
│   └── storage.ts         # Capa de acceso a datos
├── shared/                 # Código compartido
│   └── schema.ts          # Esquemas y tipos TypeScript
└── scripts/               # Scripts de utilidad
```

### Stack Tecnológico

#### Frontend
- **React 18**: Biblioteca de UI con hooks modernos
- **TypeScript**: Tipado estático para mayor confiabilidad
- **Vite**: Build tool rápido con HMR
- **Tailwind CSS**: Framework CSS utility-first
- **shadcn/ui**: Componentes preconfigurados con Radix UI
- **React Query**: Gestión de estado del servidor y caché
- **React Hook Form**: Manejo de formularios con validación
- **wouter**: Router ligero para SPA

#### Backend
- **Node.js + Express**: Servidor web robusto y escalable
- **TypeScript**: Desarrollo type-safe
- **Drizzle ORM**: ORM moderno con inferencia de tipos
- **PostgreSQL**: Base de datos relacional confiable
- **bcryptjs**: Encriptación segura de contraseñas
- **jsonwebtoken**: Gestión de tokens JWT
- **Zod**: Validación de esquemas en runtime

#### Base de Datos
- **PostgreSQL con Neon**: Base de datos serverless escalable
- **Drizzle Kit**: Migraciones automáticas
- **Relaciones Tipadas**: Foreign keys con cascada
- **Restricciones**: Validación a nivel de base de datos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo
npm run check        # Verificación de tipos TypeScript

# Producción
npm run build        # Construir para producción
npm start           # Ejecutar build de producción

# Base de Datos
npm run db:push     # Aplicar cambios de schema a la BD
```

## 🔑 Configuración de Autenticación

### Usuarios por Defecto
Para pruebas, puedes usar estas credenciales:
- **Email**: `admin@app.com`
- **Contraseña**: `admin123`

### JWT Configuration
- **Expiración**: 24 horas por defecto
- **Algoritmo**: HS256
- **Header**: `Authorization: Bearer <token>`

## 📡 API Endpoints

### Autenticación
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@app.com",
  "password": "admin123"
}
```

### Operaciones
```http
# Crear operación
POST /api/operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "BUY",
  "amount": "100.50",
  "currency": "USD"
}

# Obtener operaciones (con filtros)
GET /api/operations?type=BUY&currency=USD&page=1&limit=10
Authorization: Bearer <token>

# Estadísticas
GET /api/operations/stats
Authorization: Bearer <token>
```

## 🔒 Seguridad

### Medidas Implementadas
- **Autenticación JWT**: Tokens firmados y verificados
- **Encriptación de Contraseñas**: bcrypt con salt rounds
- **Validación de Entrada**: Zod schemas en todas las rutas
- **Restricciones de BD**: Constraints a nivel de base de datos
- **CORS Configurado**: Control de acceso desde otros dominios
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Sanitización**: Prevención de inyección SQL

### Variables Sensibles
Las siguientes variables deben mantenerse seguras:
- `JWT_SECRET`: Clave para firmar tokens
- `DATABASE_URL`: Cadena de conexión a la base de datos

## 🧪 Validaciones y Reglas de Negocio

### Validaciones de Operación
- **Monto**: Debe ser mayor a 0 y un número válido
- **Moneda**: Solo monedas soportadas (USD, EUR, BTC, etc.)
- **Tipo**: Solo "BUY" o "SELL"
- **Precisión**: Máximo 2 decimales para fiat, 8 para crypto

### Límites Implementados
- **Operaciones Diarias**: Máximo 10 operaciones por usuario/día
- **Monto Máximo**: $10,000 USD por operación individual
- **Paginación**: Máximo 100 resultados por página

### Transacciones
- **ACID Compliance**: Todas las operaciones son atómicas
- **Rollback Automático**: En caso de error, se revierte la transacción
- **Logs de Auditoría**: Todas las operaciones quedan registradas

## 🎨 Interfaz de Usuario

### Características de UX
- **Diseño Responsivo**: Funciona en desktop, tablet y móvil
- **Tema Oscuro/Claro**: Modo automático según preferencias del sistema
- **Feedback Visual**: Toasts, loading states y confirmaciones
- **Accesibilidad**: Componentes con ARIA labels y navegación por teclado
- **Performance**: Lazy loading y optimizaciones de renderizado

### Componentes Principales
- **Dashboard**: Vista principal con estadísticas y operaciones
- **Formulario de Operaciones**: Creación rápida con validación en tiempo real
- **Tabla de Datos**: Filtros, búsqueda y paginación
- **Sistema de Autenticación**: Login seguro con manejo de errores

## 🚀 Despliegue

### Variables de Entorno de Producción
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=super-secure-jwt-secret-production
```

### Consideraciones
- Usar HTTPS en producción
- Configurar CORS para dominios específicos
- Implementar logging y monitoreo
- Configurar backups automáticos de la base de datos

## 🐛 Solución de Problemas

### Problemas Comunes

**Error: "Invalid token"**
- Verificar que JWT_SECRET esté configurado
- Comprobar formato del token en Authorization header

**Error de conexión a la base de datos**
- Verificar DATABASE_URL
- Asegurar que PostgreSQL esté ejecutándose
- Revisar permisos de usuario de la base de datos

**Errores de validación**
- Verificar formato de los datos de entrada
- Revisar que las monedas estén en la lista soportada
- Confirmar que los montos sean números positivos

**Problemas de CORS**
- Verificar configuración del frontend URL
- Revisar headers permitidos en Express

## 🤝 Contribución

### Guías de Desarrollo
1. **TypeScript**: Todo el código debe estar tipado
2. **Validación**: Usar Zod para todos los inputs
3. **Error Handling**: Manejar errores específicos con códigos apropiados
4. **Testing**: Escribir tests para nueva funcionalidad
5. **Documentation**: Documentar funciones complejas

### Estructura de Commits
```
type(scope): description

feat(auth): add password reset functionality
fix(operations): resolve currency validation issue
docs(readme): update API documentation
```

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ usando tecnologías modernas de JavaScript/TypeScript**
