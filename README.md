# Cliquealomx

Una aplicación web moderna construida con arquitectura Domain Driven Design (DDD), utilizando Next.js para el frontend, NestJS para el backend, MongoDB con Mongoose para la base de datos, y Clerk para la autenticación.

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura DDD completa con separación clara de responsabilidades:

### Backend (NestJS)
- **Domain Layer**: Entidades, Value Objects, Repositorios y Eventos de dominio
- **Application Layer**: Casos de uso, DTOs y servicios de aplicación
- **Infrastructure Layer**: Implementaciones de repositorios, servicios externos y configuración
- **Presentation Layer**: Controladores, middlewares, guards y decorators

### Frontend (Next.js)
- **Domain Layer**: Entidades y repositorios (interfaces)
- **Application Layer**: Casos de uso y servicios
- **Infrastructure Layer**: Implementaciones de APIs y almacenamiento
- **Presentation Layer**: Componentes, páginas y hooks

## 🚀 Tecnologías

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript
- **Base de datos**: MongoDB con Mongoose
- **Autenticación**: Clerk
- **Validación**: Class Validator/Transformer

## 📦 Estructura del proyecto

```
cliquealomx/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── domain/          # Domain layer
│   │   ├── application/     # Application layer
│   │   ├── infrastructure/  # Infrastructure layer
│   │   └── presentation/    # Presentation layer
│   └── package.json
├── backend/                 # NestJS application
│   ├── src/
│   │   ├── domain/          # Domain layer
│   │   ├── application/     # Application layer
│   │   ├── infrastructure/  # Infrastructure layer
│   │   ├── presentation/    # Presentation layer
│   │   └── *.module.ts      # NestJS modules
│   └── package.json
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── README.md
```

## 🛠️ Configuración

### Prerrequisitos
- Node.js 18+
- MongoDB
- Cuenta en Clerk

### Variables de entorno

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/cliquealomx
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=3001
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Instalación

1. **Instalar dependencias del backend**:
```bash
cd backend
npm install
```

2. **Instalar dependencias del frontend**:
```bash
cd frontend
npm install
```

3. **Configurar MongoDB**:
   - Asegúrate de tener MongoDB ejecutándose
   - La aplicación creará la base de datos automáticamente

4. **Configurar Clerk**:
   - Crea una cuenta en [Clerk](https://clerk.com)
   - Obtén las claves de API
   - Configura las variables de entorno

## 🏃‍♂️ Ejecutar la aplicación

### Desarrollo

1. **Ejecutar el backend**:
```bash
cd backend
npm run start:dev
```

2. **Ejecutar el frontend**:
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Producción

1. **Build del backend**:
```bash
cd backend
npm run build
npm run start:prod
```

2. **Build del frontend**:
```bash
cd frontend
npm run build
npm run start
```

## 📚 Características DDD implementadas

### Backend
- ✅ Entidades de dominio con lógica de negocio
- ✅ Value Objects para validación de datos
- ✅ Repositorios con interfaces en el dominio
- ✅ Eventos de dominio
- ✅ Casos de uso en la capa de aplicación
- ✅ Separación clara de capas
- ✅ Inyección de dependencias

### Frontend
- ✅ Entidades de dominio adaptadas para React
- ✅ Repositorios para comunicación con APIs
- ✅ Casos de uso en la capa de aplicación
- ✅ Componentes de presentación separados
- ✅ Hooks personalizados para lógica de negocio

## 🔐 Autenticación

La aplicación utiliza Clerk para la autenticación, que proporciona:
- Registro e inicio de sesión
- Gestión de perfiles de usuario
- Protección de rutas
- Integración con redes sociales

## 📖 API Endpoints

### Usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:clerkId` - Obtener usuario por Clerk ID
- `GET /api/users` - Obtener todos los usuarios

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Si tienes preguntas o necesitas ayuda, puedes:
- Abrir un issue en GitHub
- Contactar al equipo de desarrollo

---

Desarrollado con ❤️ usando arquitectura DDD
