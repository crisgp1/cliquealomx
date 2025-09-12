#!/bin/bash

echo "🚀 Configurando proyecto Cliquealomx..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    print_success "Node.js $NODE_VERSION está instalado"
else
    print_error "Node.js versión 18+ es requerida. Versión actual: $NODE_VERSION"
    exit 1
fi

# Instalar concurrently globalmente para el proyecto principal
print_message "Instalando dependencias del proyecto principal..."
npm install

# Instalar dependencias del backend
print_message "Instalando dependencias del backend..."
cd backend
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado en backend. Copiando .env.example..."
    cp .env.example .env
    print_warning "Por favor configura las variables de entorno en backend/.env"
fi
npm install
cd ..

# Instalar dependencias del frontend
print_message "Instalando dependencias del frontend..."
cd frontend
if [ ! -f .env.local ]; then
    print_warning "Archivo .env.local no encontrado en frontend. Copiando .env.local.example..."
    cp .env.local.example .env.local
    print_warning "Por favor configura las variables de entorno en frontend/.env.local"
fi
npm install
cd ..

print_success "¡Instalación completada!"
echo
print_message "Próximos pasos:"
echo "1. Configura las variables de entorno en backend/.env y frontend/.env.local"
echo "2. Asegúrate de tener MongoDB ejecutándose"
echo "3. Configura tu cuenta de Clerk y obtén las claves de API"
echo "4. Ejecuta 'npm run dev' para iniciar el proyecto en desarrollo"
echo
print_message "Comandos útiles:"
echo "- npm run dev           # Ejecutar en modo desarrollo"
echo "- npm run build         # Construir para producción"
echo "- npm run test          # Ejecutar tests"
echo "- npm run lint          # Ejecutar linter"
echo
print_success "¡Proyecto Cliquealomx listo para desarrollar! 🎉"
