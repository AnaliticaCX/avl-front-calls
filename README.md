# avl-front-calls — consulta de históricos, quemadores y RUAF

Aplicación web de Avalogic para consultar el historial de gestión de cobranza (llamadas, chats, SMS y
correos), los reportes fijos de cartera ("quemadores") y operar el proceso automático de consultas a
RUAF. No tiene backend propio: todo lo lee de la API
[`avl-app-datalake`](../avl-app-datalake/README.md), que a su vez consulta el datalake.

Next.js (App Router) con React, Tailwind y TypeScript.

## Funcionalidades

La navegación se define en [`app/config/navigation.ts`](app/config/navigation.ts) y se organiza en tres
áreas.

### Históricos

| Pantalla | Ruta | Qué permite |
|---|---|---|
| Reporte CDR | `/calls/general` | Reporte general de llamadas y su detalle por llamada. |
| Detalle de llamadas | `/calls/detalle_llamadas` | Llamadas conectadas. |
| No conectadas | `/calls/detalle_llamadas_no_conectadas` | Llamadas que no se conectaron. |
| IVR | `/calls/ivr` | Recorrido de la llamada por el IVR. |
| Tipificación | `/calls/detalle_tipificacion` | Tipificación que el agente asignó a la llamada. |
| Chats | `/chats` | Conversaciones por ID, cliente, teléfono, email y rango de fechas; abrir y descargar la conversación. |
| SMS | `/sms` | Mensajes por teléfono, palabra clave o rango de fechas; exige al menos un criterio. |
| Correos | `/emails` | Correos por remitente, destinatario, asunto, canal o rango de fechas; descarga del correo en PDF. |

Cada llamada tiene una vista de detalle (`/calls/[conn_id]`) que reúne la información de sus cinco
fuentes (CDR, conectada, no conectada, IVR y tipificación).

### Quemadores

| Pantalla | Ruta | Qué permite |
|---|---|---|
| Paz y salvo | `/quemadores/paz_salvo` | Gestiones, acuerdos de pago y valores pagados por número de obligación. |
| Contactos | `/quemadores/contactos` | Teléfonos y correos asociados a una obligación. |
| Estado de cuenta | `/quemadores/estado_cuenta` | Muestra los pagos de una obligación, una vista previa del documento y lo descarga en Word; la plantilla legal (Resfin, Moviaval o Avalogic, de aval o de compra de cartera) se elige sola. Las reglas del cálculo están en la API: [estado_cuenta.md](../avl-app-datalake/docs/estado_cuenta.md). |

### RUAF

`/ruaf` muestra la disponibilidad del proceso automático de consultas a RUAF, su avance en vivo y su
historial; permite pausarlo, reanudarlo y limpiarlo, subir un lote de cédulas y descargar el resultado.
El lote se sube directo a S3 con una URL prefirmada que entrega la API.

### Comportamiento común

- **Búsquedas.** Filtros por pantalla, paginación del lado del servidor y estado de tabla recordado
  (los hooks están en [`app/hooks/`](app/hooks/)). Las pantallas llevan una guía "¿Cómo buscar?" que el
  usuario puede ocultar; esa preferencia y el colapso del menú lateral se guardan en `localStorage`.
- **Exportación.** Los resultados se descargan como JSON, XLSX o PDF ([`app/utils/download.ts`](app/utils/download.ts)).
- **Estado de la API.** La barra superior indica si la API responde (`/healthz`).

## Autenticación

No hay usuarios ni contraseñas: la pantalla `/login` pide el token de acceso de la API, lo guarda en
`localStorage` (clave `app_auth_token`) y lo envía como `Authorization: Bearer` en cada request
([`app/utils/api.ts`](app/utils/api.ts)). Todas las rutas, salvo `/login`, pasan por
`ProtectedLayout`, que redirige al login si no hay token. Un 401 de la API se muestra como "token de
autenticación inválido o expirado". Quién tiene acceso se administra en la API, en su lista de tokens.

## Configuración

| Variable | Por defecto | Para qué |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL base de la API que consume el navegador. |
| `API_PROXY_TARGET` | vacía | Solo desarrollo local. Si se define, Next reenvía `/api/*` y `/healthz` a ese destino desde el servidor, para que el navegador nunca salga de su origen. |

El API Gateway solo admite CORS desde el dominio de producción del front, por eso en local se usa el
proxy: `API_PROXY_TARGET` apunta al API Gateway y `NEXT_PUBLIC_API_URL` al propio origen de Next
(`http://localhost:3000`), de modo que el navegador le habla a Next y este reenvía a la API. En
producción `NEXT_PUBLIC_API_URL` es la URL de la API y el navegador le habla directo. Si el front se sirve desde un
dominio nuevo, ese dominio se agrega en `CORS_ORIGINS` de la API.

Las variables viven en `.env.local`, que no se versiona.

## Desarrollo

```bash
npm install
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run lint
```

## Estructura

| Ruta | Contenido |
|---|---|
| `app/<área>/` | Una carpeta por pantalla (`calls`, `chats`, `sms`, `emails`, `quemadores`, `ruaf`, `login`). |
| `app/components/` | Componentes compartidos: tabla, filtros, paginación, estados vacíos y de error, y el shell (barra lateral, barra superior, estado de la API). |
| `app/hooks/` | Búsqueda paginada, filtros, estado de tabla, cancelación de requests y `localStorage`. |
| `app/utils/` | Cliente de la API, token, formateadores, validadores y generación de descargas. |
| `app/types/` | Tipos de las respuestas de la API por dominio. |
| `app/config/` | Variables de entorno y navegación. |
| `app/context/` | Contexto de autenticación. |
