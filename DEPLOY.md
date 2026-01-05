# Guía de Despliegue - DevAgenda

## Despliegue en Vercel

### Paso 1: Preparar el Repositorio

1. Asegúrate de que todos los archivos estén commitados:
```bash
git add .
git commit -m "Initial commit - DevAgenda"
git push origin main
```

### Paso 2: Configurar Supabase

1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. Ir a **SQL Editor**
4. Copiar y ejecutar el contenido completo de `database/schema.sql`
5. Ir a **Settings > API** y copiar:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_KEY)

### Paso 3: Crear GitHub Personal Access Token

1. Ir a GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click en **Generate new token (classic)**
3. Darle un nombre (ej: "DevAgenda")
4. Seleccionar permisos:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Generar y copiar el token (empieza con `ghp_`)

### Paso 4: Desplegar en Vercel

1. Ir a [Vercel](https://vercel.com)
2. Iniciar sesión con tu cuenta de GitHub
3. Click en **Add New Project**
4. Importar el repositorio `devagenda` (o el nombre que le hayas dado)
5. En **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: (dejar vacío o `npm install`)
   - **Output Directory**: (dejar vacío)
6. Click en **Environment Variables** y agregar:
   ```
   SUPABASE_URL = tu_url_de_supabase
   SUPABASE_KEY = tu_clave_anon_de_supabase
   NODE_ENV = production
   FRONTEND_URL = https://tu-proyecto.vercel.app
   ```
   (Nota: GITHUB_TOKEN no es necesario aquí, se configura por usuario en la app)
7. Click en **Deploy**

### Paso 5: Verificar el Despliegue

1. Una vez completado el despliegue, Vercel te dará una URL
2. Abrir la URL en el navegador
3. Verificar que la aplicación carga correctamente

### Paso 6: Configurar la Aplicación

1. Ir a **Configuración** en la aplicación
2. Generar un ID de usuario (se guarda automáticamente en localStorage)
3. Conectar GitHub:
   - Ingresar el Personal Access Token que creaste
   - Ingresar tu username de GitHub
   - Click en **Conectar GitHub**

### Paso 7: Usar la Aplicación

1. Crear tu primer proyecto
2. Asociar un repositorio de GitHub si lo deseas
3. Sincronizar para obtener commits
4. Comenzar a usar la introspección diaria y generar reportes

## Solución de Problemas

### Error: "Cannot connect to database"
- Verificar que las variables de entorno en Vercel estén correctas
- Verificar que el esquema SQL se haya ejecutado en Supabase
- Verificar que la URL y clave de Supabase sean correctas

### Error: "GitHub token not configured"
- Asegúrate de haber conectado GitHub en la sección de Configuración
- Verificar que el token tenga los permisos correctos
- Verificar que el token no haya expirado

### Error: "Authentication required"
- Verificar que tengas un ID de usuario generado
- Limpiar localStorage y generar un nuevo ID
- Verificar que el header `X-User-Id` se esté enviando en las peticiones

### La aplicación no carga
- Verificar que el build en Vercel haya sido exitoso
- Revisar los logs de Vercel para errores
- Verificar que `vercel.json` esté correctamente configurado

## Variables de Entorno Requeridas

### En Vercel:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: Clave anónima pública de Supabase
- `NODE_ENV`: `production`
- `FRONTEND_URL`: URL de tu aplicación en Vercel (opcional, para CORS)

### En la Aplicación (Configuración):
- GitHub Personal Access Token (se guarda por usuario)
- User ID (se genera automáticamente)

## Notas Importantes

1. **Seguridad**: El token de GitHub se almacena en la base de datos por usuario. En producción, considera encriptar estos tokens.

2. **Base de Datos**: Supabase tiene un límite gratuito generoso, pero si esperas mucho tráfico, considera un plan de pago.

3. **Rate Limits**: GitHub API tiene límites de rate. Si sincronizas muchos proyectos frecuentemente, podrías alcanzar el límite.

4. **CORS**: Si tienes problemas de CORS, verifica que `FRONTEND_URL` en Vercel apunte a tu dominio correcto.

## Actualizaciones Futuras

Para actualizar la aplicación:
1. Hacer cambios en el código
2. Commit y push a GitHub
3. Vercel desplegará automáticamente los cambios

## Soporte

Si encuentras problemas:
1. Revisar los logs en Vercel Dashboard
2. Revisar la consola del navegador para errores
3. Verificar que todas las variables de entorno estén configuradas
4. Abrir un issue en el repositorio de GitHub

