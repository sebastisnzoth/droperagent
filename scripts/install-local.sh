#!/bin/bash
# Instalación local para sistemas sin Docker

set -e

echo "🚀 Instalando DroperAgent localmente"
echo "===================================="

# Verificar PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP no encontrado"
    exit 1
fi

PHP_VERSION=$(php -v | head -1)
echo "✅ PHP: $PHP_VERSION"

# Verificar Composer
if ! command -v composer &> /dev/null; then
    echo "📦 Instalando Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

# Verificar MySQL/MariaDB
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL/MariaDB no encontrado - usar SQLite"
    USE_SQLITE=1
else
    echo "✅ MySQL disponible"
fi

# Instalar dependencias Node.js
echo "📦 Instalando dependencias Node.js..."
npm install

# Instalar dependencias PHP (si hay WordPress local)
if [ -d "/Applications/MAMP" ] || [ -d "/usr/local/mysql" ]; then
    echo "📦 Instalando dependencias PHP..."
    if [ -f "composer.json" ]; then
        composer install --no-interaction
    fi
fi

# Crear bases de datos SQLite
mkdir -p data
touch data/droperagent.db

# Configurar .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚙️  Archivo .env creado - configure las credenciales"
fi

# Crear script de inicialización
cat > init-db.js << 'EOF'
const Database = require('better-sqlite3');
const db = new Database('./data/droperagent.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('✅ Base de datos inicializada');
EOF

echo "✅ Instalación completada!"
echo ""
echo "Para iniciar:"
echo "  npm start"
echo ""
echo "Para desarrollo:"
echo "  npm run dev"