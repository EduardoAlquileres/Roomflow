# Acceso privado a RoomFlow

Proyecto único: `ufpxewrtejuesfsmcgic`.

La contraseña de RoomFlow valida una cookie firmada. Las consultas del navegador
pasan por `/api/datos`, que valida la sesión y solo permite las tablas y funciones
de RoomFlow. Las páginas del servidor usan `supabaseServidor` mediante la condición
`react-server` de `#roomflow-supabase`. La clave administrativa nunca se importa en
los componentes del navegador. La integración con OneDrive solo se consulta desde
el servidor; el trabajo programado valida `CRON_SECRET`.

## Orden de activación

1. Guardar la clave `service_role` del proyecto activo en Vercel, en la variable
   secreta `SUPABASE_SERVICE_ROLE_KEY`, exclusivamente para Production.
   Mantener `ROOMFLOW_ACCESS_PASSWORD`. No usar un prefijo `NEXT_PUBLIC_` para la
   clave administrativa ni guardarla en Git. Para desarrollo, configurar las
   credenciales en `.env.local`, preferiblemente de una base de pruebas.
2. Publicar esta versión y comprobar el acceso con sesión a páginas, consultas y
   documentos. Sin sesión, `/api/datos/rest/v1/viviendas` debe devolver 401.
3. Ejecutar `seguridad_acceso_servidor.sql` en el proyecto indicado. La transacción
   activa RLS, retira permisos públicos y cierra las funciones y documentos.
   No elimina registros. Las tablas sin políticas son intencionales: solo el
   servidor autorizado puede acceder, mediante `service_role`.
4. Repetir las pruebas con sesión y comprobar con la clave pública que no se
   pueden leer tablas, firmar documentos ni ejecutar funciones de borrado.
   Para comprobar funciones, usar UUID inexistentes; nunca probar borrados de
   datos reales. Reejecutar Security Advisor.

No volver a desplegar la versión antigua después del paso 3: depende del acceso
público. Si hay un fallo, corregir el servidor manteniendo cerrada la base de datos.
Los scripts antiguos se han ajustado para no desactivar RLS ni volver a conceder
acceso a `anon`. Su ejecución aislada no sustituye a la migración de seguridad.

## Comprobaciones locales

`npm run build`

`node --test tests/seguridad.test.cjs tests/gastosCobros.test.cjs`

La compilación y las pruebas no equivalen a aplicar la protección en Supabase.
