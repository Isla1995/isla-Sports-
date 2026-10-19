# Isla Sports — proyecto web inicial

Este paquete es el código de una web estática para Isla Sports, preparada para usar Supabase Auth y las tablas existentes `profiles` y `matches`.

## Antes de publicar
1. En `config.js`, sustituye `PEGA_AQUI_TU_SUPABASE_PROJECT_URL` y `PEGA_AQUI_TU_SUPABASE_PUBLISHABLE_KEY` por los valores públicos del proyecto Supabase.
2. No añadas contraseñas de base de datos ni la clave `service_role` al navegador.
3. Publica estos archivos en un hosting estático HTTPS (por ejemplo GitHub Pages o Netlify).
4. En Supabase, configura las URL permitidas de Auth para incluir la URL final de la web.

## Funciones que incluye
- Crear cuenta e iniciar sesión por correo y contraseña.
- Leer perfil y puntos de `profiles`.
- Mostrar los partidos de `matches`.
- Mostrar el formulario para agregar partidos cuando el perfil tenga `role = admin`.

## Importante: no está listo para invitar usuarios todavía
Este paquete es un punto de partida funcional, no una app verificada en tu proyecto. La lectura de partidos depende de las políticas RLS de Supabase. La creación de partidos requiere una política INSERT que permita solo al administrador. Cada usuario nuevo necesita una fila en `profiles` con `id` igual al ID de su usuario de Auth. La tabla `picks` no se usa aún porque hay que confirmar sus columnas antes de registrar pronósticos o modificar puntos de forma segura.

Antes de compartir el enlace con otras personas, hay que probar registro, inicio de sesión, lectura de partidos y permisos de administrador. La clave pública de Supabase puede estar en el navegador; la seguridad real debe estar en RLS y funciones seguras del servidor.
