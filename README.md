# DevAgenda

Aplicación web profesional de gestión de proyectos y seguimiento de desarrollo con integración de GitHub.

## Descripción

DevAgenda es una aplicación web que permite a los desarrolladores organizar su trabajo diario de manera similar a Notion, con integración automática de GitHub para el seguimiento de commits. La aplicación proporciona una vista completa de los proyectos en diferentes estados, permite la introspección diaria del trabajo realizado mediante visualización de commits organizados por fecha y hora, y genera reportes semanales y mensuales con formato empresarial profesional.

## Características

- ✅ Organización diaria tipo Notion para gestión de tareas y proyectos
- ✅ Integración automática con GitHub para sincronización de commits
- ✅ Gestión de proyectos en estados: Por Hacer, Futuros, En Curso
- ✅ Visualización detallada de commits por día, fecha y hora para introspección laboral
- ✅ Generación de reportes semanales y mensuales con formato empresarial
- ✅ Interfaz intuitiva y amigable con diseño moderno usando Bootstrap 5
- ✅ Base de datos PostgreSQL desplegable en Supabase
- ✅ Arquitectura separada frontend/backend para escalabilidad

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL (Supabase)
- **Integración**: GitHub API
- **Despliegue**: Vercel

## Instalación

### Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase
- Cuenta de GitHub con Personal Access Token

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Sunshide12/devagenda.git
cd devagenda
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` basado en `.env.example`:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_clave_de_supabase
GITHUB_TOKEN=tu_token_de_github
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

4. **Configurar base de datos**

Ejecutar el script SQL en Supabase:
- Ir a Supabase Dashboard
- Seleccionar SQL Editor
- Copiar y ejecutar el contenido de `database/schema.sql`

5. **Ejecutar la aplicación**

Para desarrollo:
```bash
npm run dev
```

Para producción:
```bash
npm start
```

## Despliegue en Vercel

### Pasos para Desplegar

1. **Preparar el repositorio**
   - Asegúrate de que todos los cambios estén commitados
   - Push al repositorio de GitHub

2. **Conectar con Vercel**
   - Ir a [Vercel](https://vercel.com)
   - Iniciar sesión con tu cuenta de GitHub
   - Importar el repositorio `devagenda`

3. **Configurar Variables de Entorno en Vercel**
   - En la configuración del proyecto, agregar:
     - `SUPABASE_URL`: Tu URL de Supabase
     - `SUPABASE_KEY`: Tu clave anónima de Supabase
     - `GITHUB_TOKEN`: (Opcional, puede configurarse por usuario)
     - `NODE_ENV`: `production`
     - `FRONTEND_URL`: Tu URL de Vercel

4. **Desplegar**
   - Vercel detectará automáticamente la configuración
   - El despliegue se realizará automáticamente

### Configuración de Vercel

El archivo `vercel.json` ya está configurado para:
- Servir el backend en `/api/*`
- Servir archivos estáticos del frontend
- Redirigir todas las rutas al `index.html` para SPA

## Uso

### Primer Uso

1. Abrir la aplicación
2. Ir a **Configuración**
3. Generar un ID de usuario (se guarda automáticamente)
4. Conectar tu cuenta de GitHub:
   - Crear un Personal Access Token en GitHub con permisos de repositorio
   - Ingresar el token y tu username en Configuración
   - Hacer clic en "Conectar GitHub"

### Crear un Proyecto

1. Ir a **Proyectos**
2. Hacer clic en **Nuevo Proyecto**
3. Completar el formulario:
   - Nombre del proyecto
   - Descripción
   - Estado (Por Hacer, Futuro, En Curso)
   - Repositorio de GitHub (opcional)
4. Guardar

### Sincronizar con GitHub

1. En la página de proyectos, hacer clic en **Sincronizar** en cualquier proyecto
2. O usar **Sincronizar GitHub** en el Dashboard para sincronizar todos los proyectos

### Introspección Diaria

1. Ir a **Introspección Diaria**
2. Ver los commits del día organizados por proyecto
3. Escribir tu reflexión sobre el día
4. Seleccionar cómo te sientes
5. Guardar

### Generar Reportes

1. Ir a **Reportes**
2. Hacer clic en **Reporte Semanal** o **Reporte Mensual**
3. Ver el reporte generado con formato empresarial
4. Imprimir si es necesario

## Estructura del Proyecto

```
devagenda/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de Supabase
│   ├── controllers/
│   │   ├── projectController.js
│   │   ├── githubController.js
│   │   ├── reportController.js
│   │   └── reflectionController.js
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación
│   ├── routes/
│   │   ├── projects.js
│   │   ├── github.js
│   │   ├── reports.js
│   │   └── reflections.js
│   ├── services/
│   │   ├── githubService.js     # Servicio de GitHub API
│   │   ├── projectService.js
│   │   ├── commitService.js
│   │   ├── reportService.js
│   │   └── dailyReflectionService.js
│   └── server.js                # Servidor Express
├── frontend/
│   ├── css/
│   │   └── styles.css           # Estilos personalizados
│   ├── js/
│   │   ├── config.js            # Configuración
│   │   ├── api.js               # Cliente API
│   │   └── app.js               # Lógica principal
│   └── index.html               # Página principal
├── database/
│   └── schema.sql               # Esquema de base de datos
├── .env.example                 # Ejemplo de variables de entorno
├── package.json
├── vercel.json                  # Configuración de Vercel
└── README.md                    # Este archivo
```

## API Endpoints

### Proyectos
- `GET /api/projects` - Obtener todos los proyectos
- `GET /api/projects/by-status` - Obtener proyectos por estado
- `GET /api/projects/:id` - Obtener un proyecto
- `POST /api/projects` - Crear proyecto
- `PUT /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto
- `POST /api/projects/:id/sync` - Sincronizar con GitHub
- `GET /api/projects/:id/commits` - Obtener commits
- `GET /api/projects/:id/stats` - Obtener estadísticas

### GitHub
- `POST /api/github/connect` - Conectar cuenta de GitHub
- `GET /api/github/repositories` - Obtener repositorios
- `GET /api/github/user` - Obtener información del usuario

### Reportes
- `GET /api/reports/weekly` - Generar reporte semanal
- `GET /api/reports/monthly` - Generar reporte mensual
- `GET /api/reports` - Obtener todos los reportes
- `GET /api/reports/:id` - Obtener un reporte

### Reflexiones
- `GET /api/reflections` - Obtener reflexión diaria
- `PUT /api/reflections` - Actualizar reflexión

## Autenticación

La aplicación usa un sistema de autenticación simple basado en ID de usuario. En producción, se recomienda implementar JWT o OAuth.

Para usar la API, incluir el header:
```
X-User-Id: tu_user_id
```

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Autor

**Sunshide12**

## Soporte

Para soporte, abre un issue en el repositorio de GitHub.

