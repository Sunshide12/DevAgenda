# Instrucciones para Corregir la Base de Datos

## Problema Identificado

El esquema original de la base de datos tenía dos problemas:
1. El campo `id` en la tabla `users` era de tipo UUID, pero el frontend genera IDs como strings (ej: `user_1767649344317_kkztb8krg`)
2. El campo `github_username` tenía la restricción `NOT NULL`, pero los usuarios se crean antes de conectar GitHub

## Solución

Necesitas ejecutar el script de migración en Supabase para corregir la estructura de la base de datos.

### Opción 1: Si NO tienes datos importantes (Recomendado para empezar de cero)

1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta este script completo:

```sql
-- Eliminar todas las tablas (si existen)
DROP TABLE IF EXISTS daily_tasks CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS daily_reflections CASCADE;
DROP TABLE IF EXISTS commits CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recrear la tabla users con el esquema correcto
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    github_username VARCHAR(255) UNIQUE,
    github_token TEXT,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recrear todas las demás tablas
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('POR_HACER', 'FUTURO', 'EN_CURSO', 'COMPLETADO')),
    github_repo VARCHAR(255),
    github_owner VARCHAR(255),
    color VARCHAR(7) DEFAULT '#6366f1',
    priority INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sha VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    commit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    url TEXT,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, sha)
);

CREATE TABLE daily_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    content TEXT,
    commits_count INTEGER DEFAULT 0,
    projects_worked INTEGER DEFAULT 0,
    feeling VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reflection_date)
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('SEMANAL', 'MENSUAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_commits INTEGER DEFAULT 0,
    total_additions INTEGER DEFAULT 0,
    total_deletions INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_commits_project_id ON commits(project_id);
CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(commit_date);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON daily_reflections(user_id, reflection_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reflections_updated_at BEFORE UPDATE ON daily_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Opción 2: Si YA tienes datos y quieres preservarlos

Ejecuta el script en `database/migration_fix_users.sql` que migra los datos existentes.

## Verificación

Después de ejecutar el script:

1. Verifica que la tabla `users` existe y tiene la estructura correcta:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

Deberías ver:
- `id` como `character varying` (VARCHAR)
- `github_username` como `character varying` con `YES` en is_nullable

2. Prueba crear un usuario manualmente:
```sql
INSERT INTO users (id) VALUES ('test_user_123');
```

Si funciona sin errores, la base de datos está correcta.

## Después de la Migración

1. Recarga la aplicación en Vercel
2. Limpia el localStorage del navegador (o genera un nuevo ID de usuario)
3. Intenta usar la aplicación nuevamente

Los errores deberían desaparecer.

