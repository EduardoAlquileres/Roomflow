# Mantenimiento de Supabase — 21 de octubre de 2026

Proyecto: `ufpxewrtejuesfsmcgic` (RoomFlow).

## Aplicado

- Migración remota `20261021155009_seguridad_indices_roomflow`.
- `roomflow_importe_suplemento`: `search_path=pg_catalog`, conservando fórmula, firma y permisos.
- Nueve índices no únicos sobre claves foráneas de cobros, estancias, fianzas, inquilinos, mensajes y propietarios de vivienda.
- Tiempo máximo de espera de bloqueo: 3 segundos. Tiempo máximo de sentencia: 60 segundos.
- Actualizada la definición original de la función en `suplementos_estancia.sql` para conservar este ajuste al recrearla.

## Verificado

- Conteo y huella del contenido completo de las 17 tablas públicas: 571 registros idénticos antes y después, sin diferencias.
- Pruebas de suplementos mensuales, prorrateos, febrero bisiesto y cargos puntuales correctas.
- Nueve índices nuevos presentes.
- Security Advisor: desaparece `function_search_path_mutable`.
- Performance Advisor: desaparecen las nueve relaciones sin índice.
- Permanecen avisos informativos esperados: RLS sin políticas públicas (el acceso es a través del servidor), e índices aún sin uso registrado. No se han abierto permisos públicos ni eliminado índices.
- No se ha modificado ningún componente, estilo, importe ni registro de negocio.

La comparación de huellas comprueba la integridad; no sustituye una copia de seguridad.

## PostgreSQL: pendiente de mantenimiento separado

La base continúa en PostgreSQL 17.6. La actualización de Supabase a 17.11 exige sacar temporalmente el proyecto de servicio y copiar/actualizar la instancia. No se ha iniciado esa operación.

Antes de actualizar: comprobar una copia de seguridad recuperable, revisar el destino y los avisos en el panel, acordar una ventana de mantenimiento y repetir las comprobaciones de integridad y de la aplicación después del cambio.

La revisión previa no encontró `ltree`, `btree_gist`, operadores personalizados afectados ni uso de cifrado legado de `pgcrypto` en RoomFlow.

Documentación: https://supabase.com/docs/guides/platform/upgrading
